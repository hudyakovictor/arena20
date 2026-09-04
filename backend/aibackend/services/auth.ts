// auth — анонимный старт по device id → JWT; привязка e-mail позже (ТЗ Часть 6 §5.1, §10)
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { devices, users, progress } from '../db/schema';
import { balanceConfig } from '../config/balanceConfig';
import { signToken, type TokenClaims } from '../http';

export async function anonymousLogin(deviceId: string, userAgent?: string) {
  const existing = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
  let userId: string;
  let created = false;
  if (existing[0]) {
    userId = existing[0].userId;
    await db.update(devices).set({ lastSeenAt: new Date(), userAgent: userAgent ?? existing[0].userAgent }).where(eq(devices.id, deviceId));
  } else {
    const [u] = await db.insert(users).values({ authKind: 'anonymous', segment: pickSegment(deviceId) }).returning();
    userId = u.id;
    created = true;
    await db.insert(devices).values({ id: deviceId, userId, userAgent });
    await db.insert(progress).values({ userId, riskBudget: balanceConfig.riskBudget.initial }).onConflictDoNothing();
  }
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const token = signToken({ sub: userId, dev: deviceId, seg: u.segment });
  return { token, user: { id: u.id, authKind: u.authKind, segment: u.segment, createdAt: u.createdAt, premium: u.premium }, created };
}

/** A/B-сегмент по устройству — детерминированно, без персональных данных. */
function pickSegment(deviceId: string): string {
  let h = 0; for (const ch of deviceId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 10 === 0 ? 'b' : 'default';
}

export async function linkEmail(claims: TokenClaims, email: string) {
  await db.update(users).set({ email, authKind: 'email' }).where(eq(users.id, claims.sub));
  return { ok: true };
}
