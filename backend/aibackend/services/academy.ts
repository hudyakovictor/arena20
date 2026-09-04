// academy — главы, уроки, микро-проверки; выдача карты и повышение ранга (ТЗ Часть 1 §4–5)
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { cardProgress } from '../db/schema';
import { cards, cardById } from '../content/cards';
import { enemies } from '../content/enemies';
import { SeededRng, hashString } from '../engine/rng';
import { rankFromAtoms, isCardUnlocked } from '../engine/progress';
import { ApiError, deterministicSeed } from '../http';
import { loadSnapshot } from './progress';

/** Микро-проверка атома: 3 варианта — умение атома против умений других карт (детерминированно по seed). */
export function buildMicrocheck(cardId: string, atomId: string, seed: number) {
  const card = cardById[cardId];
  const atom = card?.atoms.find(a => a.id === atomId);
  if (!card || !atom) throw new ApiError(404, 'atom_not_found');
  const rng = new SeededRng((seed ^ hashString(atomId)) >>> 0);
  const others = cards.filter(c => c.id !== cardId).flatMap(c => c.atoms.map(a => a.desc));
  const distractors = rng.shuffle(others).slice(0, 2);
  const options = rng.shuffle([atom.desc, ...distractors]);
  return {
    cardId, atomId, seed,
    question: `Какое умение проверяет этот атом главы «${card.name}»?`,
    options,
    correct: options.indexOf(atom.desc),
  };
}

export async function chaptersView(userId: string) {
  const snap = await loadSnapshot(userId);
  return {
    level: snap.level, epoch: snap.epoch,
    chapters: cards.map(c => {
      const done = snap.cardAtoms[c.id] ?? [];
      const teaser = enemies.find(e => e.mode === 'normal' && e.stages[0].requiredCards.some(rc => rc.cardId === c.id));
      return {
        id: c.id, cid: c.cid, name: c.name, short: c.short, domain: c.domain, icon: c.icon, unlockLevel: c.unlockLevel,
        unlocked: isCardUnlocked(c.id, snap.level), rank: snap.cardRanks[c.id] ?? 0, rankThresholds: c.rankThresholds,
        atoms: c.atoms.map(a => ({ id: a.id, desc: a.desc, done: done.includes(a.id) })),
        teaser: teaser ? { domain: teaser.domain, caption: `Против кого нужна эта карта: ${teaser.domain}` } : null,
        mandatorySources: c.mandatorySources, optionalSources: c.optionalSources,
      };
    }),
  };
}

export async function lessonView(userId: string, cardId: string) {
  const snap = await loadSnapshot(userId);
  const card = cardById[cardId];
  if (!card) throw new ApiError(404, 'card_not_found');
  if (!isCardUnlocked(cardId, snap.level)) throw new ApiError(403, 'chapter_locked', `Глава откроется на уровне ${card.unlockLevel}`);
  const done = snap.cardAtoms[cardId] ?? [];
  return {
    cardId, name: card.name, rank: snap.cardRanks[cardId] ?? 0,
    atoms: card.atoms.map(a => {
      const seed = deterministicSeed('micro', userId, a.id, String(done.length));
      const mc = buildMicrocheck(cardId, a.id, seed);
      return { id: a.id, desc: a.desc, done: done.includes(a.id), microcheck: { seed: mc.seed, question: mc.question, options: mc.options } };
    }),
  };
}

export async function submitMicrocheck(userId: string, cardId: string, atomId: string, seed: number, answer: number) {
  const snap = await loadSnapshot(userId);
  if (!isCardUnlocked(cardId, snap.level)) throw new ApiError(403, 'chapter_locked');
  const mc = buildMicrocheck(cardId, atomId, seed);
  const correct = mc.correct === answer;
  const prevDone = snap.cardAtoms[cardId] ?? [];
  const prevRank = snap.cardRanks[cardId] ?? 0;
  let atomsDone = prevDone;
  if (correct && !prevDone.includes(atomId)) atomsDone = [...prevDone, atomId];
  const rank = rankFromAtoms(cardId, atomsDone);
  if (correct) {
    await db.insert(cardProgress).values({ userId, cardId, rank, atomsDone, grantedAt: rank > 0 ? new Date() : null })
      .onConflictDoUpdate({ target: [cardProgress.userId, cardProgress.cardId], set: { rank, atomsDone, updatedAt: new Date(), ...(prevRank === 0 && rank > 0 ? { grantedAt: new Date() } : {}) } });
  }
  const existing = await db.select().from(cardProgress).where(and(eq(cardProgress.userId, userId), eq(cardProgress.cardId, cardId))).limit(1);
  return {
    correct, correctOption: mc.correct, atomId, cardId,
    cardGranted: prevRank === 0 && rank >= 1, rankUp: rank > prevRank, rank: existing[0]?.rank ?? rank, atomsDone: existing[0]?.atomsDone ?? atomsDone,
    atomsTotal: cardById[cardId].atoms.length,
  };
}
