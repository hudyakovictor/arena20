// SIGNAL ARENA — звук и вибрация (аудит AN3).
// Звуки синтезируются через WebAudio: не тянем бинарные ассеты в бандл,
// но интерфейс перестаёт быть немым. Всё выключается в настройках.

type SfxName = 'tap' | 'correct' | 'wrong' | 'reward' | 'epoch';

interface Prefs {
  sound: boolean;
  haptics: boolean;
}

const PREFS_KEY = 'arena_fx_prefs';

const prefs: Prefs = { sound: true, haptics: true };

let ctx: AudioContext | null = null;

/** Загружает настройки звука/вибрации из локального хранилища. */
export function initFx(): void {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) Object.assign(prefs, JSON.parse(raw) as Partial<Prefs>);
  } catch {
    /* хранилище недоступно — остаёмся на значениях по умолчанию */
  }
}

export function getFxPrefs(): Prefs {
  return { ...prefs };
}

export function setFxPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
  prefs[key] = value;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* игнорируем — звук всё равно переключится на эту сессию */
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Tone {
  freq: number;
  /** Длительность в секундах. */
  dur: number;
  type: OscillatorType;
  gain: number;
  /** Конечная частота для скольжения. */
  slideTo?: number;
}

const VOICES: Record<SfxName, Tone[]> = {
  tap: [{ freq: 660, dur: 0.04, type: 'sine', gain: 0.05 }],
  correct: [
    { freq: 660, dur: 0.09, type: 'sine', gain: 0.07 },
    { freq: 990, dur: 0.13, type: 'sine', gain: 0.07 },
  ],
  wrong: [{ freq: 220, dur: 0.22, type: 'sawtooth', gain: 0.05, slideTo: 130 }],
  reward: [
    { freq: 523, dur: 0.08, type: 'triangle', gain: 0.06 },
    { freq: 659, dur: 0.08, type: 'triangle', gain: 0.06 },
    { freq: 784, dur: 0.16, type: 'triangle', gain: 0.06 },
  ],
  epoch: [
    { freq: 196, dur: 0.3, type: 'sine', gain: 0.06, slideTo: 392 },
    { freq: 392, dur: 0.35, type: 'sine', gain: 0.05 },
  ],
};

/** Проигрывает короткий синтезированный звук. */
export function playSfx(name: SfxName): void {
  if (!prefs.sound) return;
  const ac = audio();
  if (!ac) return;
  let t = ac.currentTime;
  for (const tone of VOICES[name]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, t);
    if (tone.slideTo) osc.frequency.exponentialRampToValueAtTime(tone.slideTo, t + tone.dur);
    // мягкая огибающая, чтобы не щёлкало
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(tone.gain, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + tone.dur + 0.02);
    t += tone.dur * 0.8;
  }
}

type HapticKind = 'light' | 'success' | 'warn' | 'heavy';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  success: [12, 40, 18],
  warn: [24, 60, 24],
  heavy: 40,
};

/** Короткая вибрация, если устройство поддерживает. */
export function haptic(kind: HapticKind): void {
  if (!prefs.haptics) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* вибрация недоступна — тихо пропускаем */
  }
}
