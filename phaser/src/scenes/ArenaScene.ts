import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { balanceConfig } from '../config/balanceConfig';
import { epochOf, getEpochForLevel } from '../config/epochConfig';
import { templateFor } from '../data/templates';
import { mutate } from '../engine/mutator';
import { scoreEncounter } from '../engine/scoring';
import { enemies, enemyById } from '../data/enemies';
import { cards, cardById } from '../data/cards';
import { sourceById } from '../data/sources';
import { enemyAvatarKey, cardKey } from '../engine/assetKeys';
import type { EncounterInstance, Confidence, SourceId } from '../types';
import { buildPalette } from '../ui/palette';

// Токены — Terminal Design System, меняются эпохой без новой сцены (ТЗ Часть 2 §4)
const FONT_UI = { fontFamily: 'Inter, system-ui, sans-serif' };
const FONT_MONO = { fontFamily: 'IBM Plex Mono, Consolas, monospace' };

export class ArenaScene extends Phaser.Scene {
  private encounter!: EncounterInstance;
  private selectedEvidence = new Set<string>();
  private confidence: Confidence = null;
  private selectedAnswer: number | null = null;
  private selectedSequence: string[] = [];
  private verdictFactor: 'A'|'B'|null = null;
  private blindOpened = false;
  private activeSource: SourceId = 'chart';
  private evidenceHighlights = true;
  private uiGroup!: Phaser.GameObjects.Group;

  // Токены эпохи (ТЗ Часть 2): скелет один — взрослеют токены.
  private P = buildPalette('street');
  private get COLORS() {
    const P = this.P;
    return {
      bg: P.bgN, inset: P.insetN, surface: P.surfaceN, elevated: P.elevatedN, hover: P.hoverN,
      border: P.borderN, strong: P.strongN, cyan: P.accentN, accentN: P.accentN,
      good: P.goodN, bad: P.badN, warn: P.warnN, paper: P.paperN, crypto: P.cryptoN,
      text: P.textN, sub: P.subN, muted: P.mutedN, info: 0x59a7ff, ink: 0x1c1916,
      accentS: P.accent, subS: P.sub, mutedS: P.muted, textS: P.text, goodS: P.good,
      badS: P.bad, warnS: P.warn, cryptoS: P.crypto, infoS: P.info,
      inkTextS: P.inkText, inkSubS: P.inkSub, fontHead: P.fontHead,
    };
  }

  private get progress(){ return gameState.progress; }
  private get epoch(){ return epochOf(this.progress.level); }
  private get isStoneEpoch(){ return this.epoch.id==='street'; }

  constructor(){ super({ key:'ArenaScene' }); }

  create(): void {
    this.selectedEvidence.clear(); this.confidence=null; this.selectedAnswer=null; this.selectedSequence=[]; this.verdictFactor=null; this.blindOpened=false;
    // M11 — детерминированный seed: уровень + счётчик + время
    const seed = (this.progress.level*100000 + this.progress.xp + Date.now())>>>0;
    // M12 кампания: выбираем шаблон по уровню и не закрытым стадиям
    const tpl = this.pickTemplate();
    this.encounter = mutate(tpl, seed);
    this.activeSource = this.encounter.sources[0] as SourceId;
    this.evidenceHighlights = balanceConfig.evidence.highlightInEpoch[this.progress.epoch as 'street'|'cabinet'|'terminal'|'system'];

    this.P = buildPalette(this.epoch.id);
    this.cameras.main.setBackgroundColor(this.P.bgN);
    // Эпоха I «Улица» — согласованный фон: кирпич + виньетка (ui/prototype_style_*.png)
    if (this.P.brick && this.textures.exists('bg-wall')) {
      this.add.image(0, 0, 'bg-wall').setOrigin(0).setDisplaySize(390, 844).setAlpha(0.85);
      this.add.rectangle(0, 0, 390, 844, 0x000000, 0.38).setOrigin(0);
    }

    this.createTopBar();
    this.createWeatherStrip();
    this.createQuestion();
    this.createThreat();
    this.createBrowser();
    this.createEvidenceStrip();
    this.createSkills();
    this.createAnswerBlock();
    this.createBottomNav();
    this.createDebugEpochSwitcher(); // dev — показать взросление
  }

  private pickTemplate(){
    // приоритет: свиток ошибок (M7) → ближайшая стадия кампании (M12) → ротация.
    // templateFor() сам синтезирует шаблон для ЛЮБОГО врага/стадии — весь ростер 33 врагов проходим.
    if(this.progress.errorScroll.length>0 && !this.progress.errorScroll[0].closed){
      const e = this.progress.errorScroll[0];
      const enemy = enemyById[e.enemy];
      const stageNum = enemy?.stages.find(s=>s.level<=this.progress.level)?.stage ?? enemy?.stages[0].stage ?? 1;
      return templateFor(e.enemy, stageNum);
    }
    // ближайшая доступная стадия по уровню
    const lvl = this.progress.level;
    let best: { enemyId:string; stageNum:number; dist:number } | null = null;
    for(const en of enemies){
      for(const s of en.stages){
        if(lvl >= s.level - 6 && lvl <= s.level + 6){
          const dist = Math.abs(lvl - s.level);
          if(!best || dist < best.dist) best = { enemyId: en.id, stageNum: s.stage, dist };
        }
      }
    }
    if(best) return templateFor(best.enemyId, best.stageNum);
    // ротация по уровню
    const cand = enemies[lvl % enemies.length];
    const st = cand.stages.find(s=>s.level<=lvl)?.stage ?? cand.stages[0].stage;
    return templateFor(cand.id, st);
  }

  private createTopBar(): void {
    const p=this.progress;
    const C=this.COLORS;
    this.add.rectangle(8,8,374,48, C.surface, 0.94).setStrokeStyle(1, C.border);
    this.add.circle(28,32,14, C.inset).setStrokeStyle(1, C.strong);
    this.add.text(28,32, `L${p.level}`, { ...FONT_MONO, fontSize:'9px', color:C.accentS}).setOrigin(0.5);
    // XP — кислотная пилюля
    this.add.rectangle(50,20,148,24, C.accentN).setOrigin(0,0);
    this.add.text(58,32, `XP ${p.xp} / ${p.xpMax}`, { ...FONT_MONO, fontSize:'10px', color:'#0a0b0d'}).setOrigin(0,0.5);
    // SIG
    this.add.rectangle(206,20,84,24, C.inset).setStrokeStyle(1, C.accentN).setOrigin(0,0);
    this.add.text(214,32, `SIG ${p.coins}`, { ...FONT_MONO, fontSize:'10px', color:C.accentS}).setOrigin(0,0.5);
    // M15 бюджет риска — красная пилюля
    const bColN = p.riskBudget<=20 ? C.bad : p.riskBudget<=45 ? C.warn : C.good;
    const bColS = p.riskBudget<=20 ? C.badS : p.riskBudget<=45 ? C.warnS : C.goodS;
    this.add.rectangle(298,20,68,24, C.inset).setStrokeStyle(1, bColN).setOrigin(0,0);
    this.add.text(306,32, `⌖ ${p.riskBudget}`, { ...FONT_MONO, fontSize:'10px', color:bColS}).setOrigin(0,0.5);
    // вторая строка: погода · свиток · стрик · эпоха
    const scroll=p.errorScroll.filter(e=>!e.closed).length;
    this.add.text(50,50, `УР.${p.level} · ${this.epoch.name} · ⚑ ${p.weather} · ☰ ${scroll} · ×${p.streak}`, { ...FONT_MONO, fontSize:'7px', color:C.mutedS});
  }

  private createWeatherStrip(): void {
    // M13 погода рынка — режим дня, первая задача назвать режим
    const modes: Record<string,string> = { TREND:'ТРЕНД — следуй структуре', FLAT:'ФЛЭТ — жди границ', VOLATILE:'ВОЛАТИЛЬНОСТЬ — размер от ATR', NEWS:'ДЕНЬ НОВОСТЕЙ — факт vs шум', LATE_CYCLE:'ПОЗДНИЙ ЦИКЛ — жадность на пике'};
    this.add.rectangle(0,56,390,18, this.COLORS.surface).setOrigin(0).setStrokeStyle(1, this.COLORS.border);
    this.add.text(14,61, `ПОГОДА: ${modes[this.progress.weather] ?? modes.TREND}`, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS});
    this.add.text(300,61, `${this.epoch.levels[0]}–${this.epoch.levels[1]}`, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
  }

  private createQuestion(): void {
    // вопрос и условия — блок 1 из 4 (ТЗ Часть 1 §6.1), без раскрытия ответа (§5 Запреты)
    const q=this.encounter;
    const C=this.COLORS;
    if(this.P.brick){
      this.add.text(195,78, q.question.toUpperCase(), { fontFamily:C.fontHead, fontSize:'17px', color:C.accentS, align:'center', wordWrap:{width:352} }).setOrigin(0.5,0);
      this.add.text(195,120, `${q.ticker} · ${q.timeframe} · ${q.id} · атомы ${q.atoms.join(', ')}`, { ...FONT_MONO, fontSize:'7px', color:C.subS}).setOrigin(0.5,0);
    } else {
      this.add.rectangle(14,76,362,50, C.paper).setOrigin(0).setStrokeStyle(1, C.cyan);
      this.add.text(22,80, `СИТУАЦИЯ · ${q.id} · ${q.ticker} · ${q.timeframe}`, { ...FONT_MONO, fontSize:'7px', color:C.inkSubS});
      this.add.text(22,92, q.question, { ...FONT_UI, fontSize:'12px', color:C.inkTextS, wordWrap:{width:346}});
      const cardNeed = enemyById[q.enemyId]?.stages.find(st=>st.stage===q.stage)?.requiredCards.map(c=>c.cardId).join('+') ?? q.skills.slice(0,2).join('+');
      this.add.text(22,118, `НУЖНЫ КАРТЫ: ${cardNeed} · атомы ${q.atoms.join(', ')}`, { ...FONT_MONO, fontSize:'7px', color:C.mutedS});
    }
  }

  private createThreat(): void {
    // M5 опознание — до ответа только силуэт и UNKNOWN THREAT (Component Contract)
    this.add.rectangle(14,130,362,28, this.COLORS.surface).setStrokeStyle(1, this.COLORS.strong).setOrigin(0);
    this.add.circle(28,144,12, this.COLORS.inset).setStrokeStyle(1, this.COLORS.strong);
    this.add.text(28,144,'?', { ...FONT_MONO, fontSize:'13px', color:this.COLORS.accentS}).setOrigin(0.5);
    this.add.text(50,138,'UNKNOWN THREAT', { ...FONT_MONO, fontSize:'9px', color:this.COLORS.subS});
    this.add.text(50,148,'Враг раскроется после решения · M5', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    this.add.text(300,144, this.isStoneEpoch ? 'силуэт 5–8% rim' : 'иконка', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
  }

  private createBrowser(): void {
    const bx=14, by=162, bw=362, bh=188;
    this.add.rectangle(bx,by,bw,bh, this.COLORS.inset).setStrokeStyle(1, this.COLORS.strong).setOrigin(0);
    // хром
    this.add.rectangle(bx,by,bw,22, this.COLORS.elevated).setOrigin(0).setStrokeStyle(1, this.COLORS.border);
    this.add.text(bx+8,by+7,'● ● ●', { fontSize:'5px', color:this.COLORS.mutedS});
    this.add.text(bx+54,by+7,`arena://sandbox/${this.encounter.id.toLowerCase()}`, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    this.add.text(bx+bw-44,by+7,'SEED '+String(this.encounter.seed).slice(-5), { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    // вкладки — не более трёх, только релевантные (ТЗ Часть 4 §3)
    const tabs = this.encounter.sources.slice(0,3) as SourceId[];
    // M9 слепой источник: одна вкладка закрыта, открытие стоит бюджет
    const showBlind = this.progress.level >= balanceConfig.blind.introducedAt && tabs.length>=2 && !this.blindOpened;
    const tabW = bw/tabs.length;
    tabs.forEach((sid,i)=>{
      const isActive = sid===this.activeSource;
      const isBlind = showBlind && i===tabs.length-1;
      const tx = bx + i*tabW;
      const bg = isActive ? this.COLORS.hover : this.COLORS.surface;
      const border = isActive ? this.COLORS.cyan : this.COLORS.border;
      this.add.rectangle(tx, by+22, tabW, 28, bg).setStrokeStyle(1, border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        if(isBlind){
          // M9 — цена меньше цены ошибки (защита)
          if(this.progress.riskBudget < balanceConfig.riskBudget.blindSourceCost){
            this.cameras.main.flash(120,255,89,109);
            return;
          }
          gameState.changeBudget(-balanceConfig.riskBudget.blindSourceCost);
          this.blindOpened=true;
          this.scene.restart();
          return;
        }
        this.activeSource=sid; this.scene.restart();
      });
      const sdef = sourceById[sid];
      const label = isBlind ? '◉ ЗАКРЫТО' : `${sdef.icon} ${sdef.short}`;
      const col = isBlind ? this.COLORS.warnS : isActive ? this.COLORS.accentS : this.COLORS.mutedS;
      this.add.text(tx+tabW/2, by+36, label, { ...FONT_MONO, fontSize:'8px', color: col}).setOrigin(0.5);
      if(isBlind) this.add.text(tx+tabW/2, by+44, `-${balanceConfig.riskBudget.blindSourceCost} бюджета`, { ...FONT_MONO, fontSize:'6px', color:this.COLORS.mutedS}).setOrigin(0.5);
    });
    // панель источника
    this.renderSourcePanel(bx, by+50, bw, bh-50);
  }

  private renderSourcePanel(x:number,y:number,w:number,h:number){
    const sid=this.activeSource;
    const needEvidenceForEpoch = (balanceConfig.evidence.requiredInEpoch as any)[this.progress.epoch as any] ?? 1;
    // костыль ярлыков: в Улице все с ярлыками, в Кабинете частично, в Терминале нет, в Системе ложные (ТЗ Часть 2)
    const crutch = this.epoch.crutches.labels;
    const zoneList = this.encounter.mutatedEvidence.filter(z=> z.source===sid);
    if(sid==='chart'){
      this.add.text(x+10,y+6, `${this.encounter.ticker} · ${this.encounter.timeframe} · свечи + объём`, { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS});
      // мини-график из прямоугольников (без чисел-подсказок в поздних эпохах)
      const candles = this.fakeCandles();
      candles.forEach((c,i)=>{
        const cx = x+10 + i*22, cy = y+30;
        const col = c.dir==='up' ? this.COLORS.good : this.COLORS.bad;
        this.add.rectangle(cx, cy + (c.dir==='up'? 6:10), 12, 18, col, 0.9).setOrigin(0,0);
        this.add.rectangle(cx+5, cy, 2, 30, col, 0.45).setOrigin(0,0);
        if(c.isEvidence){
          // M1 улика — зона, тап собирается в evidence strip
          const isSelected = this.selectedEvidence.has(c.id);
          const hl = this.evidenceHighlights;
          this.add.rectangle(cx, cy-2, 16, 34, hl ? this.COLORS.accentN : this.COLORS.border, hl?0.12:0).setStrokeStyle(hl?1:1, hl? this.COLORS.accentN : this.COLORS.strong).setOrigin(0,0).setInteractive().on('pointerdown', ()=> this.toggleEvidence(c.id));
          if(hl){
            this.add.text(cx+8, cy+32, 'УЛИКА', { ...FONT_MONO, fontSize:'6px', color: isSelected? this.COLORS.goodS:this.COLORS.accentS, backgroundColor: isSelected? 'rgba(59,222,138,0.15)':'rgba(49,214,196,0.12)'}).setOrigin(0.5);
          } else {
            // без подсветки — игрок классифицирует сам
            this.add.rectangle(cx+8, cy+32, 8,8, isSelected? this.COLORS.good:this.COLORS.border).setStrokeStyle(1, isSelected? this.COLORS.good:0x62708A).setOrigin(0.5).setInteractive().on('pointerdown', ()=> this.toggleEvidence(c.id));
          }
          if(isSelected) this.add.circle(cx+14, cy-4, 5, this.COLORS.good).setStrokeStyle(1,this.COLORS.bg);
        }
      });
      // ярлыки-костыли
      if(crutch==='all'){
        this.add.text(x+10, y+76, 'ЯРЛЫК: ПАМP БЕЗ ОБЪЁМА ★', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.warnS, backgroundColor:'#14223A'}).setOrigin(0);
      } else if(crutch==='partial'){
        this.add.text(x+10, y+76, 'объём -38% к среднему', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
      } else if(crutch==='false'){
        this.add.text(x+10, y+76, 'ЯРЛЫК: ОБЪЁМ ПОДТВЕРЖДЁН ✓ (ЛОЖНЫЙ)', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.badS, backgroundColor:'rgba(255,89,109,0.12)'}).setOrigin(0);
      } else {
        this.add.text(x+10, y+76, 'сырые данные — решай сам', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
      }
      // доп улики из evidence
      zoneList.forEach((z,i)=>{
        const zzY = y+90 + i*18;
        const sel=this.selectedEvidence.has(z.id);
        this.add.rectangle(x+10, zzY, w-20, 16, sel? this.COLORS.hover:this.COLORS.surface).setStrokeStyle(1, sel? this.COLORS.cyan:this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=> this.toggleEvidence(z.id));
        this.add.text(x+16, zzY+4, (sel?'✓ ':'○ ')+z.label, { ...FONT_MONO, fontSize:'7px', color: sel?this.COLORS.textS:this.COLORS.subS, wordWrap:{width:w-36}}).setOrigin(0);
        if(this.evidenceHighlights && z.isCorrect) this.add.text(x+w-34, zzY+4, '★', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.warnS}).setOrigin(0.5);
      });
    } else if(sid==='news'){
      this.add.text(x+10,y+6, 'ЛЕНТА НОВОСТЕЙ — проверяй источник', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS});
      const newsItems = [
        {t:'Кит скупил 12 000 BTC', src:'anon TG-канал', time:'12:04', isCorrect: false},
        {t:'Объём спота -35% к среднему', src:'биржа/данные', time:'11:58', isCorrect: true},
        {t:'Аналитик: «полёт на луну»', src:'инфлюенсер', time:'11:40', isCorrect: false},
      ];
      newsItems.forEach((n,i)=>{
        const ny=y+22+i*28;
        const isEvidence = i===1;
        this.add.rectangle(x+10, ny, w-20, 24, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
          if(isEvidence) this.toggleEvidence('ev-src');
        });
        const lbl = crutch==='all' ? (isEvidence?'ФЕЙК':'ФУНДАМЕНТ') : crutch==='false' && i===0 ? 'ПОДТВЕРЖДЕНО' : '';
        if(lbl) this.add.text(x+w-60, ny+4, lbl, { ...FONT_MONO, fontSize:'6px', color: lbl==='ФЕЙК'?this.COLORS.badS:this.COLORS.goodS, backgroundColor:'rgba(255,255,255,0.04)'}).setOrigin(0);
        this.add.text(x+16, ny+4, n.t, { ...FONT_UI, fontSize:'9px', color:this.COLORS.textS});
        this.add.text(x+16, ny+14, `${n.src} · ${n.time}`, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
        if(isEvidence && this.selectedEvidence.has('ev-src')) this.add.text(x+16, ny+2,'✓', { ...FONT_MONO, fontSize:'9px', color:this.COLORS.goodS});
      });
      zoneList.forEach((z,i)=>{
        const zzY=y+108+i*16;
        const sel=this.selectedEvidence.has(z.id);
        this.add.rectangle(x+10, zzY, w-20, 14, sel?this.COLORS.hover:this.COLORS.surface).setStrokeStyle(1, sel? this.COLORS.cyan:this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=> this.toggleEvidence(z.id));
        this.add.text(x+16, zzY+3, (sel?'✓ ':'○ ')+z.label, { ...FONT_MONO, fontSize:'7px', color: sel?this.COLORS.textS:this.COLORS.subS}).setOrigin(0);
      });
    } else if(sid==='position'){
      this.add.text(x+10,y+6,'ПОЗИЦИЯ / КАЛЬКУЛЯТОР РИСКА — журнал сделок', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS});
      this.add.rectangle(x+10,y+22,w-20,58,this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
      this.add.text(x+16,y+28,'ДЕПОЗИТ 2 400 · РИСК 1% = 24 · СТОП 2.1% · ПЛЕЧО x4', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.textS});
      this.add.text(x+16,y+40,'ЛИКВИДАЦИЯ  -18% · R:R 1:2.1 · СЕРИЯ L-L-W', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
      this.add.text(x+16,y+52,'ЖУРНАЛ: 2× вход без стопа (ошибки E04,E05)', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.badS});
      this.add.text(x+10,y+86,'УЛИКИ — тап по зоне', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
      zoneList.forEach((z,i)=>{
        const zzY=y+98+i*16;
        const sel=this.selectedEvidence.has(z.id);
        this.add.rectangle(x+10, zzY, w-20, 14, sel?this.COLORS.hover:this.COLORS.surface).setStrokeStyle(1, sel? this.COLORS.cyan:this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=> this.toggleEvidence(z.id));
        this.add.text(x+16, zzY+3,(sel?'✓ ':'○ ')+z.label, { ...FONT_MONO, fontSize:'7px', color: sel?this.COLORS.textS:this.COLORS.subS}).setOrigin(0);
      });
    } else if(sid==='orderbook'){
      this.add.text(x+10,y+6,'СТАКАН И ЛИКВИДАЦИИ — стены и funding', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS});
      this.add.rectangle(x+10,y+22, (w-24)/2,64,this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
      this.add.text(x+16,y+28,'BIDS  0.82  1.40', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.goodS});
      this.add.text(x+16,y+38,'ASKS  0.90  0.40', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.badS});
      this.add.text(x+16,y+52,'СТЕН НЕТ — тонкий стакан', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.warnS});
      this.add.rectangle(x+10+(w-24)/2+4,y+22,(w-24)/2,64,this.COLORS.inset).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
      this.add.text(x+16+(w-24)/2,y+28,'FUNDING  +0.012% · OI ↑', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS});
      this.add.text(x+16+(w-24)/2,y+40,'ЛИКВИДАЦИЙ кластер  -3%', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.cryptoS});
      zoneList.forEach((z,i)=>{
        const zzY=y+92+i*16;
        const sel=this.selectedEvidence.has(z.id);
        this.add.rectangle(x+10, zzY, w-20, 14, sel?this.COLORS.hover:this.COLORS.surface).setStrokeStyle(1, sel? this.COLORS.cyan:this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=> this.toggleEvidence(z.id));
        this.add.text(x+16, zzY+3,(sel?'✓ ':'○ ')+z.label, { ...FONT_MONO, fontSize:'7px', color: sel?this.COLORS.textS:this.COLORS.subS}).setOrigin(0);
      });
    } else {
      // прочие источники — заглушка с уликами
      this.add.text(x+10,y+6, sourceById[sid].name + ' — сырые данные', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS});
      this.add.text(x+10,y+24, 'СЫРЫЕ ДАННЫЕ — классифицируй сам (эпоха '+this.epoch.name+')', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS, wordWrap:{width:w-20}});
      zoneList.forEach((z,i)=>{
        const zzY=y+48+i*18;
        const sel=this.selectedEvidence.has(z.id);
        this.add.rectangle(x+10, zzY, w-20, 16, sel?this.COLORS.hover:this.COLORS.surface).setStrokeStyle(1, sel? this.COLORS.cyan:this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=> this.toggleEvidence(z.id));
        this.add.text(x+16, zzY+4,(sel?'✓ ':'○ ')+z.label, { ...FONT_MONO, fontSize:'7px', color: sel?this.COLORS.textS:this.COLORS.subS, wordWrap:{width:w-36}}).setOrigin(0);
      });
    }
  }

  private fakeCandles(): {id:string, dir:'up'|'down', isEvidence:boolean}[]{
    const arr=[];
    for(let i=0;i<12;i++) arr.push({id: i===7?'ev-vol':'c'+i, dir: i%2===0?'up':'down' as any, isEvidence: i===7});
    return arr;
  }

  private toggleEvidence(id:string){
    if(this.selectedEvidence.has(id)) this.selectedEvidence.delete(id);
    else {
      // в Терминале нужно 2 улики из разных источников (M1)
      const need = (balanceConfig.evidence.requiredInEpoch as any)[this.progress.epoch as any] ?? 1;
      if(this.selectedEvidence.size >= need && need>1){
        // позволить заменить
        const first = [...this.selectedEvidence][0]; this.selectedEvidence.delete(first);
      } else if(this.selectedEvidence.size>=1 && need===1){
        this.selectedEvidence.clear();
      }
      this.selectedEvidence.add(id);
    }
    this.cameras.main.flash(40,49,214,196);
    this.refreshEvidenceStrip();
    // обновляем кнопку «К решению» в Улице
    if(this.isStoneEpoch) this.refreshActionButton();
  }

  private createEvidenceStrip(): void {
    const ey=354;
    this.add.rectangle(14,ey,362,18, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
    this.add.text(20,ey+5,'УЛИКИ:', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    this.refreshEvidenceStrip();
    if(this.isStoneEpoch){
      this.add.text(260,ey+5,'нужно минимум 1', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    }
  }
  private refreshEvidenceStrip(){
    // перерисовка полосы подтверждений (M1)
    const ey=354;
    // очистить старые чипы уликами — проще поверх
    const chips = this.selectedEvidence.size ? [...this.selectedEvidence].join(' · ') : '— тапни зону в источнике —';
    const col = this.selectedEvidence.size ? this.COLORS.textS : this.COLORS.mutedS;
    // стираем область
    this.add.rectangle(58,ey+1,160,16, this.COLORS.surface).setOrigin(0);
    this.add.text(58,ey+5, chips.slice(0,32), { ...FONT_MONO, fontSize:'7px', color: col}).setOrigin(0);
  }
  private refreshActionButton(){
    // в Улице — кнопка «К решению» активируется после улики (M1 эволюция)
    const need = this.selectedEvidence.size>0;
    const btnY=700; // будет нижняя кнопка
  }

  private createSkills(): void {
    // Карты действий — единственный мост Академия → Арена (ТЗ Часть 1 §5)
    const raw = this.encounter.skills.slice(0,4);
    // добавляем ЖДАТЬ — M10 холодная голова, легитимное бездействие
    if(!raw.includes('Cwait')) raw.push('Cwait');
    const skills = raw.slice(0,4).map(id=>{
      if(id==='Cwait') return { id:'Cwait', name:'ЖДАТЬ', icon:'◷', domain:'human' as any, unlocked:true, rank:0 };
      const c=cardById[id];
      return { id:c.id, name:c.short, icon:c.icon, domain:c.domain, unlocked: gameState.isCardUnlocked(c.id), rank: gameState.progress.cardRanks[c.id]??0 };
    });
    const isSequenceMode = this.progress.level >= balanceConfig.sequence.introducedAt && this.encounter.skills.length>=2 && this.epoch.id!=='street';
    const cardW=(362-18)/4;
    skills.forEach((s,i)=>{
      const sx=14+i*(cardW+6), sy=376;
      const isSelected = isSequenceMode ? this.selectedSequence.includes(s.id) : false;
      const unlocked = s.unlocked;
      const bg = !unlocked ? this.COLORS.inset : isSelected ? this.COLORS.hover : this.COLORS.surface;
      const border = !unlocked ? this.COLORS.border : isSelected ? this.COLORS.cyan : this.COLORS.border;
      this.add.rectangle(sx,sy,cardW,54, bg).setStrokeStyle(isSelected?2:1, border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        if(!unlocked) { this.cameras.main.shake(80,0.004); return; }
        if(isSequenceMode){
          if(this.selectedSequence.includes(s.id)) this.selectedSequence = this.selectedSequence.filter(x=>x!==s.id);
          else {
            if(this.selectedSequence.length < ((balanceConfig.sequence.slotsByEpoch as any)[this.progress.epoch as any] ?? 2)) this.selectedSequence.push(s.id);
          }
          this.scene.restart();
        } else {
          // одиночный выбор подсвечивает
          this.selectedSequence=[s.id];
          this.scene.restart();
        }
      });
      const iconCol = !unlocked ? this.COLORS.mutedS : (s as any).rank>=2 ? this.COLORS.goodS : this.COLORS.accentS;
      // мини-арт карты (SVG-текстура) вместо ASCII-иконки
      const ck = cardKey(s.id);
      if(this.textures.exists(ck)){
        const img = this.add.image(sx+cardW/2, sy+16, ck).setDisplaySize(16,24);
        if(!unlocked) img.setTint(0x62708A);
        else if((s as any).rank>=2) img.setTint(0x9BEBB0);
        else img.setTint(0x9DE8E2);
      } else {
        this.add.text(sx+cardW/2, sy+14, s.icon, { fontSize:'14px', color: iconCol}).setOrigin(0.5);
      }
      this.add.text(sx+cardW/2, sy+32, s.name, { ...FONT_MONO, fontSize:'7px', color: unlocked?this.COLORS.subS:this.COLORS.mutedS}).setOrigin(0.5);
      if(s.id!=='Cwait'){
        const r = (s as any).rank;
        const rankLabel = r===0?'r1': r===1?'r1': r>=2?'r'+(r+1):'r1';
        this.add.text(sx+cardW/2, sy+42, rankLabel, { ...FONT_MONO, fontSize:'6px', color:this.COLORS.mutedS}).setOrigin(0.5);
      } else {
        this.add.text(sx+cardW/2, sy+42, 'M10', { ...FONT_MONO, fontSize:'6px', color:this.COLORS.warnS}).setOrigin(0.5);
      }
      if(isSelected){
        this.add.text(sx+cardW/2, sy+50, String(this.selectedSequence.indexOf(s.id)+1), { ...FONT_MONO, fontSize:'7px', color:this.COLORS.accentS}).setOrigin(0.5);
      }
    });
    if(isSequenceMode){
      this.add.text(14,432, `M2 СТЕК: выстрой ${(balanceConfig.sequence.slotsByEpoch as any)[this.progress.epoch as any]} карты по порядку анализа: контекст → уровни → объём → риск`, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS, wordWrap:{width:362}});
      const hasDecoy = this.epoch.id==='system' && balanceConfig.sequence.hasDecoyInSystem;
      if(hasDecoy) this.add.text(14,444,'+ одна лишняя карта (ловушка)', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.badS});
      // порядок в стеке визуально
      this.add.rectangle(14,452,362,18, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
      const seqText = this.selectedSequence.length ? this.selectedSequence.join(' → ') : 'тапни карты внизу чтобы собрать стек';
      this.add.text(20,456, seqText, { ...FONT_MONO, fontSize:'7px', color: this.selectedSequence.length?this.COLORS.textS:this.COLORS.mutedS}).setOrigin(0);
    } else {
      this.add.text(14,432, 'КАРТЫ ДЕЙСТВИЙ — тапни карту перед ответом (Мост Академия→Арена)', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    }
  }

  private createAnswerBlock(): void {
    const isVerdict = !!this.encounter.verdict && this.progress.level >= balanceConfig.verdict.introducedAt;
    const isSequence = this.progress.level >= balanceConfig.sequence.introducedAt && this.epoch.id!=='street';
    // M4 вердикт — двухшаговый
    if(isVerdict && !this.verdictFactor){
      this.add.text(14,476,'M4 ВЕРДИКТ КОНФЛИКТА — что доминирует?', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.warnS});
      const opts=[
        {k:'A', t: this.encounter.verdict!.factorA},
        {k:'B', t: this.encounter.verdict!.factorB},
      ];
      opts.forEach((o,i)=>{
        const ay=492+i*40;
        this.add.rectangle(14,ay,362,36, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
          this.verdictFactor=o.k as any; this.scene.restart();
        });
        this.add.text(28,ay+12, o.k, { ...FONT_MONO, fontSize:'11px', color:this.COLORS.accentS});
        this.add.text(50,ay+12, o.t, { ...FONT_UI, fontSize:'11px', color:this.COLORS.textS, wordWrap:{width:300}});
      });
      return;
    }
    if(isVerdict && this.verdictFactor){
      this.add.text(14,476,`M4 — доминирует: ${this.verdictFactor==='A'? this.encounter.verdict!.factorA : this.encounter.verdict!.factorB} → теперь действие`, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.goodS});
    }

    // обычные 4 варианта или стек-подтверждение
    if(isSequence){
      const canSubmit = this.selectedSequence.length >= (balanceConfig.sequence.slotsByEpoch as any)[this.progress.epoch as any];
      const needEvidence = this.selectedEvidence.size>0;
      this.add.rectangle(14,580,362,42, canSubmit && needEvidence ? this.COLORS.cyan : this.COLORS.elevated).setStrokeStyle(1, canSubmit && needEvidence ? this.COLORS.cyan: this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        if(!needEvidence){ this.cameras.main.flash(100,255,89,109); return; }
        if(!canSubmit){ this.cameras.main.shake(80,0.003); return; }
        this.submitSequence();
      });
      this.add.text(195,601, canSubmit && needEvidence ? 'ПОДТВЕРДИТЬ СТЕК → СТАВКА' : (!needEvidence? 'СНАЧАЛА УЛИКА (M1)':'СОБЕРИ СТЕК (M2)'), { ...FONT_UI, fontSize:'11px', color: canSubmit && needEvidence ? '#03110f':this.COLORS.mutedS}).setOrigin(0.5);
      if(!needEvidence) this.add.text(195,615, 'без верной улики — «верно, но необоснованно»', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS}).setOrigin(0.5);
      return;
    }

    // стандартный блок ответов — сетка 2×2 (согласованный макет)
    const answers = this.encounter.mutatedAnswers;
    answers.forEach((a,i)=>{
      const col=i%2, row=Math.floor(i/2);
      const ax=14+col*184, ay=470+row*66;
      const isSel=this.selectedAnswer===i;
      const C=this.COLORS;
      this.add.rectangle(ax,ay,178,60, isSel? C.accentN : C.surface, isSel?1:0.94).setStrokeStyle(1, isSel? C.accentN : C.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        // M10 задержка после серии ошибок
        const tilt = this.progress.errorScroll.filter(e=>!e.closed).length >= balanceConfig.coldHead.tiltThreshold;
        if(tilt && !this.selectedAnswer){
          this.add.text(195, ay+62, '◷ холодная голова — вдох...', { ...FONT_MONO, fontSize:'7px', color:C.warnS}).setOrigin(0.5);
          this.time.delayedCall(balanceConfig.coldHead.delayMs, ()=> { this.selectedAnswer=i; this.showConfidencePicker(); });
          return;
        }
        this.selectedAnswer=i; this.showConfidencePicker();
      });
      this.add.text(ax+10,ay+10, a.label, { ...FONT_MONO, fontSize:'10px', color: isSel? '#0a0b0d' : (a.isWait? C.warnS : C.badS)});
      this.add.text(ax+10,ay+26, a.text, { ...FONT_UI, fontSize:'9px', color: isSel? '#0a0b0d' : C.textS, wordWrap:{width:158}});
    });
    // подсказка M1
    if(this.selectedAnswer===null){
      this.add.text(14, 672, 'M1: выбери улику в источнике, затем ответ — иначе неполная награда', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    }
  }

  private showConfidencePicker(){
    if(this.confidence) return;
    // M3 ставка уверенности
    const by=660; // поверх ответов
    this.add.rectangle(14,by,362,54, this.COLORS.elevated).setStrokeStyle(1, this.COLORS.cyan).setOrigin(0);
    this.add.text(20,by+6,'M3 СТАВКА УВЕРЕННОСТИ — как уверен?', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS});
    const opts: {k:Confidence, t:string, mul:string}[]=[
      {k:'low', t:'НИЗКО', mul:'×0.6 — мягкий срез'},
      {k:'mid', t:'СРЕДНЕ', mul:'×1.0'},
      {k:'high', t:'ВЫСОКО', mul:'×1.6 — ошибка дороже'},
    ];
    opts.forEach((o,i)=>{
      const x=20+i*114;
      this.add.rectangle(x,by+20,108,28, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        this.confidence=o.k; this.submitAnswer();
      });
      this.add.text(x+54,by+28, o.t, { ...FONT_MONO, fontSize:'8px', color: o.k==='high'? this.COLORS.warnS:this.COLORS.textS}).setOrigin(0.5);
      this.add.text(x+54,by+38, o.mul, { ...FONT_MONO, fontSize:'6px', color:this.COLORS.mutedS}).setOrigin(0.5);
    });
  }

  private submitSequence(){
    // проверяем стек — допустимые порядки из шаблона (упрощено: правильный порядок — по списку skills)
    const correctOrder = this.encounter.skills.slice(0, (balanceConfig.sequence.slotsByEpoch as any)[this.progress.epoch as any]);
    const isCorrect = this.selectedSequence.length===correctOrder.length && this.selectedSequence.every((v,i)=> v===correctOrder[i]);
    // улика
    const need = (balanceConfig.evidence.requiredInEpoch as any)[this.progress.epoch as any] ?? 1;
    const hasCorrectEvidence = [...this.selectedEvidence].some(id=> this.encounter.mutatedEvidence.find(z=> z.id===id && z.isCorrect));
    const isJustified = hasCorrectEvidence && this.selectedEvidence.size>=need;
    this.showConfidenceAfter(()=>{
      const verdict = scoreEncounter({ domain: this.encounter.domain, isCorrect, isJustified, confidence: this.confidence, level:this.progress.level, epoch:this.progress.epoch, streak:this.progress.streak});
      this.handleResult(verdict, isCorrect, isJustified);
    });
  }

  private showConfidenceAfter(cb:()=>void){
    if(this.confidence){ cb(); return; }
    const by=660;
    this.add.rectangle(14,by,362,54, this.COLORS.elevated).setStrokeStyle(1, this.COLORS.cyan).setOrigin(0);
    this.add.text(20,by+6,'M3 СТАВКА — выбери уверенность для стека', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS});
    const opts: {k:Confidence, t:string}[]=[{k:'low',t:'НИЗКО'},{k:'mid',t:'СРЕДНЕ'},{k:'high',t:'ВЫСОКО'}];
    opts.forEach((o,i)=>{
      const x=20+i*114;
      this.add.rectangle(x,by+20,108,28, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{ this.confidence=o.k; cb(); });
      this.add.text(x+54,by+34, o.t, { ...FONT_MONO, fontSize:'8px', color:this.COLORS.textS}).setOrigin(0.5);
    });
  }

  private submitAnswer(){
    if(this.selectedAnswer===null) return;
    const isCorrect = this.selectedAnswer===this.encounter.correctAnswer;
    // M4 проверка вердикта
    if(this.encounter.verdict && this.progress.level>=balanceConfig.verdict.introducedAt){
      const verdictCorrect = this.verdictFactor===this.encounter.verdict.correctFactor;
      if(!verdictCorrect){
        // частичный балл только за верный первый шаг — здесь ошибка первого шага → весь неверно
        const need = (balanceConfig.evidence.requiredInEpoch as any)[this.progress.epoch as any] ?? 1;
        const hasCorrectEvidence = [...this.selectedEvidence].some(id=> this.encounter.mutatedEvidence.find(z=> z.id===id && z.isCorrect));
        const isJustified = hasCorrectEvidence && this.selectedEvidence.size>=need;
        const verdict = scoreEncounter({ domain: this.encounter.domain, isCorrect:false, isJustified, confidence:this.confidence, level:this.progress.level, epoch:this.progress.epoch, streak:this.progress.streak});
        this.handleResult(verdict,false,isJustified);
        return;
      }
    }
    const need = (balanceConfig.evidence.requiredInEpoch as any)[this.progress.epoch as any] ?? 1;
    const hasCorrectEvidence = [...this.selectedEvidence].some(id=> this.encounter.mutatedEvidence.find(z=> z.id===id && z.isCorrect));
    const isJustified = hasCorrectEvidence && this.selectedEvidence.size>=need;
    const verdict = scoreEncounter({ domain: this.encounter.domain, isCorrect, isJustified, confidence: this.confidence, level:this.progress.level, epoch:this.progress.epoch, streak:this.progress.streak});
    this.handleResult(verdict, isCorrect, isJustified);
  }

  private handleResult(v:ReturnType<typeof scoreEncounter>, isCorrect:boolean, isJustified:boolean){
    // калибровка M3
    const confVal = this.confidence==='high'?0.9: this.confidence==='mid'?0.65:0.35;
    gameState.addCalibration(confVal, isCorrect?1:0);
    // свиток ошибок M7
    if(!isCorrect || !isJustified){
      const atom = this.encounter.atoms[0] ?? 'C2.3';
      gameState.pushError(this.encounter.enemyId, atom, [...this.selectedEvidence].join(',')||'нет улики');
    } else {
      // закрыть запись если была
      const open = this.progress.errorScroll.find(e=> e.enemy===this.encounter.enemyId && !e.closed);
      if(open) gameState.closeError(open.id);
    }
    gameState.addXp(v.xp);
    gameState.addCoins(v.coins);
    const newBudget = gameState.changeBudget(v.budgetDelta);
    if(newBudget<=0){
      this.showLeviathan();
      return;
    }
    // комбо M8 — N верных совместных применений
    if(isCorrect && isJustified && this.selectedSequence.length>=2){
      // упрощённо: считаем комбо по паре первых карт
      const comboId = this.selectedSequence.slice(0,2).join('+');
      // в реальном движке — счётчик в combo_progress
    }
    this.showFeedback(v, isCorrect, isJustified);
  }

  private showFeedback(v:ReturnType<typeof scoreEncounter>, isCorrect:boolean, isJustified:boolean){
    const overlay = this.add.rectangle(0,0,390,844, this.COLORS.bg, 0.92).setOrigin(0).setInteractive();
    const topY=110;
    // M6 проигрыш вперёд — график доигрывает 6 свечей
    this.add.rectangle(20, topY, 350, 70, this.COLORS.inset).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
    this.add.text(28, topY+8, 'M6 ПРОИГРЫШ ВПЕРЁД — график доигрывает...', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS});
    // анимируем свечи
    const g = this.add.graphics();
    g.lineStyle(1, isCorrect? this.COLORS.good:this.COLORS.bad, 0.9);
    for(let i=0;i<6;i++){
      this.time.delayedCall(i*280, ()=>{
        const cx=28+i*54, cy=topY+26;
        g.strokeRect(cx, cy, 44, isCorrect? 18: 26);
        if(i===5) g.fillStyle(isCorrect?this.COLORS.good:this.COLORS.bad,0.2).fillRect(cx,cy,44, isCorrect?18:26);
      });
    }
    this.time.delayedCall(1800, ()=>{
      this.add.text(195, topY+62, isCorrect? 'твоя линия vs верная — разница в результате видна' : 'цена пошла против тебя — смотри, где была улика', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS, wordWrap:{width:330}}).setOrigin(0.5);
    });

    // заголовок результата
    const title = !isCorrect ? 'НЕВЕРНО' : !isJustified ? 'ВЕРНО, НО НЕОБОСНОВАННО' : 'ВЕРНО';
    const col = !isCorrect ? this.COLORS.badS : !isJustified ? this.COLORS.warnS : this.COLORS.goodS;
    this.add.text(195, 200, title, { ...FONT_UI, fontSize:'18px', color: col}).setOrigin(0.5);
    this.add.text(195, 222, isJustified ? 'улики верны · враг побеждён' : 'без верной улики — враг не побеждён (M1 защита)', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS}).setOrigin(0.5);

    // M5 опознание
    this.time.delayedCall(400, ()=> this.showIdentify(overlay, v, isCorrect, isJustified));
  }

  private showIdentify(overlay:Phaser.GameObjects.Rectangle, v:ReturnType<typeof scoreEncounter>, isCorrect:boolean, isJustified:boolean){
    const y=250;
    this.add.text(20, y, 'M5 ОПОЗНАНИЕ ВРАГА — кто это был?', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS});
    const domain = this.encounter.domain;
    const opts = enemies.filter(e=> e.domain===domain).slice(0, (balanceConfig.identify.optionsByEpoch as any)[this.progress.epoch as any] ?? 2);
    if(opts.length===0) opts.push(enemyById[this.encounter.enemyId]);
    // гарантируем что правильный в списке
    if(!opts.find(e=> e.id===this.encounter.enemyId)) opts[0]=enemyById[this.encounter.enemyId];

    opts.forEach((e,i)=>{
      const cx=20+i* (352/opts.length) + 10, cy=y+24;
      const w= (352/opts.length)-12;
      const isReal = e.id===this.encounter.enemyId;
      this.add.rectangle(cx, cy, w, 64, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        const ok=isReal;
        this.add.text(195, y+100, ok? `✓ ${e.name} — рендер раскрыт (S${this.encounter.stage})` : `✗ это ${e.name}, а был ${enemyById[this.encounter.enemyId].name}`, { ...FONT_MONO, fontSize:'8px', color: ok?this.COLORS.goodS:this.COLORS.badS, wordWrap:{width:350}}).setOrigin(0.5);
        if(ok){
          // эволюция трофея — M12
          const cur = gameState.progress.enemyStagesReached[e.id] ?? 0;
          if(this.encounter.stage>cur) gameState.progress.enemyStagesReached[e.id]=this.encounter.stage;
          gameState.save();
        }
        this.time.delayedCall(800, ()=> this.showShadowAndReward(overlay, v, isCorrect, isJustified));
      });
      this.add.text(cx+w/2, cy+22, e.name.split(' ')[0], { ...FONT_MONO, fontSize:'7px', color:this.COLORS.textS}).setOrigin(0.5);
      this.add.text(cx+w/2, cy+34, e.id, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS}).setOrigin(0.5);
      // портрет-заглушка (SVG-аватар, одинаковый палитрой по домену — стилистически близкие)
      this.add.circle(cx+w/2, cy+50, 11, this.COLORS.inset).setStrokeStyle(1, this.COLORS.strong);
      const avKey = enemyAvatarKey(e.id);
      if(this.textures.exists(avKey)){
        this.add.image(cx+w/2, cy+50, avKey).setDisplaySize(26,26).setAlpha(0.9);
      } else {
        this.add.text(cx+w/2, cy+50, '?', { ...FONT_MONO, fontSize:'10px', color:this.COLORS.cryptoS}).setOrigin(0.5);
      }
    });
    this.add.text(195, y+98, 'тапни портрет — после ответа', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS}).setOrigin(0.5);
  }

  private showShadowAndReward(overlay:Phaser.GameObjects.Rectangle, v:ReturnType<typeof scoreEncounter>, isCorrect:boolean, isJustified:boolean){
    const y=360;
    // M14 тень арены
    this.add.text(20, y, 'M14 ТЕНЬ АРЕНЫ — как ответили другие', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.subS});
    const dist = isCorrect ? [12,58,22,8] : [38,18,32,12]; // проценты A-D
    const labels=['A','B','C','D'];
    dist.forEach((pct,i)=>{
      const bx=20+i*88;
      this.add.rectangle(bx, y+18, 80, 10, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
      this.add.rectangle(bx, y+18, Math.round(80*pct/100), 10, i===this.encounter.correctAnswer? this.COLORS.good : this.COLORS.muted).setOrigin(0);
      this.add.text(bx+40, y+32, `${labels[i]} ${pct}%`, { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS}).setOrigin(0.5);
    });
    this.add.text(20, y+48, isCorrect? 'ты с большинством, но 42% попались на ловушку C (типовое искажение)' : 'типовое искажение толпы — FOMO (E05) сработало на 38%', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS, wordWrap:{width:350}}).setOrigin(0);

    // награда и бюджет
    const rewardY=430;
    this.add.rectangle(20, rewardY, 350, 44, this.COLORS.surface).setStrokeStyle(1, this.COLORS.border).setOrigin(0);
    const xpTxt = v.xp? `+${v.xp} XP` : '+0 XP';
    const coinTxt = v.coins? `+${v.coins} SIG` : '+0 SIG';
    const budTxt = v.budgetDelta>0? `+${v.budgetDelta} бюджет` : v.budgetDelta<0? `${v.budgetDelta} бюджет` : 'бюджет 0';
    this.add.text(28, rewardY+8, `${xpTxt}  ·  ${coinTxt}  ·  ${budTxt}`, { ...FONT_MONO, fontSize:'10px', color: isCorrect && isJustified ? this.COLORS.goodS:this.COLORS.warnS}).setOrigin(0);
    this.add.text(28, rewardY+24, isJustified? 'M1 зачтена · M3 '+ (this.confidence??'—') + ' · M15 бюджет '+gameState.progress.riskBudget : 'M1 не зачтена — неполная награда', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.mutedS}).setOrigin(0);

    // M8 комбо прогресс (если было)
    if(isCorrect && isJustified){
      this.add.text(20, rewardY+50, 'M8 комбо: прогресс засчитан (нужно '+balanceConfig.combo.requiredCorrect+' совместных применений ранга ≥2)', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.accentS});
    }

    // CTA
    this.add.rectangle(20, 520, 350, 44, this.COLORS.cyan).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      overlay.destroy();
      // проверка эпохи перехода — событие перерисовки токенов
      const oldEp = this.epoch.id;
      const newEp = getEpochForLevel(gameState.progress.level);
      if(oldEp!==newEp){
        this.showEpochTransition(oldEp, newEp);
      } else {
        this.scene.restart();
      }
    });
    this.add.text(195, 542, 'ДАЛЕЕ → РАЗМИНКА', { ...FONT_UI, fontSize:'13px', color:'#03110f'}).setOrigin(0.5);
    this.add.text(195, 570, 'эпоха взрослеет без новых экранов — только состояния блоков (ТЗ Часть 3)', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS}).setOrigin(0.5);
  }

  private showLeviathan(){
    const overlay=this.add.rectangle(0,0,390,844, 0x05070D, 0.96).setOrigin(0).setInteractive();
    this.add.text(195, 260, 'BUDGET = 0', { ...FONT_MONO, fontSize:'28px', color:this.COLORS.badS}).setOrigin(0.5);
    this.add.text(195, 300, 'DRAWDOWN LEVIATHAN', { ...FONT_UI, fontSize:'18px', color:this.COLORS.textS}).setOrigin(0.5);
    this.add.text(195, 330, 'СБЫТИЕ С БЮДЖЕТОМ · СОБЫТИЙНАЯ ВСТРЕЧА E31 S1', { ...FONT_MONO, fontSize:'9px', color:this.COLORS.subS}).setOrigin(0.5);
    this.add.text(195, 360, 'Твой риск-менеджмент привёл к обнулению.\nРазбор структуры потерь — без трофея, но с восстановлением 40 бюджета.', { ...FONT_UI, fontSize:'11px', color:this.COLORS.subS, align:'center', wordWrap:{width:320}}).setOrigin(0.5);
    this.add.rectangle(70, 440, 250, 44, this.COLORS.elevated).setStrokeStyle(1, this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      gameState.changeBudget(40);
      overlay.destroy();
      this.scene.restart();
    });
    this.add.text(195, 462, 'РАЗОБРАТЬ И ВОССТАНОВИТЬ', { ...FONT_UI, fontSize:'12px', color:this.COLORS.accentS}).setOrigin(0.5);
  }

  private showEpochTransition(from:string, to:string){
    const overlay=this.add.rectangle(0,0,390,844, this.COLORS.bg, 0.96).setOrigin(0).setInteractive();
    this.add.text(195, 300, 'ЭПОХА СМЕНИЛАСЬ', { ...FONT_MONO, fontSize:'12px', color:this.COLORS.subS}).setOrigin(0.5);
    this.add.text(195, 330, `${from.toUpperCase()}  →  ${to.toUpperCase()}`, { ...FONT_UI, fontSize:'20px', color:this.COLORS.textS}).setOrigin(0.5);
    this.add.text(195, 360, epochOf(gameState.progress.level).motto, { ...FONT_UI, fontSize:'10px', color:this.COLORS.warnS, align:'center', wordWrap:{width:320}}).setOrigin(0.5);
    this.add.text(195, 400, 'Скелет один — взрослеют токены, костыли и форма ответа.\nНавигация выросла, ярлыки сняты, «К решению» исчез.', { ...FONT_MONO, fontSize:'8px', color:this.COLORS.mutedS, align:'center', wordWrap:{width:320}}).setOrigin(0.5);
    this.add.rectangle(70, 460, 250, 44, this.COLORS.cyan).setOrigin(0).setInteractive().on('pointerdown', ()=>{ overlay.destroy(); this.scene.restart(); });
    this.add.text(195,482,'ПРОДОЛЖИТЬ В НОВОЙ ЭПОХЕ', { ...FONT_UI, fontSize:'12px', color:'#03110f'}).setOrigin(0.5);
  }

  private createBottomNav(): void {
    const nav = this.epoch.nav;
    const C=this.COLORS;
    const all = ['ACADEMY','ARENA','COLLECTION','MORE'];
    const ru: Record<string,string> = { ACADEMY:'АКАДЕМИЯ', ARENA:'АРЕНА', COLLECTION:'КОЛЛЕКЦИЯ', MORE:'ЕЩЁ' };
    const ic: Record<string,string> = { ACADEMY:'nav-academy', ARENA:'nav-arena', COLLECTION:'nav-collection', MORE:'nav-more' };
    this.add.rectangle(0,784,390,60, 0x0a0b0d, 0.96).setOrigin(0);
    this.add.rectangle(0,784,390,1, C.border).setOrigin(0);
    all.forEach((label,i)=>{
      const unlocked = nav.includes(label) || (label==='MORE' && (nav.includes('TOURNAMENTS') || nav.includes('MARKET')));
      const isActive = label==='ARENA';
      const nx=i*(390/4);
      this.add.rectangle(nx,784,390/4,60,0x000000,0).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        if(!unlocked){ this.cameras.main.flash(60,255,179,65); return; }
        if(label==='ACADEMY') this.scene.start('AcademyScene');
        if(label==='COLLECTION') this.scene.start('CollectionScene');
        if(label==='MORE') this.scene.start('MoreScene');
      });
      const k='icon_'+ic[label];
      const tk = ic[label];
      if(this.textures.exists(tk)){
        const img=this.add.image(nx+390/8, 806, tk).setDisplaySize(20,20);
        img.setTint(isActive? C.accentN : unlocked? 0x9aa2ad : 0x46536a);
      }
      this.add.text(nx+390/8, 828, ru[label], { ...FONT_MONO, fontSize:'7px', color: isActive? C.accentS : unlocked? C.subS : '#46536A'}).setOrigin(0.5);
      if(!unlocked) this.add.text(nx+390/8+34, 798, '🔒', { fontSize:'7px', color:C.mutedS}).setOrigin(0.5);
      if(isActive) this.add.rectangle(nx,784,390/4,2, C.accentN).setOrigin(0);
    });
  }

  private createDebugEpochSwitcher(){
    // дев-переключатель для демо взросления
    this.add.rectangle(320, 74, 56, 18, this.COLORS.elevated).setStrokeStyle(1, this.COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      // +8 уровней
      gameState.progress.level = Math.min(85, gameState.progress.level+8);
      gameState.refreshEpoch();
      gameState.save();
      this.scene.restart();
    });
    this.add.text(348,83,'LVL+8', { ...FONT_MONO, fontSize:'7px', color:this.COLORS.subS}).setOrigin(0.5);
  }
}
