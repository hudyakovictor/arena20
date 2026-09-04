import { balanceConfig } from '../config/balanceConfig';
import { getEpochForLevel } from '../config/epochConfig';
import type { GameProgress } from '../types';

const STORAGE_KEY = 'arena_v4_progress';
const FLAGS_KEY = 'arena_v4_flags';

function defaultProgress(): GameProgress {
  return {
    level: 4, xp: 680, xpMax: 1000, coins: 1240,
    riskBudget: balanceConfig.riskBudget.initial,
    maxBudget: balanceConfig.riskBudget.max,
    streak: 2, epoch: getEpochForLevel(4) as any,
    cardRanks: { C1:1, C2:1, C3:0, C4:1 },
    enemyStagesReached: { E02:1 },
    errorScroll: [],
    combosUnlocked: [],
    calibration: [],
    weather: 'TREND'
  };
}

export class GameState {
  progress: GameProgress;
  constructor(){
    const saved = typeof localStorage!=='undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    this.progress = saved ? { ...defaultProgress(), ...JSON.parse(saved)} : defaultProgress();
    this.refreshEpoch();
  }
  refreshEpoch(){
    this.progress.epoch = getEpochForLevel(this.progress.level) as any;
  }
  save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress)); }catch{}
  }
  addXp(v:number){
    this.progress.xp += v;
    while(this.progress.xp >= this.progress.xpMax){
      this.progress.xp -= this.progress.xpMax;
      this.progress.level++;
      this.progress.xpMax = Math.round(this.progress.xpMax*1.4);
      this.refreshEpoch();
    }
    this.save();
  }
  addCoins(v:number){ this.progress.coins+=v; this.save(); }
  changeBudget(delta:number){
    this.progress.riskBudget = Math.max(0, Math.min(this.progress.maxBudget, this.progress.riskBudget+delta));
    this.save();
    return this.progress.riskBudget;
  }
  pushError(enemy:string, atom:string, missedEvidence:string){
    this.progress.errorScroll.unshift({ id: 'e'+Date.now(), enemy, atom, missedEvidence, createdAt: Date.now(), closed:false, mutationDepth:0});
    if(this.progress.errorScroll.length>balanceConfig.errorScroll.maxEntries) this.progress.errorScroll.pop();
    this.save();
  }
  closeError(id:string){ const e=this.progress.errorScroll.find(x=>x.id===id); if(e) e.closed=true; this.save(); }
  addCalibration(predicted:number, actual:number){ this.progress.calibration.push({predicted,actual}); if(this.progress.calibration.length>50) this.progress.calibration.shift(); this.save(); }
  isCardUnlocked(cardId:string){
    // по ТЗ Часть 1 §4.4
    const lvl = this.progress.level;
    const map: Record<string,number> = {C1:1,C2:4,C3:8,C4:12,C5:16,C8:21,C7:26,C6:31,C9:36,C10:41,C11:46,C12:51,C13:56,C14:61,C15:66,C16:72,C17:78};
    return lvl >= (map[cardId]??99);
  }
  // ── флаги юзерфлоу (онбординг, разминка дня, переход эпохи и т.д.) ──
  getFlag(key:string): boolean {
    let f: Record<string, boolean> = {};
    try { f = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}'); } catch {}
    return !!f[key];
  }
  setFlag(key:string, val:boolean = true): void {
    let f: Record<string, boolean> = {};
    try { f = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}'); } catch {}
    f[key]=val;
    try { localStorage.setItem(FLAGS_KEY, JSON.stringify(f)); } catch {}
  }
  // сброс для демо: вернуть флаги и прогресс к первому входу
  resetAll(): void {
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(FLAGS_KEY); } catch {}
    this.progress = defaultProgress();
    this.refreshEpoch();
    this.save();
  }
}

export const gameState = new GameState();
