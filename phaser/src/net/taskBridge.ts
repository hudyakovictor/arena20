// Предзагрузка серверных заданий для Арены.
// Сцены Phaser синхронны — задание запрашивается заранее и забирается мгновенно.
// Нет соединения → ArenaScene падает на локальный движок (офлайн-режим по ТЗ Часть 6 §3).
import { api, type NextTaskResponse } from './api';

let pending: NextTaskResponse | null = null;
let inflight: Promise<void> | null = null;

export function prefetchTask(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try { pending = await api.nextTask(); }
    catch { pending = null; }
    finally { inflight = null; }
  })();
  return inflight;
}

/** Забрать предзагруженное задание (и сразу заказать следующее). null → офлайн-фолбэк. */
export function takeServerTask(): NextTaskResponse | null {
  const t = pending;
  pending = null;
  if (api.online) void prefetchTask();
  return t;
}
