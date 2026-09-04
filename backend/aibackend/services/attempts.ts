// attempts — приём попыток: регенерация по seed, валидация engine, скоринг, обновление прогресса (ТЗ Часть 6 §5.1, §5.3)
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  attempts, progress, cardProgress, comboProgress, enemyProgress, mistakeScroll, calibration, answerDistribution, sessions, shadowRuns, tournaments,
} from '../db/schema';
import { generate } from '../engine/generator';
import { validateAttempt, confidenceValue } from '../engine/validator';
import { scoreEncounter } from '../engine/scoring';
import { levelFromXp, combosTouched } from '../engine/progress';
import { getEpochForLevel } from '../config/epochConfig';
import { balanceConfig } from '../config/balanceConfig';
import { enemyById } from '../content/enemies';
import { combos as comboRegistry } from '../content/combos';
import { ApiError, todayKey } from '../http';
import { getContentPackage, resolveTemplate } from './content';
import { loadSnapshot } from './progress';
import { consumeQueueItem } from './scheduler';
import type { AttemptPayload } from '../schemas';

export interface AttemptResponse {
  attemptId: string;
  duplicate: boolean;
  result: 'correct' | 'correct_unfounded' | 'wrong';
  reveal: {
    correctAnswer: number;
    correctEvidence: string[];
    verdictCorrect: boolean | null;
    sequenceCorrect: boolean | null;
    enemy: { id: string; name: string; domain: string; stage: number } | null; // M5 — раскрывается после ответа
    identifyOptions: string[];   // портреты одного домена для опознания
    identifyCorrect: boolean | null;
    missedEvidence: string;
    playForward: { candles: number; direction: 'up' | 'down'; outcomePct: number; durationMs: number }; // M6
  };
  reward: { xp: number; coins: number; budgetDelta: number; enemyDefeated: boolean };
  shadow: { distribution: { variant: number; text: string; share: number }[]; crowdBias: string | null; n: number }; // M14
  progress: {
    level: number; totalXp: number; epoch: string; riskBudget: number; coins: number; streak: number; levelUp: boolean; epochTransition: string | null;
    scrollAdded: boolean; combosUnlocked: string[]; stageWon: { enemyId: string; stage: number } | null; leviathan: boolean; hubrisDragon: boolean;
  };
  flags: string[];
}

export async function processAttempt(userId: string, deviceId: string, p: AttemptPayload): Promise<AttemptResponse> {
  // Идемпотентность офлайн-очереди
  if (p.clientAttemptId) {
    const dup = await db.select().from(attempts).where(and(eq(attempts.userId, userId), eq(attempts.clientAttemptId, p.clientAttemptId))).limit(1);
    if (dup[0]) {
      const snap = await loadSnapshot(userId);
      return minimalDuplicate(dup[0], snap.level, snap.totalXp, snap.epoch, snap.row.riskBudget, snap.row.coins, snap.row.streak);
    }
  }

  const tpl = await resolveTemplate(p.templateId);
  if (!tpl) throw new ApiError(404, 'template_not_found', `Шаблон ${p.templateId} не найден`);
  const pkg = await getContentPackage();
  const snap = await loadSnapshot(userId);
  const flags: string[] = [];
  if (p.contentVersion && p.contentVersion !== pkg.version) flags.push('content_version_mismatch');

  // Турнир: попытки только внутри окна и с одного устройства
  let tournament: typeof tournaments.$inferSelect | null = null;
  if (p.tournamentId) {
    const [t] = await db.select().from(tournaments).where(eq(tournaments.id, p.tournamentId)).limit(1);
    if (!t) throw new ApiError(404, 'tournament_not_found');
    const now = Date.now();
    if (now < t.startsAt.getTime() || now > t.endsAt.getTime()) throw new ApiError(409, 'tournament_closed');
    if (!t.seedSet.some(s => s.templateId === p.templateId && s.seed === p.seed)) throw new ApiError(409, 'seed_not_in_tournament');
    const [run] = await db.select().from(shadowRuns).where(and(eq(shadowRuns.userId, userId), eq(shadowRuns.tournamentId, t.id))).limit(1);
    if (!run) throw new ApiError(409, 'not_joined');
    if (run.deviceId !== deviceId) throw new ApiError(409, 'device_mismatch');
    if (run.answers[p.templateId]) throw new ApiError(409, 'already_answered');
    tournament = t;
  }

  // Регенерация экземпляра тем же движком
  const inst = generate(tpl, p.seed, { level: snap.level, epoch: snap.epoch, tiltStreak: snap.row.tiltStreak }, pkg.version);
  const v = validateAttempt(inst, {
    answer: p.answer, evidence: p.evidence, confidence: p.confidence, openedSources: p.openedSources,
    sequence: p.sequence, verdict: p.verdict, blindOpened: p.blindOpened, durationMs: p.durationMs,
  });
  flags.push(...v.flags);
  // Ставка без последствий до уровня noPenaltyUntil (M3)
  const effectiveConfidence = snap.level < balanceConfig.confidence.noPenaltyUntil ? null : p.confidence;
  const score = scoreEncounter({ domain: inst.domain, isCorrect: v.isCorrect, isJustified: v.isJustified, confidence: effectiveConfidence, level: snap.level, epoch: snap.epoch, streak: snap.row.streak });
  // Частичный балл за верный первый шаг вердикта (M4)
  let xp = score.xp;
  if (v.verdictCorrect === true && !v.isCorrect) xp = Math.round(balanceConfig.xp.perCorrect * 0.25);
  // M9 — слепой источник списывает бюджет
  let budgetDelta = score.budgetDelta - (p.blindOpened && inst.blindSource ? balanceConfig.riskBudget.blindSourceCost : 0);
  if (flags.includes('too_fast')) { xp = Math.round(xp * 0.5); }

  // ─── Прогресс ────────────────────────────────────────────────────────────
  const prevLevel = snap.level;
  const newTotalXp = snap.totalXp + xp;
  const newLevel = levelFromXp(newTotalXp);
  const newEpoch = getEpochForLevel(newLevel);
  const newBudget = Math.max(0, Math.min(balanceConfig.riskBudget.max, snap.row.riskBudget + budgetDelta));
  const today = todayKey();
  const streak = snap.row.lastActiveDay === today ? snap.row.streak : (snap.row.lastActiveDay === yesterday() ? snap.row.streak + 1 : 1);
  const hubris = p.confidence === 'high' && !v.isCorrect ? snap.row.hubrisStreak + 1 : (v.isCorrect ? 0 : snap.row.hubrisStreak);
  const tilt = v.isCorrect ? 0 : snap.row.tiltStreak + 1;
  const hubrisDragon = hubris >= balanceConfig.confidence.hubrisThreshold && newEpoch === 'system';
  const leviathan = newBudget === 0 && snap.row.riskBudget > 0;

  const [row] = await db.insert(attempts).values({
    userId, sessionId: p.sessionId ?? null, clientAttemptId: p.clientAttemptId ?? null, templateId: tpl.id, contentVersion: pkg.version, seed: inst.seed,
    mode: inst.mode, answer: p.answer, evidence: p.evidence, confidence: p.confidence, openedSources: p.openedSources, sequence: p.sequence,
    verdict: p.verdict, blindOpened: p.blindOpened, result: v.result, xp, coins: score.coins, budgetDelta, durationMs: p.durationMs, flags,
    tournamentId: tournament?.id ?? null, clientTs: p.clientTs ?? null,
  }).returning();

  await db.update(progress).set({
    xp: newTotalXp, level: newLevel, epoch: newEpoch, coins: snap.row.coins + score.coins, riskBudget: newBudget,
    streak, lastActiveDay: today, hubrisStreak: hubrisDragon ? 0 : hubris, tiltStreak: tilt, updatedAt: new Date(),
  }).where(eq(progress.userId, userId));

  if (p.sessionId) await db.update(sessions).set({ attempts: sql`${sessions.attempts} + 1`, riskBudgetEnd: newBudget }).where(and(eq(sessions.id, p.sessionId), eq(sessions.userId, userId)));

  // Калибровка (M3)
  if (p.confidence) await db.insert(calibration).values({ userId, bucket: p.confidence, predicted: confidenceValue(p.confidence), actual: v.isCorrect ? 1 : 0 });

  // Распределение ответов (M14) — по исходному индексу варианта
  if (v.originalVariant !== null) {
    await db.insert(answerDistribution).values({ templateId: tpl.id, variant: v.originalVariant, count: 1 })
      .onConflictDoUpdate({ target: [answerDistribution.templateId, answerDistribution.variant], set: { count: sql`${answerDistribution.count} + 1` } });
  }

  // Враг: встречи, стадии (M12), трофей-слои, профиль ошибок, опознание (M5)
  const enemy = enemyById[tpl.enemyId];
  const ep = snap.enemyRows.find(r => r.enemyId === tpl.enemyId);
  const stageWon = score.enemyDefeated && tpl.stage > (ep?.stageReached ?? 0);
  const identifyCorrect = p.identifyGuess ? p.identifyGuess === tpl.enemyId : null;
  const errorProfile = { ...(ep?.errorProfile ?? {}) };
  if (!v.isCorrect) { const key = inst.mutatedAnswers[p.answer ?? -1]?.errorType || 'wrong'; errorProfile[key] = (errorProfile[key] ?? 0) + 1; }
  const trophyLayers = stageWon ? [...new Set([...(ep?.trophyLayers ?? []), tpl.stage])] : (ep?.trophyLayers ?? []);
  await db.insert(enemyProgress).values({
    userId, enemyId: tpl.enemyId, stageReached: stageWon ? tpl.stage : (ep?.stageReached ?? 0), trophyLayers, errorProfile,
    identified: (ep?.identified ?? false) || identifyCorrect === true, lastWinAt: score.enemyDefeated ? new Date() : null, encounters: 1,
  }).onConflictDoUpdate({
    target: [enemyProgress.userId, enemyProgress.enemyId],
    set: {
      stageReached: stageWon ? tpl.stage : (ep?.stageReached ?? 0), trophyLayers, errorProfile,
      identified: (ep?.identified ?? false) || identifyCorrect === true,
      lastWinAt: score.enemyDefeated ? new Date() : ep?.lastWinAt ?? null, encounters: sql`${enemyProgress.encounters} + 1`,
    },
  });

  // Свиток ошибок (M7): ошибка или «верно, но необоснованно» → запись; верный ответ закрывает запись по тому же атому/врагу
  let scrollAdded = false;
  if (v.result !== 'correct') {
    const open = snap.scroll.find(s => s.enemyId === tpl.enemyId && s.atom === tpl.atoms[0]);
    if (open) await db.update(mistakeScroll).set({ mutationDepth: open.mutationDepth + 1, missedEvidence: v.missedEvidence || open.missedEvidence }).where(eq(mistakeScroll.id, open.id));
    else { await db.insert(mistakeScroll).values({ userId, atom: tpl.atoms[0], enemyId: tpl.enemyId, stage: tpl.stage, templateId: tpl.id, missedEvidence: v.missedEvidence || 'нет улики' }); scrollAdded = true; }
  } else {
    for (const s of snap.scroll.filter(s => s.enemyId === tpl.enemyId && tpl.atoms.includes(s.atom))) {
      await db.update(mistakeScroll).set({ closedAt: new Date() }).where(eq(mistakeScroll.id, s.id));
    }
  }

  // Комбо (M8): верное совместное применение карт ранга ≥2 с верной уликой
  const combosUnlocked: string[] = [];
  if (v.result === 'correct') {
    for (const k of combosTouched(tpl.skills, snap.cardRanks)) {
      const cur = snap.comboCounts[k] ?? 0;
      const already = snap.combosUnlocked.includes(k);
      const unlock = !already && cur + 1 >= balanceConfig.combo.requiredCorrect;
      await db.insert(comboProgress).values({ userId, comboId: k, count: 1, unlockedAt: unlock ? new Date() : null })
        .onConflictDoUpdate({ target: [comboProgress.userId, comboProgress.comboId], set: { count: sql`${comboProgress.count} + 1`, ...(unlock ? { unlockedAt: new Date() } : {}) } });
      if (unlock) combosUnlocked.push(k);
    }
  }
  // Применение карты в практике накапливает прогресс атома (ранг растёт в Академии, но практика подтверждает атомы)
  if (v.result === 'correct') {
    for (const atom of tpl.atoms) {
      const cardId = atom.split('.')[0];
      const done = snap.cardAtoms[cardId];
      if (done && !done.includes(atom) && (snap.cardRanks[cardId] ?? 0) >= 1) {
        await db.update(cardProgress).set({ atomsDone: [...done, atom], updatedAt: new Date() }).where(and(eq(cardProgress.userId, userId), eq(cardProgress.cardId, cardId)));
      }
    }
  }

  // Турнирный прогон (тень)
  if (tournament) {
    const [run] = await db.select().from(shadowRuns).where(and(eq(shadowRuns.userId, userId), eq(shadowRuns.tournamentId, tournament.id))).limit(1);
    const answers = { ...run.answers, [tpl.id]: { answer: p.answer ?? -1, result: v.result, ms: p.durationMs } };
    const scoreDelta = v.result === 'correct' ? 100 : v.result === 'correct_unfounded' ? 40 : 0;
    const done = Object.keys(answers).length >= tournament.seedSet.length;
    await db.update(shadowRuns).set({ answers, score: run.score + scoreDelta, totalMs: run.totalMs + p.durationMs, finishedAt: done ? new Date() : null }).where(eq(shadowRuns.id, run.id));
  }

  await consumeQueueItem(userId, tpl.id);

  // Тень арены — распределение по шаблону
  const dist = await db.select().from(answerDistribution).where(eq(answerDistribution.templateId, tpl.id));
  const n = dist.reduce((a, d) => a + d.count, 0);
  const distribution = tpl.answers.map((a, i) => ({ variant: i, text: a.text, share: n ? +(((dist.find(d => d.variant === i)?.count ?? 0) / n).toFixed(3)) : 0 }));
  const top = [...distribution].filter(d => d.variant !== tpl.correct).sort((a, b) => b.share - a.share)[0];
  const crowdBias = top && top.share > 0.25 ? (tpl.answers[top.variant].errorType || null) : null;

  // M5 — портреты одного домена
  const sameDomain = Object.values(enemyById).filter(e => e.domain === enemy.domain && e.id !== enemy.id && e.mode === 'normal').map(e => e.id);
  const optCount = balanceConfig.identify.optionsByEpoch[snap.epoch];
  const identifyOptions = optCount > 0 && snap.level >= balanceConfig.identify.introducedAt ? shuffleDet([enemy.id, ...sameDomain.slice(0, optCount - 1)], inst.seed) : [];

  const dir: 'up' | 'down' = (v.isCorrect ? !inst.isMirrored : inst.isMirrored) ? 'up' : 'down';
  return {
    attemptId: row.id, duplicate: false, result: v.result,
    reveal: {
      correctAnswer: v.correctAnswer, correctEvidence: v.correctEvidence, verdictCorrect: v.verdictCorrect, sequenceCorrect: v.sequenceCorrect,
      enemy: { id: enemy.id, name: enemy.name, domain: enemy.domain, stage: tpl.stage }, identifyOptions, identifyCorrect, missedEvidence: v.missedEvidence,
      playForward: { candles: balanceConfig.playForward.candleCount, direction: dir, outcomePct: +((v.isCorrect ? 1 : -1) * (2 + (inst.seed % 500) / 100)).toFixed(2), durationMs: balanceConfig.playForward.durationMs },
    },
    reward: { xp, coins: score.coins, budgetDelta, enemyDefeated: score.enemyDefeated },
    shadow: { distribution, crowdBias, n },
    progress: {
      level: newLevel, totalXp: newTotalXp, epoch: newEpoch, riskBudget: newBudget, coins: snap.row.coins + score.coins, streak,
      levelUp: newLevel > prevLevel, epochTransition: newEpoch !== snap.epoch ? newEpoch : null,
      scrollAdded, combosUnlocked, stageWon: stageWon ? { enemyId: tpl.enemyId, stage: tpl.stage } : null, leviathan, hubrisDragon,
    },
    flags,
  };
}

function minimalDuplicate(a: typeof attempts.$inferSelect, level: number, totalXp: number, epoch: string, riskBudget: number, coins: number, streak: number): AttemptResponse {
  return {
    attemptId: a.id, duplicate: true, result: a.result as AttemptResponse['result'],
    reveal: { correctAnswer: -1, correctEvidence: [], verdictCorrect: null, sequenceCorrect: null, enemy: null, identifyOptions: [], identifyCorrect: null, missedEvidence: '', playForward: { candles: 0, direction: 'up', outcomePct: 0, durationMs: 0 } },
    reward: { xp: a.xp, coins: a.coins, budgetDelta: a.budgetDelta, enemyDefeated: a.result === 'correct' },
    shadow: { distribution: [], crowdBias: null, n: 0 },
    progress: { level, totalXp, epoch, riskBudget, coins, streak, levelUp: false, epochTransition: null, scrollAdded: false, combosUnlocked: [], stageWon: null, leviathan: false, hubrisDragon: false },
    flags: a.flags,
  };
}

function yesterday(): string { const d = new Date(); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
function shuffleDet<T>(arr: T[], seed: number): T[] { const a = [...arr]; let s = seed >>> 0 || 1; for (let i = a.length - 1; i > 0; i--) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; const j = (s >>> 0) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export const comboNames = Object.fromEntries(comboRegistry.map(k => [k.id, k.name]));
