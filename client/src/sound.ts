// T016-минимум · Phaser Sound: короткие синтезированные blip'ы + mute.
// Аудиофайлы генерируются scripts/gen-audio.py (wav, 22050Hz mono).
import type Phaser from 'phaser';
import { selectSettings } from './store.js';

export type SoundKey = 'click' | 'tab' | 'decision' | 'success' | 'error' | 'reveal';

export const SOUND_FILES: Record<SoundKey, string> = {
  click: 'assets/audio/click.wav',
  tab: 'assets/audio/tab.wav',
  decision: 'assets/audio/decision.wav',
  success: 'assets/audio/success.wav',
  error: 'assets/audio/error.wav',
  reveal: 'assets/audio/reveal.wav',
};

const VOLUMES: Record<SoundKey, number> = {
  click: 0.5,
  tab: 0.4,
  decision: 0.7,
  success: 0.8,
  error: 0.6,
  reveal: 0.9,
};

export function playSound(scene: Phaser.Scene, key: SoundKey): void {
  if (!selectSettings().sound) return;
  if (!scene.sound) return;
  try {
    scene.sound.play(key, { volume: VOLUMES[key] });
  } catch {
    // звук необязателен: сцена продолжает работать без него
  }
}
