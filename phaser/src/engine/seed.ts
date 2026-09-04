// SIGNAL ARENA — детерминированный seed (аудит D1).
// Было: seed = level*100000 + xp + Date.now() — задачу невозможно повторить,
// воспроизвести баг или сверить ответ с сервером.
// Стало: seed = hash(userId, level, taskIndex) — те же аргументы дают ту же задачу
// на клиенте и на сервере.

import { hashString } from './rng';

/**
 * Считает seed встречи. Функция чистая: одинаковые аргументы — одинаковый seed.
 * @param userId  идентификатор игрока (офлайн — стабильный локальный id)
 * @param level   текущий уровень
 * @param taskIndex сквозной номер задачи у этого игрока
 */
export function encounterSeed(userId: string, level: number, taskIndex: number): number {
  return hashString(`${userId}:${level}:${taskIndex}`);
}

const DEVICE_ID_KEY = 'arena_device_id';

/**
 * Стабильный локальный идентификатор игрока — пока нет серверной авторизации.
 * После подключения аккаунта заменяется реальным userId.
 */
export function localUserId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_ID_KEY);
    if (saved) return saved;
    const id = 'u' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return 'anonymous';
  }
}
