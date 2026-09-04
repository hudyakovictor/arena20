// SIGNAL ARENA — HTTP/WS-вход: Fastify (ТЗ Часть 6, стек неизменен: Fastify, SQLite, Drizzle, Zod, WS).
// Вся логика живёт в aibackend (транспорто-независимый роутер Request→Response); здесь — только адаптер + WS.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { dispatch } from './aibackend/http/router';

const app = Fastify({ logger: false, bodyLimit: 1 << 20 });

await app.register(cors, { origin: true });
await app.register(websocket);

app.get('/api/health', async () => ({ ok: true, ts: Date.now() }));

// REST /api/v1/* → aibackend.dispatch
app.all('/api/v1/*', async (req, reply) => {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
  }
  const init: RequestInit = { method: req.method, headers };
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    init.body = req.body !== undefined ? JSON.stringify(req.body) : '';
  }
  const request = new Request(`http://localhost${req.url}`, init);
  const segments = new URL(req.url, 'http://localhost').pathname
    .replace(/^\/api\/v1\/?/, '').split('/').filter(Boolean);
  const res = await dispatch(request, segments);
  reply.status(res.status);
  res.headers.forEach((v, k) => reply.header(k, v));
  return reply.send(await res.text());
});

// WS: живые события (ТЗ Часть 6). hello + ping; broadcast для турниров/погоды — по мере подключения.
type WS = { readyState: number; send: (s: string) => void; on: (e: string, cb: () => void) => void };
const sockets = new Set<WS>();
app.get('/ws', { websocket: true }, (socket: unknown) => {
  const s = socket as WS;
  sockets.add(s);
  s.send(JSON.stringify({ type: 'hello', serverTs: Date.now() }));
  const tick = setInterval(() => { if (s.readyState === 1) s.send(JSON.stringify({ type: 'ping', ts: Date.now() })); }, 30_000);
  s.on('close', () => { clearInterval(tick); sockets.delete(s); });
});

export function broadcast(msg: unknown) {
  const raw = JSON.stringify(msg);
  for (const s of sockets) if (s.readyState === 1) s.send(raw);
}

const port = Number(process.env.PORT ?? 8080);
await app.listen({ port, host: '0.0.0.0' });
console.log(`[signal-arena] Fastify api+ws on 0.0.0.0:${port}`);
