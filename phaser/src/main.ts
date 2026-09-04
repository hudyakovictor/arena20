import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';

console.log('[main] Phaser version', (Phaser as any).VERSION, 'starting...', gameConfig);

let game: Phaser.Game;
try {
  game = new Phaser.Game(gameConfig);
  console.log('[main] Game created', game);
  game.events.on('ready', () => console.log('[main] Game ready, canvas:', document.querySelector('#game canvas')));
  (window as any).game = game;
} catch (e:any) {
  console.error('[main] Failed to create game', e);
  const dbg = document.getElementById('debug');
  if (dbg) {
    dbg.style.display='block';
    dbg.textContent += '\n[main] FATAL: ' + (e?.message||e) + '\n' + (e?.stack||'');
  }
  // create fallback game with minimal scene to show error
  const fallbackConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 390,
    height: 844,
    backgroundColor: '#ff0000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: {
      create() {
        this.add.text(195, 400, 'FATAL: ' + (e?.message||e), { fontSize: '14px', color: '#ffffff', wordWrap: { width: 340 } }).setOrigin(0.5);
      }
    } as any
  };
  game = new Phaser.Game(fallbackConfig);
}
export default game;

