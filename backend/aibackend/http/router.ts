// Роутер REST API v1 (ТЗ Часть 6 §5.1; Приложение Г). Один catch-all handler Next.js делегирует сюда.
import { ApiError, json, parseBody, rateLimit, requireAdmin, requireAuth, withEtag, type TokenClaims } from './index';
import {
  AnonAuthSchema, AttemptSchema, AttemptBatchSchema, SessionStartSchema, SessionEndSchema, MicrocheckSchema, EventsSchema,
  AiDraftRequestSchema, DraftReviewSchema, ConfigPublishSchema, TournamentCreateSchema,
} from '../schemas';
import { z } from 'zod';
import { anonymousLogin, linkEmail } from '../services/auth';
import { getContentPackage, publicPackage, resolveTemplate } from '../services/content';
import { getConfig, publishConfig } from '../services/config';
import { progressView, loadSnapshot } from '../services/progress';
import { issueDailySeeds, nextTask, refreshQueue, warmupView } from '../services/scheduler';
import { processAttempt } from '../services/attempts';
import { chaptersView, lessonView, submitMicrocheck } from '../services/academy';
import { startSession, endSession, shadowFor, createTournament, listTournaments, joinTournament, leaderboard, ingestEvents, analyticsDashboard, purchase } from '../services/social';
import { aiStatus, generateDrafts, listDrafts, getDraft, reviewDraft } from '../ai/pipeline';
import { autotestPackage } from '../engine/autotest';
import { generate, toPublic } from '../engine/generator';
import { mutate } from '../engine/mutator';
import { cards } from '../content/cards';
import { enemies } from '../content/enemies';
import { combos } from '../content/combos';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

interface Ctx { req: Request; params: Record<string, string>; query: URLSearchParams; claims: TokenClaims | null; ip: string; }
type Handler = (c: Ctx) => Promise<unknown | Response>;
interface Route { method: string; re: RegExp; keys: string[]; auth: 'none' | 'user' | 'admin'; fn: Handler; }

const routes: Route[] = [];
function add(method: string, path: string, auth: Route['auth'], fn: Handler) {
  const keys: string[] = [];
  const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ method, re, keys, auth, fn });
}
const uid = (c: Ctx) => c.claims!.sub;

// ─── auth ───────────────────────────────────────────────────────────────────
add('POST', '/auth/anonymous', 'none', async c => { rateLimit('auth:' + c.ip, 30, 60_000); const b = await parseBody(c.req, AnonAuthSchema); return anonymousLogin(b.deviceId, b.userAgent ?? c.req.headers.get('user-agent') ?? undefined); });
add('POST', '/auth/link-email', 'user', async c => { const b = await parseBody(c.req, z.object({ email: z.string().email() })); return linkEmail(c.claims!, b.email); });
add('GET', '/me', 'user', async c => { const s = await loadSnapshot(uid(c)); return { userId: s.userId, deviceId: c.claims!.dev, segment: c.claims!.seg, level: s.level, epoch: s.epoch, xp: s.xp, xpMax: s.xpMax, coins: s.row.coins, riskBudget: s.row.riskBudget, streak: s.row.streak }; });

// ─── content / config ──────────────────────────────────────────────────────
add('GET', '/content', 'none', async c => withEtag(c.req, publicPackage(await getContentPackage())));
add('GET', '/content/version', 'none', async () => ({ version: (await getContentPackage()).version }));
add('GET', '/config', 'none', async c => withEtag(c.req, await getConfig(c.query.get('segment') ?? c.claims?.seg ?? 'default')));

// ─── seeds / scheduler / tasks ─────────────────────────────────────────────
add('GET', '/seeds/daily', 'user', async c => ({ seeds: await issueDailySeeds(uid(c), 3) }));
add('GET', '/schedule', 'user', async c => { const r = await refreshQueue(uid(c)); return { weather: r.weather, items: r.items }; });
add('GET', '/warmup', 'user', async c => warmupView(uid(c)));
add('GET', '/tasks/next', 'user', async c => nextTask(uid(c)));
add('GET', '/tasks/:templateId', 'user', async c => { const seed = c.query.get('seed'); return nextTask(uid(c), { templateId: c.params.templateId, seed: seed ? Number(seed) >>> 0 : undefined }); });

// ─── attempts (валидация по seed) ──────────────────────────────────────────
add('POST', '/attempts', 'user', async c => { rateLimit('att:' + uid(c), 120, 60_000); const b = await parseBody(c.req, AttemptSchema); return processAttempt(uid(c), c.claims!.dev, b); });
add('POST', '/attempts/batch', 'user', async c => {
  rateLimit('attb:' + uid(c), 20, 60_000);
  const b = await parseBody(c.req, AttemptBatchSchema);
  const results = [];
  for (const a of b.attempts) {
    try { results.push({ ok: true, clientAttemptId: a.clientAttemptId ?? null, ...(await processAttempt(uid(c), c.claims!.dev, a)) }); }
    catch (e) { results.push({ ok: false, clientAttemptId: a.clientAttemptId ?? null, error: e instanceof ApiError ? e.code : 'internal' }); }
  }
  return { results, progress: await progressView(uid(c)) };
});

// ─── progress / academy ────────────────────────────────────────────────────
add('GET', '/progress', 'user', async c => progressView(uid(c)));
add('GET', '/academy/chapters', 'user', async c => chaptersView(uid(c)));
add('GET', '/academy/chapters/:cardId', 'user', async c => lessonView(uid(c), c.params.cardId));
add('POST', '/academy/microcheck', 'user', async c => { const b = await parseBody(c.req, MicrocheckSchema); return submitMicrocheck(uid(c), b.cardId, b.atomId, b.seed, b.answer); });

// ─── sessions ──────────────────────────────────────────────────────────────
add('POST', '/sessions', 'user', async c => { const b = await parseBody(c.req, SessionStartSchema); return startSession(uid(c), b.weatherMode); });
add('POST', '/sessions/:id/end', 'user', async c => { const b = await parseBody(c.req, SessionEndSchema); return endSession(uid(c), c.params.id, b.endedBy); });

// ─── shadow / tournaments / leaderboard ────────────────────────────────────
add('GET', '/shadow/:templateId', 'user', async c => shadowFor(c.params.templateId));
add('GET', '/tournaments', 'none', async () => ({ tournaments: await listTournaments() }));
add('POST', '/tournaments/:id/join', 'user', async c => joinTournament(uid(c), c.claims!.dev, c.params.id));
add('GET', '/tournaments/:id/leaderboard', 'none', async c => leaderboard(c.params.id, c.claims?.sub));

// ─── analytics / billing ───────────────────────────────────────────────────
add('POST', '/analytics/events', 'user', async c => { rateLimit('ev:' + uid(c), 60, 60_000); const b = await parseBody(c.req, EventsSchema); return ingestEvents(uid(c), b.events); });
add('POST', '/billing/purchase', 'user', async c => { const b = await parseBody(c.req, z.object({ sku: z.string().min(2), kind: z.enum(['premium', 'cosmetic']), priceSig: z.number().int().min(0).max(100000) })); return purchase(uid(c), b.sku, b.kind, b.priceSig); });

// ─── admin: контент, конфиг, ИИ-конвейер, аналитика, турниры ───────────────
add('GET', '/admin/status', 'admin', async () => {
  const pkg = await getContentPackage();
  const [{ users }] = (await db.execute(sql`select count(*)::int as users from users`)).rows as { users: number }[];
  const [{ attempts }] = (await db.execute(sql`select count(*)::int as attempts from attempts`)).rows as { attempts: number }[];
  return { contentVersion: pkg.version, config: (await getConfig()).version, ai: aiStatus(), stats: { users, attempts, templates: pkg.templates.length, cards: cards.length, enemies: enemies.length, combos: combos.length } };
});
add('GET', '/admin/autotest', 'admin', async () => { const pkg = await getContentPackage(); return autotestPackage({ cards, enemies, combos, templates: pkg.templates }); });
add('GET', '/admin/preview/:templateId', 'admin', async c => {
  const tpl = await resolveTemplate(c.params.templateId); if (!tpl) throw new ApiError(404, 'template_not_found');
  const level = Number(c.query.get('level') ?? 10);
  const seeds = (c.query.get('seeds') ?? '1,2,3,4,5').split(',').map(Number);
  const pkg = await getContentPackage();
  return { template: tpl, mutations: seeds.map(s => ({ seed: s, full: mutate(tpl, s), public: toPublic(generate(tpl, s, { level, epoch: level <= 20 ? 'street' : level <= 50 ? 'cabinet' : level <= 80 ? 'terminal' : 'system' }, pkg.version)) })) };
});
add('POST', '/admin/config', 'admin', async c => { const b = await parseBody(c.req, ConfigPublishSchema); return publishConfig(b.version, b.segment, b.json); });
add('GET', '/admin/analytics', 'admin', async () => analyticsDashboard());
add('POST', '/admin/tournaments', 'admin', async c => { const b = await parseBody(c.req, TournamentCreateSchema); return createTournament(b.name, b.startsAt ? new Date(b.startsAt) : new Date(), b.durationHours, b.size); });
add('GET', '/admin/ai/status', 'admin', async () => aiStatus());
add('POST', '/admin/ai/drafts', 'admin', async c => { rateLimit('ai:' + c.ip, 20, 60_000); const b = await parseBody(c.req, AiDraftRequestSchema); return generateDrafts(b); });
add('GET', '/admin/ai/drafts', 'admin', async c => ({ drafts: await listDrafts(c.query.get('status') ?? undefined) }));
add('GET', '/admin/ai/drafts/:id', 'admin', async c => getDraft(c.params.id));
add('POST', '/admin/ai/drafts/:id/review', 'admin', async c => { const b = await parseBody(c.req, DraftReviewSchema); return reviewDraft(c.params.id, b.action, b.note); });

export function listRoutes() { return routes.map(r => ({ method: r.method, path: r.re.source.replace(/^\^/, '').replace(/\/\?\$$/, '').replace(/\(\[\^\/\]\+\)/g, ':param'), auth: r.auth })); }

export async function dispatch(req: Request, segments: string[]): Promise<Response> {
  const path = '/' + segments.join('/');
  const url = new URL(req.url);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  try {
    const candidates = routes.filter(r => r.re.test(path));
    if (!candidates.length) throw new ApiError(404, 'not_found', `Нет маршрута ${path}`, { routes: listRoutes() });
    const route = candidates.find(r => r.method === req.method);
    if (!route) throw new ApiError(405, 'method_not_allowed');
    const m = route.re.exec(path)!;
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    let claims: TokenClaims | null = null;
    if (route.auth === 'user') claims = requireAuth(req);
    else if (route.auth === 'admin') requireAdmin(req);
    else { try { if (req.headers.get('authorization')) claims = requireAuth(req); } catch { claims = null; } }
    const out = await route.fn({ req, params, query: url.searchParams, claims, ip });
    if (out instanceof Response) return out;
    return json(out);
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.code, message: e.message, details: e.details ?? null }, { status: e.status });
    console.error('[aibackend]', path, e);
    return json({ error: 'internal', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
