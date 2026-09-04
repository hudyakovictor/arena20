import Phaser from 'phaser';
import type { GameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { iconKey } from './assetKeys';

// Общий скелет интерфейса: Топ-бар + нижняя навигация + эпоха-токены.
// Один набор компонентов, четыре набора токенов эпох (ТЗ Часть 2 §1).

const W = 390, H = 844;
const NAV_ITEMS = [
  { label:'ACADEMY', key:'AcademyScene', icon:'nav-academy' },
  { label:'ARENA', key:'ArenaScene', icon:'nav-arena' },
  { label:'COLLECTION', key:'CollectionScene', icon:'nav-collection' },
  { label:'MORE', key:'MoreScene', icon:'nav-more' },
];

function hex(n: number): string { return '#' + n.toString(16).padStart(6, '0'); }

export function renderTopBar(scene: Phaser.Scene, gs: GameState): void {
  const p = gs.progress;
  const ep = epochOf(p.level);
  const C = {
    bg: 0x111B2E, border: 0x22304A, inset: 0x060A12, surface: 0x0C1323,
    cyan: 0x31D6C4, good: 0x3BDE8A, bad: 0xFF596D, warn: 0xFFB341, muted: 0x62708A,
  };
  scene.add.rectangle(0, 0, W, 56, C.bg).setOrigin(0).setStrokeStyle(1, C.border);
  // уровень
  scene.add.circle(18, 28, 16, C.surface).setStrokeStyle(1, C.cyan);
  scene.add.text(18, 28, `L${p.level}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#31D6C4' }).setOrigin(0.5);
  scene.add.text(46, 13, `УР.${p.level} · ${ep.name}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color: ep.tokens.accent });
  scene.add.text(46, 24, `${p.xp} / ${p.xpMax} XP`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' });
  scene.add.rectangle(46, 36, 120, 4, C.inset).setStrokeStyle(1, C.border).setOrigin(0, 0.5);
  scene.add.rectangle(46, 36, Math.round(120 * (p.xp / p.xpMax)), 4, C.cyan).setOrigin(0, 0.5);
  // SIG
  scene.add.text(176, 28, `◉ ${p.coins}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'11px', color:'#93A3BC' });
  // бюджет риска M15
  const bW = 66, bX = 238, bPct = p.riskBudget / p.maxBudget;
  const bCol = p.riskBudget <= 20 ? C.bad : p.riskBudget <= 45 ? C.warn : C.good;
  scene.add.text(bX, 13, 'БЮДЖЕТ РИСКА', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A' });
  scene.add.rectangle(bX, 26, bW, 6, C.inset).setStrokeStyle(1, bCol).setOrigin(0, 0.5);
  scene.add.rectangle(bX, 26, Math.round(bW * bPct), 6, bCol).setOrigin(0, 0.5);
  scene.add.text(bX + bW + 6, 26, `${p.riskBudget}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color: hex(bCol) }).setOrigin(0, 0.5);
  // свиток M7 + погода M13 + эпоха
  scene.add.text(310, 13, `☰ ${p.errorScroll.filter(e=>!e.closed).length} свиток`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: p.errorScroll.filter(e=>!e.closed).length ? '#FFB341' : '#62708A' });
  scene.add.text(310, 24, `⚑ ${p.weather} · ×${p.streak}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#93A3BC' });
  scene.add.text(310, 34, `эпоха ${ep.id}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: ep.tokens.accent });
}

export function renderBottomNav(scene: Phaser.Scene, current: string, unlocked: string[]): void {
  const C = {
    bg: 0x111B2E, elevated: 0x111B2E, inset: 0x060A12, border: 0x22304A,
    cyan: 0x31D6C4, sub: 0x93A3BC, muted: 0x46536A,
  };
  const cell = W / 4;
  NAV_ITEMS.forEach((it, i) => {
    const nx = i * cell;
    const isActive = it.key === current;
    const isUnlocked = unlocked.includes(it.key);
    const bg = isUnlocked ? C.elevated : C.inset;
    scene.add.rectangle(nx, H - 60, cell, 60, bg).setStrokeStyle(1, C.border).setOrigin(0).setInteractive()
      .on('pointerdown', () => {
        if (!isUnlocked) { scene.cameras.main.flash(60, 255, 179, 65); return; }
        if (!isActive) scene.scene.start(it.key);
      });
    // иконка (24×24 текстура из иконки) + метка
    const cx = nx + cell / 2;
    const tex = scene.textures.exists(iconKey(it.icon)) ? iconKey(it.icon) : null;
    if (tex) scene.add.image(cx, H - 34, tex).setScale(1).setTint(isActive ? 0x31D6C4 : isUnlocked ? 0x93A3BC : 0x46536A);
    scene.add.text(cx, H - 16, it.label, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color: isActive ? '#31D6C4' : isUnlocked ? '#93A3BC' : '#46536A' }).setOrigin(0.5);
    if (!isUnlocked) scene.add.text(cx, H - 8, 'SOON', { fontFamily:'IBM Plex Mono, monospace', fontSize:'6px', color:'#62708A' }).setOrigin(0.5);
    if (isActive) scene.add.rectangle(nx, H - 60, cell, 2, C.cyan).setOrigin(0);
  });
}

// Навигация, доступная в данную эпоху (ось взросления, ТЗ Часть 2 §2)
export function navForEpoch(level: number): string[] {
  const ep = epochOf(level).id;
  if (ep === 'street') return ['AcademyScene', 'ArenaScene'];
  if (ep === 'cabinet') return ['AcademyScene', 'ArenaScene', 'CollectionScene'];
  if (ep === 'terminal') return ['AcademyScene', 'ArenaScene', 'CollectionScene', 'MoreScene'];
  return ['AcademyScene', 'ArenaScene', 'CollectionScene', 'MoreScene'];
}
