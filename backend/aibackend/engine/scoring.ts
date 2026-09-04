import { balanceConfig } from '../config/balanceConfig';
import type { SkillDomain, Confidence } from '../types';

export interface Verdict {
  isCorrect: boolean;
  isJustified: boolean; // M1
  xp: number;
  coins: number;
  budgetDelta: number;
  enemyDefeated: boolean;
  comboProgress?: boolean;
}

export function scoreEncounter(opts:{
  domain: SkillDomain,
  isCorrect: boolean,
  isJustified: boolean,
  confidence: Confidence,
  level: number,
  epoch: string,
  streak: number
}): Verdict {
  const cfg = balanceConfig;
  const confMul = opts.confidence ? cfg.riskBudget.confidenceMul[opts.confidence as 'low'|'mid'|'high'] : 1;
  const baseLoss = cfg.riskBudget.baseLoss[opts.domain] ?? 10;
  let xp = 0, coins=0, budgetDelta=0, enemyDefeated=false;

  if(opts.isCorrect && opts.isJustified){
    xp = cfg.xp.perCorrect;
    if(opts.confidence==='high') xp = Math.round(xp*1.25);
    if(opts.confidence==='low') xp = Math.round(xp*0.85);
    coins = cfg.coins.perCorrect;
    budgetDelta = cfg.riskBudget.restoreOnCorrect; // +6
    enemyDefeated = true;
  } else if(opts.isCorrect && !opts.isJustified){
    xp = cfg.xp.perCorrectUnjustified;
    coins = cfg.coins.perCorrectUnjustified;
    budgetDelta = cfg.riskBudget.restoreOnUnjustified; // 0
    enemyDefeated = false; // M1 защита
  } else {
    // ошибка — списание пропорционально ставке и домену
    const loss = Math.round(baseLoss * confMul);
    budgetDelta = -loss;
    xp = 0; coins = 0;
    enemyDefeated = false;
  }
  // лев��тран на низкой уверенности мягче, на высокой — дороже
  return { isCorrect: opts.isCorrect, isJustified: opts.isJustified, xp, coins, budgetDelta, enemyDefeated };
}
