import { buildApp } from './app.js';

const port = Number(process.env['PORT'] ?? 3001);
const host = process.env['HOST'] ?? '0.0.0.0';

const app = await buildApp();
await app.listen({ port, host });
console.log(`signal-arena server listening on http://${host}:${port}`);
