// HTTP-хелперы: JSON-ответы, ошибки, JWT (HS256 на node:crypto), rate limiting, ETag
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import type { ZodType } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string, public details?: unknown) {
    super(message ?? code);
  }
}

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, init);
}

export function etagFor(payload: string): string {
  return '"' + createHash('sha1').update(payload).digest('hex').slice(0, 20) + '"';
}

export function withEtag(req: Request, data: unknown, extraHeaders: Record<string, string> = {}) {
  const body = JSON.stringify(data);
  const tag = etagFor(body);
  if (req.headers.get('if-none-match') === tag) return new Response(null, { status: 304, headers: { ETag: tag, ...extraHeaders } });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', ETag: tag, 'Cache-Control': 'private, max-age=60', ...extraHeaders } });
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw new ApiError(400, 'bad_json', 'Тело запроса не JSON'); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ApiError(422, 'validation_error', 'Невалидное тело запроса', parsed.error.flatten());
  return parsed.data;
}

/** Единая обёртка route handler: ловит ApiError и неожиданные ошибки. */
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.code, message: e.message, details: e.details ?? null }, { status: e.status });
      console.error('[aibackend]', e);
      return json({ error: 'internal', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
    }
  };
}

export async function params<T extends Record<string, string>>(ctx: { params: Promise<T> | T }): Promise<T> {
  return await ctx.params;
}

// ─── JWT (HS256) ──────────────────────────────────────────────────────────────
const secret = () => process.env.JWT_SECRET ?? 'signal-arena-dev-secret-change-me';
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export interface TokenClaims { sub: string; dev: string; seg: string; iat: number; exp: number; }

export function signToken(claims: Omit<TokenClaims, 'iat' | 'exp'>, ttlSec = 60 * 60 * 24 * 90): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64u(JSON.stringify({ ...claims, iat: now, exp: now + ttlSec }));
  const sig = createHmac('sha256', secret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): TokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new ApiError(401, 'bad_token');
  const expected = createHmac('sha256', secret()).update(`${parts[0]}.${parts[1]}`).digest();
  const got = Buffer.from(parts[2], 'base64url');
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) throw new ApiError(401, 'bad_signature');
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as TokenClaims;
  if (claims.exp < Math.floor(Date.now() / 1000)) throw new ApiError(401, 'token_expired');
  return claims;
}

export function requireAuth(req: Request): TokenClaims {
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) throw new ApiError(401, 'unauthorized', 'Нужен Bearer-токен (POST /api/v1/auth/anonymous)');
  return verifyToken(m[1].trim());
}

export function requireAdmin(req: Request) {
  const expected = process.env.ADMIN_TOKEN ?? 'admin-dev-token';
  const got = req.headers.get('x-admin-token') ?? new URL(req.url).searchParams.get('admin_token') ?? '';
  if (got !== expected) throw new ApiError(403, 'admin_forbidden', 'Нужен заголовок X-Admin-Token');
}

// ─── Rate limiting (in-memory, на процесс; для прод — Redis) ─────────────────
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return; }
  b.n++;
  if (b.n > limit) throw new ApiError(429, 'rate_limited', 'Слишком много запросов', { retryAfterMs: b.reset - now });
}

export function deterministicSeed(...parts: (string | number)[]): number {
  const h = createHmac('sha256', secret()).update(parts.join('|')).digest();
  return h.readUInt32BE(0) >>> 0;
}

export function todayKey(d = new Date()): string { return d.toISOString().slice(0, 10); }
export function dayKeyOffset(offsetDays: number): string { const d = new Date(); d.setUTCDate(d.getUTCDate() + offsetDays); return todayKey(d); }
