// T100 · Fastify-приложение: health, версия контента, WS-хаб турниров (stub до T104).
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import { CONTENT_VERSION, DATASET_VERSION } from '@signal-arena/shared';

/** Минимальная поверхность WS-сокета, используемая stub-хендлером (T104 расширит). */
interface TournamentSocket {
  send: (message: string) => void;
  on: (event: 'message', listener: (raw: unknown) => void) => void;
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(websocket);

  app.get('/health', () => ({
    ok: true,
    service: 'signal-arena',
    contentVersion: CONTENT_VERSION,
  }));

  // T102: здесь будет отдача публичных сценариев (без future) + версионность.
  app.get('/api/content/version', () => ({
    contentVersion: CONTENT_VERSION,
    datasetVersion: DATASET_VERSION,
  }));

  // T104: турнирный realtime. Сейчас — handshake + ack (контракт позже).
  app.get('/ws/tournaments', { websocket: true }, (socket: TournamentSocket) => {
    socket.send(JSON.stringify({ type: 'hello', contentVersion: CONTENT_VERSION }));
    socket.on('message', (raw: unknown) => {
      socket.send(JSON.stringify({ type: 'ack', receivedBytes: String(raw).length }));
    });
  });

  return app;
}
