// Signal Arena — реестр ключей ассетов-заглушек (SVG как база → Phaser растрирует в текстуру).
// Пути относительные к корню Vite (public/). Все ключи уникальны и предсказуемы.

export const ASSET_BASE = 'assets/render';

export function enemyRenderKey(id: string, stage: number): string {
  const n = id.replace('E', '');
  return `enemy_${n}_s${stage}`;
}
export function enemyRenderUrl(id: string, stage: number): string {
  const n = id.replace('E', '');
  return `${ASSET_BASE}/enemies/E${n}_s${stage}.svg`;
}
export function enemyIconKey(id: string): string {
  const n = id.replace('E', '');
  return `enemy_${n}_icon`;
}
export function enemyIconUrl(id: string): string {
  const n = id.replace('E', '');
  return `${ASSET_BASE}/enemies/E${n}_icon.svg`;
}
export function enemyAvatarKey(id: string): string {
  const n = id.replace('E', '');
  return `enemy_${n}_avatar`;
}
export function enemyAvatarUrl(id: string): string {
  const n = id.replace('E', '');
  return `${ASSET_BASE}/enemies/E${n}_avatar.svg`;
}
export function cardKey(id: string): string { return `card_${id}`; }
export function cardUrl(id: string): string { return `${ASSET_BASE}/cards/${id}.svg`; }
export function iconKey(id: string): string { return `icon_${id}`; }
export function iconUrl(id: string): string { return `${ASSET_BASE}/icons/${id}.svg`; }

// Список «всё, что нужно к арту/иконкам» — для меню и на карте (ТЗ про иконки).
// Условное (в меню) — иконки; на карте — иллюстрации даже если выглядят иконками.
export const MENU_ICONS = [
  { id:'nav-academy', key: iconKey('nav-academy'), url: iconUrl('nav-academy'), kind:'menu', label:'Академия' },
  { id:'nav-arena', key: iconKey('nav-arena'), url: iconUrl('nav-arena'), kind:'menu', label:'Арена' },
  { id:'nav-collection', key: iconKey('nav-collection'), url: iconUrl('nav-collection'), kind:'menu', label:'Коллекция' },
  { id:'nav-more', key: iconKey('nav-more'), url: iconUrl('nav-more'), kind:'menu', label:'Ещё' },
  { id:'dom-technical', key: iconKey('dom-technical'), url: iconUrl('dom-technical'), kind:'domain', label:'Тех анализ' },
  { id:'dom-risk', key: iconKey('dom-risk'), url: iconUrl('dom-risk'), kind:'domain', label:'Риск и исполнение' },
  { id:'dom-context', key: iconKey('dom-context'), url: iconUrl('dom-context'), kind:'domain', label:'Контекст рынка' },
  { id:'dom-crypto', key: iconKey('dom-crypto'), url: iconUrl('dom-crypto'), kind:'domain', label:'Крипто-специфика' },
  { id:'dom-human', key: iconKey('dom-human'), url: iconUrl('dom-human'), kind:'domain', label:'Человек' },
  { id:'dom-cognitive', key: iconKey('dom-cognitive'), url: iconUrl('dom-cognitive'), kind:'domain', label:'Когнитивные искажения' },
];

// Все ключи, которые нужно прогрузить в Boot/Preload
export function allPremadeKeys(): { key: string; url: string }[] {
  const out: { key: string; url: string }[] = [];
  // иконки меню/доменов
  for (const m of MENU_ICONS) out.push({ key: m.key, url: m.url });
  return out;
}
