// SIGNAL ARENA — aibackend: публичный вход модуля
export { dispatch, listRoutes } from './http/router';
export * as engine from './engine/generator';
export { validateAttempt } from './engine/validator';
export { scoreEncounter } from './engine/scoring';
export { autotestPackage, runBots } from './engine/autotest';
export * as schema from './db/schema';
