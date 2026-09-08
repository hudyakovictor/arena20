import { describe, expect, it } from 'vitest';
import { CONTENT_VERSION } from '@signal-arena/shared';
import { buildApp } from './app.js';

describe('T100 server scaffold', () => {
  it('GET /health → ok + contentVersion', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      ok: true,
      service: 'signal-arena',
      contentVersion: CONTENT_VERSION,
    });
  });

  it('GET /api/content/version → версии контента', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/content/version' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ contentVersion: CONTENT_VERSION });
  });
});
