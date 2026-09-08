"""T016 · Генератор placeholder-звуков: короткие синтезированные WAV (22050Hz mono 16-bit).

Запуск: python3 scripts/gen-audio.py
Выход: client/public/assets/audio/{click,tab,decision,success,error,reveal}.wav
Финалка (мастеринг/SFX-дизайн) — отдельной задачей; файлы помечены placeholder.
"""

import math
import struct
import wave
from pathlib import Path

SR = 22050
OUT = Path(__file__).resolve().parent.parent / "client" / "public" / "assets" / "audio"


def tone(freq, dur, vol=0.5, slide_to=None, kind="sine"):
    n = int(SR * dur)
    out = []
    for i in range(n):
        k = i / max(n - 1, 1)
        f = freq + (slide_to - freq) * k if slide_to else freq
        phase = 2 * math.pi * f * i / SR
        v = math.sin(phase) if kind == "sine" else math.sin(phase) + 0.3 * math.sin(2 * phase)
        env = min(1.0, k * 12) * (1 - k) ** 1.6  # attack + decay
        out.append(v * vol * env)
    return out


def mix(*parts):
    n = max(len(p) for p in parts)
    buf = [0.0] * n
    for p in parts:
        for i, v in enumerate(p):
            buf[i] += v
    peak = max(abs(v) for v in buf) or 1.0
    return [v / peak * 0.9 for v in buf]


def seq(parts, gap=0.03):
    buf: list[float] = []
    gap_n = int(SR * gap)
    for p in parts:
        buf.extend(p)
        buf.extend([0.0] * gap_n)
    return buf


SOUNDS = {
    "click": tone(1200, 0.06, 0.5),
    "tab": tone(800, 0.08, 0.45, slide_to=1050),
    "decision": mix(tone(660, 0.2, 0.5), tone(880, 0.2, 0.35)),
    "success": seq([tone(523, 0.12), tone(659, 0.12), tone(784, 0.2)], gap=0.02),
    "error": mix(tone(180, 0.25, 0.6, kind="buzz"), tone(140, 0.25, 0.4, kind="buzz")),
    "reveal": mix(tone(200, 0.5, 0.5, slide_to=1200), tone(400, 0.5, 0.2, slide_to=2400)),
}

OUT.mkdir(parents=True, exist_ok=True)
for name, samples in SOUNDS.items():
    path = OUT / f"{name}.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = struct.pack(f"<{len(samples)}h", *(int(v * 32767) for v in samples))
        w.writeframes(frames)
    print(f"{name}.wav: {path.stat().st_size}B")
print("gen-audio: OK")
