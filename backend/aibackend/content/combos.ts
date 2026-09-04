import type { ComboDef } from '../types';

// SIGNAL ARENA — Реестр комбо (ТЗ Часть 4 §6)
// Комбо открывается при N верных совместных применениях карт ранга ≥2 с верными уликами.
// Требуются финальными стадиями S3–S4. Двойки (17) + тройки (8).
export const combos: ComboDef[] = [
  // ── Двойки (K01–K17) ──
  { id:'K01', cards:['C1','C2'], name:'Подтверждённая свеча', requiredStage:'E01 S3' },
  { id:'K02', cards:['C2','C3'], name:'Уровень раньше индикатора', requiredStage:'E03 S3' },
  { id:'K03', cards:['C2','C4'], name:'Стоп по структуре', requiredStage:'E18 S3' },
  { id:'K04', cards:['C3','C4'], name:'Размер от волатильности', requiredStage:'E04 S3' },
  { id:'K05', cards:['C4','C5'], name:'Хладнокровный размер', requiredStage:'E09 S3' },
  { id:'K06', cards:['C5','C12'], name:'Пауза по правилу', requiredStage:'E10 S3' },
  { id:'K07', cards:['C6','C2'], name:'Новость у уровня', requiredStage:'E08 S3' },
  { id:'K08', cards:['C6','C11'], name:'Факт и толпа', requiredStage:'E21 S2' },
  { id:'K09', cards:['C7','C9'], name:'Анлок на цепи', requiredStage:'E11 S2' },
  { id:'K10', cards:['C8','C7'], name:'Контракт и владелец', requiredStage:'E13 S2' },
  { id:'K11', cards:['C9','C10'], name:'Поток и интерес', requiredStage:'E16 S3' },
  { id:'K12', cards:['C10','C4'], name:'Плечо против ликвидаций', requiredStage:'E19 S4' },
  { id:'K13', cards:['C11','C5'], name:'Нарратив и жадность', requiredStage:'E20 S2' },
  { id:'K14', cards:['C13','C4'], name:'Стоп, который исполнится', requiredStage:'E24 S2' },
  { id:'K15', cards:['C14','C4'], name:'Риск в цифрах', requiredStage:'E31 S2' },
  { id:'K16', cards:['C15','C7'], name:'Доходность и эмиссия', requiredStage:'E28 S2' },
  { id:'K17', cards:['C16','C6'], name:'Цикл и макро', requiredStage:'E25 S2' },
  // ── Тройки (T01–T08) ──
  { id:'T01', cards:['C2','C6','C16'], name:'Контекст трёх слоёв', requiredStage:'E08 S4' },
  { id:'T02', cards:['C4','C10','C14'], name:'Выживание на деривативах', requiredStage:'E04 S4' },
  { id:'T03', cards:['C5','C12','C17'], name:'Дисциплина системы', requiredStage:'E09 S4' },
  { id:'T04', cards:['C8','C9','C11'], name:'Скам под нарративом', requiredStage:'E13 S4' },
  { id:'T05', cards:['C9','C6','C16'], name:'Кит, новость, цикл', requiredStage:'E16 S4' },
  { id:'T06', cards:['C14','C17','C5'], name:'Честная статистика', requiredStage:'E21 S4' },
  { id:'T07', cards:['C15','C4','C7'], name:'DeFi без иллюзий', requiredStage:'E28 S3' },
  { id:'T08', cards:['C16','C4','C14'], name:'Портфель через просадку', requiredStage:'E30 S3' },
];

export const comboById = Object.fromEntries(combos.map(c=>[c.id,c])) as Record<string,ComboDef>;

// System Breaker (E33) S4 требует любых 5 комбо из реестра, включая минимум 2 тройки
export const systemBreakerRequirement = { any: 5, triplesMin: 2 };
