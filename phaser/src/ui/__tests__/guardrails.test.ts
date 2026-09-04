// Регрессионные правила интерфейса.
// Эти тесты не дают вернуться проблемам, ради которых делался ремонт:
// нечитаемый кегль, внутренние метки спецификации в тексте, опечатки.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { FS, HIT } from '../tokens';
import { T } from '../copy';
import { palettes } from '../palette';

const SRC = join(__dirname, '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue;
      walk(full, out);
    } else if (name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(SRC);
const sources = files.map((f) => ({ path: relative(SRC, f), code: readFileSync(f, 'utf8') }));

describe('типографика', () => {
  it('минимальный кегль шкалы — 12px', () => {
    expect(FS.caption).toBeGreaterThanOrEqual(12);
    expect(Math.min(...Object.values(FS))).toBeGreaterThanOrEqual(12);
  });

  it('в коде нет инлайновых размеров шрифта меньше 12px', () => {
    const offenders: string[] = [];
    for (const { path, code } of sources) {
      const matches = code.matchAll(/fontSize:\s*['"`](\d+)px['"`]/g);
      for (const m of matches) {
        if (Number(m[1]) < 12) offenders.push(`${path}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('шкала возрастает без пропусков', () => {
    const sizes = [FS.caption, FS.body, FS.bodyLg, FS.title, FS.display];
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
    }
  });
});

describe('тач-зоны', () => {
  it('минимум соответствует рекомендациям платформ (44pt)', () => {
    expect(HIT.min).toBeGreaterThanOrEqual(44);
    expect(HIT.comfortable).toBeGreaterThanOrEqual(HIT.min);
  });
});

describe('тексты для игрока', () => {
  function collect(v: unknown, acc: string[] = []): string[] {
    if (typeof v === 'string') acc.push(v);
    else if (typeof v === 'function') {
      try {
        acc.push(String((v as (...a: unknown[]) => string)(1, 2)));
      } catch {
        /* функции с другой сигнатурой пропускаем */
      }
    } else if (v && typeof v === 'object') {
      for (const x of Object.values(v)) collect(x, acc);
    }
    return acc;
  }

  const strings = collect(T);

  it('словарь не пустой', () => {
    expect(strings.length).toBeGreaterThan(80);
  });

  it('нет внутренних меток механик M1–M15', () => {
    const bad = strings.filter((s) => /\bM\d{1,2}\b/.test(s));
    expect(bad).toEqual([]);
  });

  it('нет ссылок на техзадание и служебных терминов', () => {
    const banned = /ТЗ|Component Contract|seed|SEED|атом[ыа]?\s+C\d/;
    const bad = strings.filter((s) => banned.test(s));
    expect(bad).toEqual([]);
  });

  it('нет заглушек и следов правки', () => {
    const bad = strings.filter((s) => /TODO|FIXME|будет нижняя|заглушка|демо-списание/i.test(s));
    expect(bad).toEqual([]);
  });

  it('нет известных опечаток', () => {
    const bad = strings.filter((s) => /ПАМP|СБЫТИЕ/.test(s));
    expect(bad).toEqual([]);
  });

  it('строки не кричат капсом целиком', () => {
    const shouty = strings.filter(
      (s) => s.length > 12 && s === s.toUpperCase() && /[А-ЯЁ]/.test(s),
    );
    expect(shouty).toEqual([]);
  });
});

describe('код сцен', () => {
  it('дев-переключатель уровня удалён из продакшена', () => {
    const bad = sources.filter(({ code }) => /LVL\+8|createDebugEpochSwitcher/.test(code));
    expect(bad.map((b) => b.path)).toEqual([]);
  });

  it('в исходниках нет «as any»', () => {
    const offenders = sources
      .filter(({ code }) => /\bas any\b/.test(code))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it('экраны обновляются точечно, без scene.restart()', () => {
    const offenders = sources
      .filter(({ code }) => /this\.scene\.restart\(\)/.test(code))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it('внутренние метки механик не показываются через add.text', () => {
    const offenders: string[] = [];
    for (const { path, code } of sources) {
      const matches = code.matchAll(/['"`](M\d{1,2}[ :·—-][^'"`]*)['"`]/g);
      for (const m of matches) offenders.push(`${path}: ${m[1].slice(0, 40)}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('единый визуальный тон', () => {
  it('цвета эпох существуют только в palette.ts', () => {
    const cfg = sources.find((f) => f.path === 'config/epochConfig.ts');
    expect(cfg).toBeDefined();
    // второй набор токенов здесь был причиной «то один тон, то другой»
    expect(/tokens:\s*\{/.test(cfg!.code)).toBe(false);
    expect(/#[0-9a-fA-F]{6}/.test(cfg!.code.replace(/\/\/[^\n]*/g, ''))).toBe(false);
  });

  it('у каждой эпохи палитра задана полностью', () => {
    const ids = ['street', 'cabinet', 'terminal', 'system'];
    for (const id of ids) {
      const pal = palettes[id];
      expect(pal, id).toBeDefined();
      for (const [k, v] of Object.entries(pal)) {
        expect(v, `${id}.${k}`).not.toBeUndefined();
      }
    }
  });

  it('палитра не читается из scene.registry (источник — прогресс игрока)', () => {
    const offenders = sources
      .filter(({ code }) => /registry\.(get|set)\(\s*'epoch'/.test(code))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});

describe('иконки интерфейса', () => {
  it('SVG имеют белую базу для корректного Phaser tint', () => {
    const iconDir = join(SRC, '..', 'public', 'assets', 'render', 'icons');
    const icons = readdirSync(iconDir).filter((name) => name.endsWith('.svg'));
    expect(icons).toHaveLength(10);
    for (const name of icons) {
      const svg = readFileSync(join(iconDir, name), 'utf8');
      expect(svg, name).toContain('stroke="#ffffff"');
      expect(svg, name).not.toMatch(/#31D6C4|currentColor/);
    }
  });
});

describe('каркас не дублируется', () => {
  it('топбар и навигация заменяют предыдущий экземпляр', () => {
    const shell = sources.find((f) => f.path === 'ui/shell.ts')!;
    expect(shell.code).toMatch(/replaceChrome/);
  });

  it('фон не перерисовывается повторно', () => {
    const shell = sources.find((f) => f.path === 'ui/shell.ts')!;
    expect(shell.code).toMatch(/__arenaBg/);
  });

  it('Арена не сносит фон при пересборке', () => {
    const arena = sources.find((f) => f.path === 'scenes/ArenaScene.ts')!;
    expect(arena.code).not.toMatch(/children\.removeAll/);
  });
});

describe('нет утечек ввода', () => {
  it('ScrollList снимает все свои слушатели в destroy()', () => {
    const sl = sources.find((f) => f.path === 'ui/ScrollList.ts')!;
    const on = (sl.code.match(/scene\.input\.on\(/g) ?? []).length;
    const off = (sl.code.match(/input\.off\(/g) ?? []).length;
    expect(off).toBeGreaterThanOrEqual(on);
  });
});
