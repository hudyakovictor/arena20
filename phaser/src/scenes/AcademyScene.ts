import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { cards } from '../data/cards';
import { epochOf } from '../config/epochConfig';

// Академия — теория, без врагов и без заданий Арены (ТЗ Часть 1 §4.3)
// Единственное допустимое присутствие врага — тизер-силуэт на обложке главы
const COLORS = { bg:0x070B14, surface:0x0C1323, elevated:0x111B2E, border:0x22304A, cyan:0x31D6C4, good:0x3BDE8A, bad:0xFF596D, muted:0x62708A, sub:0x93A3BC, text:0xE9F2FF, paper:0xE7DFD0 };

export class AcademyScene extends Phaser.Scene {
  constructor(){ super({ key:'AcademyScene'}); }
  create(): void {
    const p=gameState.progress;
    const ep=epochOf(p.level);
    this.cameras.main.setBackgroundColor(ep.tokens.bg as any);

    this.add.text(14,14,'Академия', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'22px', color:'#E9F2FF'});
    this.add.text(14,40,`КУРС 17 ГЛАВ · ${p.level>=78?'ВСЕ КАРТЫ ОТКРЫТЫ':'L${p.level} · '+ep.name}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#62708A'});
    this.add.text(14,52,'теория выдаёт карту → карта требуется для практики (ТЗ §3)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A'});

    // путь глав — вертикальный слайс (по макету academy-path.html)
    const startY=72;
    const visibleCards = cards; // 17
    // скролл — показываем 6-7 на экране, остальные уходят вниз (в прототипе — все)
    visibleCards.forEach((c,i)=>{
      const y=startY + i*62;
      if(y> 740) return;
      const unlocked = gameState.isCardUnlocked(c.id);
      const rank = p.cardRanks[c.id] ?? (unlocked?1:0);
      const isCurrent = unlocked && rank<3 && i=== visibleCards.findIndex(x=> gameState.isCardUnlocked(x.id) && (p.cardRanks[x.id]??0)<3);
      const col = !unlocked ? 0x22304A : rank>=2 ? 0x3BDE8A : 0x31D6C4;
      const bg = !unlocked ? 0x060A12 : isCurrent ? 0x14223A : 0x0C1323;
      // карточка главы
      this.add.rectangle(14,y,362,54, bg).setStrokeStyle(1, unlocked? col:0x22304A).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        if(!unlocked) { this.cameras.main.flash(80,255,89,109); return; }
        this.showLesson(c);
      });
      // иконка
      this.add.circle(38, y+27, 18, 0x060A12).setStrokeStyle(1, col);
      this.add.text(38, y+27, c.icon, { fontFamily:'Inter, sans-serif', fontSize:'13px', color: toHex(col)}).setOrigin(0.5);
      // текст
      this.add.text(64, y+12, `ГЛ.${c.cid} · ${c.name}`, { fontFamily:'Inter, sans-serif', fontSize:'12px', color: unlocked?'#E9F2FF':'#62708A'});
      const atomsDone = rank===0?0: rank===1?2: rank===2?4:6;
      this.add.text(64, y+28, `${atomsDone}/~6 атомов · ранг ${rank||1}/3 · ${unlocked?'':'откроется L'+c.unlockLevel}`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A'});
      // рамка ранга — без новых элементов интерфейса, только рамка (ТЗ §5.2)
      if(rank>=2) this.add.rectangle(14,y,362,54,0x000000,0).setStrokeStyle(2, rank>=3? 0xFFB341:0x3BDE8A).setOrigin(0);
      // тизер-силуэт врага (допустимое единственное присутствие)
      if(c.cid===1) this.add.text(330, y+20,'◐', { fontSize:'16px', color:'#B783FF'});
      if(c.cid===4) this.add.text(330, y+20,'◈', { fontSize:'16px', color:'#FFB341'});
      // прогресс атомов
      const barW=120;
      this.add.rectangle(64, y+42, barW, 3, 0x060A12).setStrokeStyle(1, 0x22304A).setOrigin(0);
      this.add.rectangle(64, y+42, Math.round(barW*(atomsDone/6)),3, col).setOrigin(0);
      // статус чип
      const status = !unlocked?'LOCKED': rank>=3?'MASTERED': isCurrent?'CURRENT':'AVAILABLE';
      this.add.text(300, y+8, status, { fontFamily:'IBM Plex Mono, monospace', fontSize:'6px', color: toHex(col), backgroundColor: unlocked?'rgba(49,214,196,0.10)':'rgba(98,112,138,0.12)'}).setOrigin(0);
    });

    // CTA
    this.add.rectangle(14,760,362,44, COLORS.cyan).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      // переход к текущему уроку — микро-проверка атома
      const cur = cards.find(c=> gameState.isCardUnlocked(c.id) && (p.cardRanks[c.id]??0)<3) ?? cards[0];
      this.showLesson(cur);
    });
    this.add.text(195,782,'Продолжить урок → Арена', { fontFamily:'Inter, sans-serif', fontSize:'13px', color:'#03110f'}).setOrigin(0.5);

    // нижняя навигация — взросление (ТЗ Часть 2)
    this.createBottomNav();
  }

  private showLesson(card: typeof cards[number]){
    // микро-проверка — не содержит врагов, источников, выбора торгового действия (ТЗ §4.2)
    const overlay=this.add.rectangle(0,0,390,844, 0x070B14, 0.94).setOrigin(0).setInteractive();
    this.add.text(195, 180, card.name, { fontFamily:'Inter, sans-serif', fontSize:'16px', color:'#E9F2FF'}).setOrigin(0.5);
    this.add.text(195, 200, `ГЛАВА ${card.cid} · КАРТА «${card.short}»`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#31D6C4'}).setOrigin(0.5);
    this.add.text(20, 230, 'АТОМ НАВЫКА — умение, а не термин:', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#93A3BC'});
    const atom = card.atoms[0];
    this.add.rectangle(20, 246, 350, 44, 0x0C1323).setStrokeStyle(1, COLORS.border).setOrigin(0);
    this.add.text(28, 256, atom.desc.toUpperCase(), { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#E7DFD0', wordWrap:{width:334}}).setOrigin(0);
    this.add.text(28, 278, `атом ${atom.id} — проверяется действием в Арене`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'7px', color:'#62708A'}).setOrigin(0);

    this.add.text(20, 310, 'МИКРО-ПРОВЕРКА (без врага и без награды Арены):', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#93A3BC'});
    this.add.rectangle(20, 326, 350, 54, COLORS.paper).setOrigin(0).setStrokeStyle(1, COLORS.cyan);
    this.add.text(28, 334, 'Что делает «длинная тень» свечи?', { fontFamily:'Inter, sans-serif', fontSize:'11px', color:'#1C1916', wordWrap:{width:334}}).setOrigin(0);
    const opts=[
      {t:'Сигнал направления — надо входить', ok:false},
      {t:'Неопределённость, а не сигнал', ok:true},
      {t:'Всегда разворот', ok:false},
    ];
    let picked: number|null=null;
    opts.forEach((o,i)=>{
      const y=386+i*42;
      const r=this.add.rectangle(20,y,350,36, 0x0C1323).setStrokeStyle(1, COLORS.border).setOrigin(0).setInteractive();
      const t=this.add.text(32,y+12, o.t, { fontFamily:'Inter, sans-serif', fontSize:'11px', color:'#E9F2FF'}).setOrigin(0);
      r.on('pointerdown', ()=>{
        picked=i;
        // подсветить
        opts.forEach((_,j)=>{
          // reset handled by overlay destroy cycle — просто перезапуск
        });
        if(o.ok){
          this.add.text(195, 520, '✓ атом освоен — карта ранга +1', { fontFamily:'IBM Plex Mono, monospace', fontSize:'9px', color:'#3BDE8A'}).setOrigin(0.5);
          const cur = gameState.progress.cardRanks[card.id] ?? (gameState.isCardUnlocked(card.id)?1:0);
          gameState.progress.cardRanks[card.id]= Math.min(3, cur+1);
          gameState.save();
          this.time.delayedCall(900, ()=>{
            overlay.destroy(); // close and stay
            this.scene.start('ArenaScene');
          });
        } else {
          this.add.text(195, 520, '✗ это декоративный атом — в Арене он не используется. Пробуй ещё.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#FF596D'}).setOrigin(0.5);
          this.cameras.main.shake(80,0.004);
        }
      });
    });
    this.add.text(195, 720, 'закрыть ✕', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#62708A'}).setOrigin(0.5).setInteractive().on('pointerdown', ()=> overlay.destroy());
  }

  private createBottomNav(){
    const items=[
      {label:'ACADEMY', active:true},
      {label:'ARENA', active:false, go:'ArenaScene'},
      {label:'COLLECTION', active:false, go:'CollectionScene'},
      {label:'MORE', active:false, go:'MoreScene'},
    ] as any[];
    items.forEach((it,i)=>{
      const nx=i*(390/4);
      this.add.rectangle(nx,784,390/4,60, COLORS.elevated).setStrokeStyle(1, COLORS.border).setOrigin(0).setInteractive().on('pointerdown', ()=>{
        if(it.go) this.scene.start(it.go);
      });
      this.add.text(nx+390/8,814, it.label, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color: it.active?'#31D6C4':'#62708A'}).setOrigin(0.5);
    });
  }
}
function toHex(n:number){ return '#'+n.toString(16).padStart(6,'0'); }
