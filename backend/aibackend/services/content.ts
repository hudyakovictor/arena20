// content — пакет контента: код (v1) + опубликованные шаблоны из ИИ-конвейера; версия = hash пакета
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contentPackages, templateDrafts } from '../db/schema';
import { cards } from '../content/cards';
import { enemies } from '../content/enemies';
import { combos } from '../content/combos';
import { sources } from '../content/sources';
import { templates as baseTemplates, synthTemplate } from '../content/templates';
import { epochs } from '../config/epochConfig';
import { TemplateSchema } from '../schemas';
import type { EncounterTemplate } from '../types';

export interface ContentPackage {
  version: string;
  publishedAt: string;
  cards: typeof cards;
  enemies: typeof enemies;
  combos: typeof combos;
  sources: typeof sources;
  templates: EncounterTemplate[];
  epochs: typeof epochs;
}

let cache: { pkg: ContentPackage; at: number } | null = null;
const TTL = 30_000;

async function publishedTemplates(): Promise<EncounterTemplate[]> {
  try {
    const rows = await db.select().from(templateDrafts).where(eq(templateDrafts.status, 'published'));
    return rows.map(r => TemplateSchema.safeParse(r.template)).filter(p => p.success).map(p => p.data as EncounterTemplate);
  } catch { return []; }
}

export async function getContentPackage(): Promise<ContentPackage> {
  if (cache && Date.now() - cache.at < TTL) return cache.pkg;
  const extra = await publishedTemplates();
  const byId = new Map<string, EncounterTemplate>();
  for (const t of baseTemplates) byId.set(t.id, t);
  for (const t of extra) byId.set(t.id, t); // опубликованный шаблон переопределяет базовый с тем же id
  const templates = [...byId.values()];
  const body = JSON.stringify({ cards, enemies, combos, sources, templates });
  const version = 'c' + createHash('sha1').update(body).digest('hex').slice(0, 10);
  const pkg: ContentPackage = { version, publishedAt: new Date().toISOString(), cards, enemies, combos, sources, templates, epochs };
  cache = { pkg, at: Date.now() };
  // Регистрируем версию пакета (для валидации старых попыток той же версией)
  try {
    await db.insert(contentPackages).values({ version, json: { templateIds: templates.map(t => t.id), extra: extra }, active: true }).onConflictDoNothing();
  } catch { /* таблица может быть ещё не создана */ }
  return pkg;
}

export function invalidateContentCache() { cache = null; }

/** Шаблон по id с учётом пакета; синтез для любой пары враг/стадия (SYN-Exx-Sn). */
export async function resolveTemplate(templateId: string): Promise<EncounterTemplate | null> {
  const pkg = await getContentPackage();
  const found = pkg.templates.find(t => t.id === templateId);
  if (found) return found;
  const m = /^SYN-(E\d{2})-S(\d)$/.exec(templateId);
  if (m) return synthTemplate(m[1], Number(m[2]));
  return null;
}

/** Публичная форма пакета: без верных вариантов и без пометок улик. */
export function publicPackage(pkg: ContentPackage) {
  return {
    version: pkg.version,
    publishedAt: pkg.publishedAt,
    cards: pkg.cards,
    enemies: pkg.enemies.map(e => ({ ...e, stages: e.stages.map(s => ({ ...s, layers: undefined })) })),
    combos: pkg.combos,
    sources: pkg.sources,
    epochs: pkg.epochs,
    templates: pkg.templates.map(t => ({
      id: t.id, learningGoal: t.learningGoal, atoms: t.atoms, enemyId: t.enemyId, stage: t.stage, sources: t.sources,
      skills: t.skills, domain: t.domain, hasVerdict: !!t.verdict,
    })),
    stats: { cards: pkg.cards.length, enemies: pkg.enemies.length, combos: pkg.combos.length, templates: pkg.templates.length, atoms: pkg.cards.reduce((a, c) => a + c.atoms.length, 0) },
  };
}
