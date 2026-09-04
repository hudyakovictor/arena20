import type { SourceDef } from '../types';
export const sources: SourceDef[] = [
  { id: 'chart', name: 'ГРАФИК', short: 'CHART', icon: '▥', appearsWithCard: 'C1' },
  { id: 'news', name: 'НОВОСТИ', short: 'NEWS', icon: '▤', appearsWithCard: 'C6' },
  { id: 'position', name: 'ПОЗИЦИЯ', short: 'POS', icon: '◈', appearsWithCard: 'C4' },
  { id: 'wallet', name: 'КОШЕЛЁК', short: 'WALLET', icon: '⬡', appearsWithCard: 'C8' },
  { id: 'tokenomics', name: 'ТОКЕНОМИКА', short: 'TOKEN', icon: '⬢', appearsWithCard: 'C7' },
  { id: 'onchain', name: 'ОНЧЕЙН', short: 'ONCHAIN', icon: '≋', appearsWithCard: 'C9' },
  { id: 'orderbook', name: 'СТАКАН', short: 'BOOK', icon: '▦', appearsWithCard: 'C10' },
  { id: 'sentiment', name: 'СЕНТИМЕНТ', short: 'SENT', icon: '◐', appearsWithCard: 'C11' },
];

export const sourceById = Object.fromEntries(sources.map(s=>[s.id,s])) as Record<string,SourceDef>;
