import Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { epochOf } from '../config/epochConfig';
import { iconKey } from '../engine/assetKeys';

const W = 390, H = 844;

// Первый вход — короткий онбординг, объясняет ядро без длинного туториала.
// ТЗ Часть 1 §2,10: форма — «33% терминал + 33% карточная игра + 33% Duolingo».
export class OnboardingScene extends Phaser.Scene {
  private step = 0;
  constructor(){ super({ key:'OnboardingScene' }); }

  create(){
    this.step = 0;
    this.cameras.main.setBackgroundColor(0x070B14);
    this.showStep();
  }

  private showStep(){
    this.children.removeAll(true);
    const ep = epochOf(1);
    this.add.rectangle(0, 0, W, H, 0x070B14).setOrigin(0);
    // бренд
    this.add.text(W/2, 60, 'SIGNAL ARENA', { fontFamily:'Inter, system-ui, sans-serif', fontSize:'26px', color:'#E9F2FF', fontStyle:'italic' }).setOrigin(0.5);
    this.add.text(W/2, 92, `${ep.name} · ПЕРВЫЙ ВХОД`, { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#31D6C4' }).setOrigin(0.5);

    if(this.step===0){
      this.add.text(W/2, 160, 'Игра, которая учит торговать крипту.\nНе терминал с XP. Не курс с картинками.', { fontFamily:'Inter, sans-serif', fontSize:'14px', color:'#93A3BC', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
      // три доли
      const tiles = [
        { t:'33%', s:'ТЕРМИНАЛ', icon:'nav-arena' },
        { t:'33%', s:'КАРТЫ', icon:'nav-collection' },
        { t:'33%', s:'DUOLINGO', icon:'nav-academy' },
      ];
      tiles.forEach((x,i)=>{
        const cx = 40 + i*115;
        this.add.rectangle(cx, 300, 100, 90, 0x0C1323).setStrokeStyle(1, 0x22304A).setOrigin(0);
        const k = iconKey(x.icon);
        if(this.textures.exists(k)) this.add.image(cx+50, 330, k).setTint(0x31D6C4).setScale(1.6);
        this.add.text(cx+50, 355, x.t, { fontFamily:'IBM Plex Mono, monospace', fontSize:'16px', color:'#E9F2FF' }).setOrigin(0.5);
        this.add.text(cx+50, 378, x.s, { fontFamily:'IBM Plex Mono, monospace', fontSize:'8px', color:'#62708A' }).setOrigin(0.5);
      });
      this.add.text(W/2, 430, 'Академия → теория и карты навыков.\nАрена → применяешь карты против врагов.', { fontFamily:'Inter, sans-serif', fontSize:'12px', color:'#93A3BC', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
    } else if(this.step===1){
      this.add.text(W/2, 160, 'Ты — трейдер. Враги — твои ошибки.', { fontFamily:'Inter, sans-serif', fontSize:'16px', color:'#E9F2FF', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
      const enemies=['E04','E05','E18'];
      enemies.forEach((e,i)=>{
        const k = `enemy_${e.replace('E','')}_avatar`;
        const cx = W/2 + (i-1)*120;
        this.add.circle(cx, 300, 44, 0x0C1323).setStrokeStyle(2, 0x22304A);
        if(this.textures.exists(k)) this.add.image(cx, 300, k).setDisplaySize(80,80).setAlpha(0.8);
      });
      this.add.text(W/2, 380, 'Новости врут. Проверяй каждый источник.\nОбъём решает. Стоп — до входа.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'11px', color:'#31D6C4', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
    } else {
      this.add.text(W/2, 160, 'Сессию не ограничивает энергия.\nТолько бюджет риска. Его нельзя купить.', { fontFamily:'Inter, sans-serif', fontSize:'14px', color:'#93A3BC', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
      // бюджет бары
      this.add.text(W/2, 250, 'БЮДЖЕТ РИСКА = 100', { fontFamily:'IBM Plex Mono, monospace', fontSize:'18px', color:'#3BDE8A' }).setOrigin(0.5);
      this.add.rectangle(W/2-140, 290, 280, 10, 0x060A12).setStrokeStyle(1, 0x22304A).setOrigin(0);
      this.add.rectangle(W/2-140, 290, 280, 10, 0x3BDE8A).setOrigin(0);
      this.add.text(W/2, 330, 'Ошибки списывают. Верные улики восстанавливают.\nНоль — событийная встреча с Левиафаном.', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#93A3BC', align:'center', wordWrap:{width:320} }).setOrigin(0.5,0);
    }

    // CTA
    const btn = this.step<2 ? 'ДАЛЕЕ' : 'НАЧАТЬ';
    this.add.rectangle(W/2-160, 620, 320, 48, 0x31D6C4).setOrigin(0).setInteractive().on('pointerdown', ()=>{
      if(this.step<2){ this.step++; this.showStep(); }
      else {
        gameState.setFlag('onboarding_done');
        this.scene.start('AcademyScene');
      }
    });
    this.add.text(W/2, 644, btn, { fontFamily:'Inter, system-ui, sans-serif', fontSize:'14px', color:'#03110f' }).setOrigin(0.5);
    this.add.text(W/2, 690, this.step<2 ? `${this.step+1}/3` : '3/3', { fontFamily:'IBM Plex Mono, monospace', fontSize:'10px', color:'#62708A' }).setOrigin(0.5);
    // скип
    const skip = this.add.text(W/2, 760, 'пропустить (демо)', { fontFamily:'IBM Plex Mono, monospace', fontSize:'11px', color:'#62708A' }).setOrigin(0.5).setInteractive();
    skip.on('pointerdown', ()=>{ gameState.setFlag('onboarding_done'); this.scene.start('AcademyScene'); });
  }
}
