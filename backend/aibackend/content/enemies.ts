import type { Enemy } from '../types';

// SIGNAL ARENA — Полный ростер врагов (ТЗ Часть 4 §5).
// 33 врага, 6 доменов, стадии S1–S4, S3 всегда добавляет второй домен.
// Палитра/домены по Части 5 §2.3. Тизер-силуэт строим из мастера автоматически.
export const enemies: Enemy[] = [
  // ═══ ТЕХНИЧЕСКИЙ АНАЛИЗ ── холодный циан/фиолет, стекло/дым ═══
  { id:'E01', name:'Wick Mimic', domain:'technical', rankDanger:1, mode:'normal', stages:[
    {stage:1, level:1, requiredCards:[{cardId:'C1',rank:1}], sources:['chart'], factor:'длинная тень — неопределённость, а не сигнал', layers:'S1 базовый мастер'},
    {stage:2, level:6, requiredCards:[{cardId:'C1',rank:2},{cardId:'C2',rank:1}], sources:['chart'], factor:'объём почти выключен на свече', layers:'S2 lantern объёма'},
    {stage:3, level:18, requiredCards:[{cardId:'C1',rank:2},{cardId:'C5',rank:1}], sources:['chart','position'], factor:'FOMO на длинной тени', secondDomain:'human', comboRequired:['K01'], layers:'S3 pink rim'},
    {stage:4, level:45, requiredCards:[{cardId:'C1',rank:3},{cardId:'C2',rank:2},{cardId:'C16',rank:1}], sources:['chart'], factor:'перенос: другой режим рынка', layers:'S4 arena'},
  ]},
  { id:'E02', name:'Fake Breakout Phantom', domain:'technical', rankDanger:1, mode:'normal', stages:[
    {stage:1, level:5, requiredCards:[{cardId:'C2',rank:1}], sources:['chart'], factor:'пробой без объёма', layers:'S1 базовый'},
    {stage:2, level:10, requiredCards:[{cardId:'C2',rank:2},{cardId:'C3',rank:1}], sources:['chart'], factor:'индикатор «подтверждает» пробой', layers:'S2 bell-кривая маска'},
    {stage:3, level:24, requiredCards:[{cardId:'C2',rank:2},{cardId:'C6',rank:1}], sources:['chart','news'], factor:'новость как повод для пробоя', secondDomain:'context', layers:'S3 burning newspaper'},
    {stage:4, level:60, requiredCards:[{cardId:'C2',rank:2},{cardId:'C10',rank:2},{cardId:'C11',rank:1}], sources:['chart','orderbook','sentiment'], factor:'перенос: пробой на ликвидациях', comboRequired:['T05'], layers:'S4 hooks'},
  ]},
  { id:'E03', name:'Indicator Cult', domain:'technical', rankDanger:1, mode:'normal', stages:[
    {stage:1, level:9, requiredCards:[{cardId:'C3',rank:1}], sources:['chart'], factor:'RSI в тренде ≠ разворот', layers:'S1 базовый'},
    {stage:2, level:14, requiredCards:[{cardId:'C3',rank:2},{cardId:'C4',rank:1}], sources:['chart','position'], factor:'вход «по сигналу» без стопа', layers:'S2 many needles'},
    {stage:3, level:30, requiredCards:[{cardId:'C3',rank:2},{cardId:'C6',rank:2}], sources:['chart','news'], factor:'макро-контекст против индикатора', secondDomain:'context', comboRequired:['K02'], layers:'S3 storm'},
    {stage:4, level:70, requiredCards:[{cardId:'C3',rank:3},{cardId:'C14',rank:2},{cardId:'C17',rank:2}], sources:['chart','position'], factor:'переобученный набор параметров', comboRequired:['T06'], layers:'S4 mosaic ил'},
  ]},
  { id:'E07', name:'Meme Mirage', domain:'technical', rankDanger:1, mode:'normal', stages:[
    {stage:1, level:20, requiredCards:[{cardId:'C2',rank:1}], sources:['chart'], factor:'рост на пустом объёме (тизер)', layers:'S1 haze'},
    {stage:2, level:47, requiredCards:[{cardId:'C2',rank:2},{cardId:'C11',rank:1}], sources:['chart','sentiment'], factor:'соцобъём против торгового', layers:'S2 large swarm'},
    {stage:3, level:68, requiredCards:[{cardId:'C2',rank:2},{cardId:'C11',rank:2},{cardId:'C9',rank:1}], sources:['chart','sentiment','onchain'], factor:'ончейн: концентрация держателей', secondDomain:'crypto', layers:'S3 chain-links'},
  ]},

  // ═══ РИСК И ИСПОЛНЕНИЕ ── тёмно-бирюзовый/чёрный, латунь/вода ═══
  { id:'E04', name:'Leverage Goblin', domain:'risk', rankDanger:1, mode:'normal', stages:[
    {stage:1, level:13, requiredCards:[{cardId:'C4',rank:1}], sources:['chart','position'], factor:'размер при заданном стопе', layers:'S1 goblin+lever'},
    {stage:2, level:19, requiredCards:[{cardId:'C4',rank:2},{cardId:'C3',rank:2}], sources:['chart','position'], factor:'волатильность ×2 (ATR)', layers:'S2 storm cloud'},
    {stage:3, level:43, requiredCards:[{cardId:'C4',rank:2},{cardId:'C10',rank:2}], sources:['position','orderbook'], factor:'Kraken: ликвидация у очевидного стопа', secondDomain:'technical', comboRequired:['K04'], layers:'S3 kraken tentacle'},
    {stage:4, level:85, requiredCards:[{cardId:'C4',rank:3},{cardId:'C14',rank:2}], sources:['position','orderbook'], factor:'перенос: риск разорения', comboRequired:['T02'], layers:'S4 embers'},
  ]},
  { id:'E18', name:'Stop-Hunt Kraken', domain:'risk', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:42, requiredCards:[{cardId:'C2',rank:2},{cardId:'C10',rank:1}], sources:['chart','orderbook'], factor:'стопы под очевидным уровнем', layers:'S1 hooks'},
    {stage:2, level:49, requiredCards:[{cardId:'C2',rank:2},{cardId:'C10',rank:2},{cardId:'C4',rank:1}], sources:['chart','orderbook','position'], factor:'плечо как груз', layers:'S2 brass weights'},
    {stage:3, level:59, requiredCards:[{cardId:'C2',rank:2},{cardId:'C13',rank:1}], sources:['chart','orderbook'], factor:'исполнение: где ставить стоп по структуре', secondDomain:'risk', comboRequired:['K14'], layers:'S3 ruler'},
    {stage:4, level:87, requiredCards:[{cardId:'C2',rank:3},{cardId:'C10',rank:2},{cardId:'C14',rank:2}], sources:['chart','orderbook'], factor:'турнир, перенос', layers:'S4 boiling'},
  ]},
  { id:'E19', name:'Liquidity Hydra', domain:'risk', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:43, requiredCards:[{cardId:'C10',rank:1}], sources:['orderbook','chart'], factor:'карта ликвидаций', layers:'S1 many heads'},
    {stage:2, level:54, requiredCards:[{cardId:'C10',rank:2},{cardId:'C9',rank:1}], sources:['orderbook','onchain'], factor:'потоки перед каскадом', secondDomain:'context', layers:'S2 chain inflows'},
    {stage:3, level:73, requiredCards:[{cardId:'C10',rank:2},{cardId:'C15',rank:1}], sources:['orderbook','tokenomics'], factor:'депег/лендинг-ликвидации', secondDomain:'crypto', layers:'S3 melting coin'},
    {stage:4, level:93, requiredCards:[{cardId:'C10',rank:3},{cardId:'C4',rank:2},{cardId:'C14',rank:1}], sources:['orderbook','position'], factor:'турнир', comboRequired:['T02','K12'], layers:'S4 coliseum'},
  ]},
  { id:'E24', name:'Slippage Slime', domain:'risk', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:57, requiredCards:[{cardId:'C13',rank:1}], sources:['orderbook','position'], factor:'маркет в тонком стакане', layers:'S1 ledge slide'},
    {stage:2, level:65, requiredCards:[{cardId:'C13',rank:2},{cardId:'C10',rank:1}], sources:['orderbook','position','chart'], factor:'Kraken: стоп исполняется хуже', secondDomain:'risk', comboRequired:['K14'], layers:'S2 hook'},
    {stage:3, level:80, requiredCards:[{cardId:'C13',rank:2},{cardId:'C15',rank:1}], sources:['orderbook','wallet'], factor:'DeFi-своп: проскальзывание и MEV', secondDomain:'crypto', layers:'S3 circuit board'},
  ]},
  { id:'E31', name:'Drawdown Leviathan', domain:'risk', rankDanger:4, mode:'event', stages:[
    {stage:1, level:13, requiredCards:[{cardId:'C4',rank:1}], sources:['position'], factor:'конец бюджета риска — разбор структуры потерь (без трофея)', layers:'S1 spine'},
    {stage:2, level:75, requiredCards:[{cardId:'C4',rank:2},{cardId:'C14',rank:1}], sources:['position'], factor:'асимметрия просадки, серии', comboRequired:['K15'], layers:'S2 peaks'},
    {stage:3, level:90, requiredCards:[{cardId:'C4',rank:2},{cardId:'C14',rank:1},{cardId:'C16',rank:1}], sources:['position','chart'], factor:'просадка портфеля, кэш как позиция', secondDomain:'context', layers:'S3 pier lantern'},
    {stage:4, level:97, requiredCards:[{cardId:'C4',rank:3},{cardId:'C14',rank:2},{cardId:'C17',rank:1}], sources:['position'], factor:'босс', comboRequired:['T08'], layers:'S4 jaws'},
  ]},

  // ═══ КОНТЕКСТ РЫНКА ── серый камень/слоновая кость, золото ═══
  { id:'E08', name:'Headline Titan', domain:'context', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:22, requiredCards:[{cardId:'C6',rank:1},{cardId:'C2',rank:1}], sources:['chart','news'], factor:'реакция на новость у уровня', layers:'S1 newspaper stone'},
    {stage:2, level:29, requiredCards:[{cardId:'C6',rank:2},{cardId:'C2',rank:2}], sources:['chart','news'], factor:'фейк-новость / «продано на факте»', layers:'S2 peeling pages'},
    {stage:3, level:55, requiredCards:[{cardId:'C6',rank:2},{cardId:'C16',rank:1}], sources:['chart','news'], factor:'Correlation: новость по BTC, вопрос по альту', secondDomain:'context', comboRequired:['K17'], layers:'S3 silk threads'},
    {stage:4, level:82, requiredCards:[{cardId:'C6',rank:2},{cardId:'C17',rank:2}], sources:['news','position'], factor:'регуляторка против системы', comboRequired:['T01'], layers:'S4 gavel'},
  ]},
  { id:'E16', name:'Whale Syndicate', domain:'context', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:37, requiredCards:[{cardId:'C9',rank:1}], sources:['onchain','chart'], factor:'переводы на биржу', layers:'S1 whale tail'},
    {stage:2, level:45, requiredCards:[{cardId:'C9',rank:2},{cardId:'C2',rank:1}], sources:['onchain','chart'], factor:'уровень: продажа в сопротивление', layers:'S2 stone wall'},
    {stage:3, level:63, requiredCards:[{cardId:'C9',rank:2},{cardId:'C10',rank:2}], sources:['onchain','orderbook'], factor:'деривативы: OI против потока', secondDomain:'risk', comboRequired:['K11'], layers:'S3 pressure gauge'},
    {stage:4, level:86, requiredCards:[{cardId:'C9',rank:2},{cardId:'C6',rank:2},{cardId:'C16',rank:1}], sources:['onchain','news'], factor:'перенос: внутренние переводы биржи (ложный сигнал)', comboRequired:['T05'], layers:'S4 hollow cloak'},
  ]},
  { id:'E17', name:'Insider Syndicate', domain:'context', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:38, requiredCards:[{cardId:'C9',rank:1},{cardId:'C7',rank:1}], sources:['onchain','tokenomics'], factor:'покупки до анонса', layers:'S1 vault door'},
    {stage:2, level:50, requiredCards:[{cardId:'C9',rank:2},{cardId:'C7',rank:2}], sources:['onchain','tokenomics'], factor:'анлоки', layers:'S2 calendar torn'},
    {stage:3, level:71, requiredCards:[{cardId:'C9',rank:2},{cardId:'C15',rank:1}], sources:['onchain','tokenomics'], factor:'governance-голосование', secondDomain:'crypto', comboRequired:['K09'], layers:'S3 ballot cards'},
  ]},
  { id:'E25', name:'Correlation Spider', domain:'context', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:58, requiredCards:[{cardId:'C6',rank:2},{cardId:'C4',rank:2}], sources:['chart','news'], factor:'альт против BTC', layers:'S1 globe abdomen'},
    {stage:2, level:73, requiredCards:[{cardId:'C6',rank:2},{cardId:'C16',rank:1}], sources:['chart','news'], factor:'циклы: бета альтов', comboRequired:['K17'], layers:'S2 threads'},
    {stage:3, level:83, requiredCards:[{cardId:'C6',rank:3},{cardId:'C16',rank:1},{cardId:'C10',rank:1}], sources:['chart','news','orderbook'], factor:'макро-шок и каскад', secondDomain:'risk', layers:'S3 snapped threads'},
  ]},
  { id:'E30', name:'Cycle Ouroboros', domain:'context', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:73, requiredCards:[{cardId:'C16',rank:1}], sources:['chart'], factor:'фаза цикла', layers:'S1 serpent circle'},
    {stage:2, level:82, requiredCards:[{cardId:'C16',rank:2},{cardId:'C11',rank:2}], sources:['chart','sentiment'], factor:'нарратив «в этот раз иначе»', comboRequired:['K13'], layers:'S2 banner crowd'},
    {stage:3, level:94, requiredCards:[{cardId:'C16',rank:2},{cardId:'C4',rank:2},{cardId:'C14',rank:1}], sources:['chart','position'], factor:'аллокация и кэш', secondDomain:'risk', comboRequired:['T08'], layers:'S3 coin jar'},
  ]},

  // ═══ КРИПТО-СПЕЦИФИКА ── тёмный пурпур, кислотный зелёный ═══
  { id:'E11', name:'Unlock Titan', domain:'crypto', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:27, requiredCards:[{cardId:'C7',rank:1}], sources:['tokenomics'], factor:'анлок впереди', layers:'S1 padlock head'},
    {stage:2, level:35, requiredCards:[{cardId:'C7',rank:2},{cardId:'C9',rank:1}], sources:['tokenomics','onchain'], factor:'адреса инвесторов двигаются', secondDomain:'context', comboRequired:['K09'], layers:'S2 green chains'},
    {stage:3, level:64, requiredCards:[{cardId:'C7',rank:2},{cardId:'C10',rank:1}], sources:['tokenomics','orderbook'], factor:'деривативы: funding перед анлоком', secondDomain:'risk', layers:'S3 gauge'},
  ]},
  { id:'E12', name:'Token Parasite', domain:'crypto', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:28, requiredCards:[{cardId:'C7',rank:1}], sources:['tokenomics'], factor:'токен без спроса', layers:'S1 empty shell'},
    {stage:2, level:40, requiredCards:[{cardId:'C7',rank:2},{cardId:'C8',rank:1}], sources:['tokenomics','wallet'], factor:'права контракта', secondDomain:'crypto', comboRequired:['K10'], layers:'S2 key'},
    {stage:3, level:67, requiredCards:[{cardId:'C7',rank:2},{cardId:'C15',rank:1}], sources:['tokenomics'], factor:'эмиссия через «стейкинг»', secondDomain:'crypto', layers:'S3 eggs'},
  ]},
  { id:'E13', name:'Rug Pull Phantom', domain:'crypto', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:32, requiredCards:[{cardId:'C8',rank:1}], sources:['wallet','tokenomics'], factor:'незалоченная ликвидность', layers:'S1 carpet'},
    {stage:2, level:39, requiredCards:[{cardId:'C8',rank:2},{cardId:'C7',rank:1}], sources:['wallet','tokenomics'], factor:'распределение команды', secondDomain:'crypto', comboRequired:['K10'], layers:'S2 envelopes'},
    {stage:3, level:66, requiredCards:[{cardId:'C8',rank:2},{cardId:'C15',rank:1}], sources:['wallet','tokenomics'], factor:'мост/смарт-контрактный риск', secondDomain:'risk', layers:'S3 rope bridge'},
    {stage:4, level:84, requiredCards:[{cardId:'C8',rank:2},{cardId:'C11',rank:2},{cardId:'C9',rank:1}], sources:['wallet','sentiment','onchain'], factor:'перенос: рекламируемый «аудит»', comboRequired:['T04'], layers:'S4 audit badge'},
  ]},
  { id:'E14', name:'Honeypot Mimic', domain:'crypto', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:33, requiredCards:[{cardId:'C8',rank:1}], sources:['wallet'], factor:'невозможно продать', layers:'S1 chest teeth'},
    {stage:2, level:44, requiredCards:[{cardId:'C8',rank:2},{cardId:'C9',rank:1}], sources:['wallet','onchain'], factor:'ончейн: нет продаж у держателей', secondDomain:'context', layers:'S2 chain stuck honey'},
    {stage:3, level:69, requiredCards:[{cardId:'C8',rank:2},{cardId:'C11',rank:2}], sources:['wallet','sentiment'], factor:'нарратив «скоро листинг»', secondDomain:'human', layers:'S3 party flags'},
  ]},
  { id:'E15', name:'Approval Leech', domain:'crypto', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:34, requiredCards:[{cardId:'C8',rank:1}], sources:['wallet'], factor:'бесконечный апрув', layers:'S1 stamp mouth'},
    {stage:2, level:41, requiredCards:[{cardId:'C8',rank:2}], sources:['wallet','news'], factor:'фишинговый домен, «поддержка»', layers:'S2 fake doorway'},
    {stage:3, level:65, requiredCards:[{cardId:'C8',rank:2},{cardId:'C13',rank:1}], sources:['wallet','orderbook'], factor:'срочность: «успей до снятия стены»', secondDomain:'risk', layers:'S3 burning fuse'},
  ]},
  { id:'E28', name:'Yield Chimera', domain:'crypto', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:67, requiredCards:[{cardId:'C15',rank:1}], sources:['tokenomics','wallet'], factor:'APY и IL', layers:'S1 three heads'},
    {stage:2, level:75, requiredCards:[{cardId:'C15',rank:2},{cardId:'C7',rank:1}], sources:['tokenomics'], factor:'эмиссия наград', secondDomain:'crypto', comboRequired:['K16'], layers:'S2 paper coins'},
    {stage:3, level:86, requiredCards:[{cardId:'C15',rank:2},{cardId:'C4',rank:2}], sources:['tokenomics','wallet','position'], factor:'депег и ликвидация в лендинге', secondDomain:'risk', layers:'S3 melting wax'},
  ]},
  { id:'E29', name:'Governance Golem', domain:'crypto', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:68, requiredCards:[{cardId:'C15',rank:1},{cardId:'C7',rank:1}], sources:['tokenomics','wallet'], factor:'концентрация голосов', layers:'S1 ballot boxes'},
    {stage:2, level:78, requiredCards:[{cardId:'C15',rank:2},{cardId:'C9',rank:1}], sources:['tokenomics','onchain'], factor:'инсайдеры голосуют', secondDomain:'context', layers:'S2 shoulders riders'},
    {stage:3, level:88, requiredCards:[{cardId:'C15',rank:2},{cardId:'C9',rank:2},{cardId:'C6',rank:1}], sources:['tokenomics','onchain','news'], factor:'регуляторный контекст', secondDomain:'context', layers:'S3 gavel scroll'},
  ]},

  // ═══ ЧЕЛОВЕК ── холодный синий / горячий розово-оранжевый ═══
  { id:'E05', name:'FOMO Wraith', domain:'human', rankDanger:1, mode:'normal', stages:[
    {stage:1, level:17, requiredCards:[{cardId:'C5',rank:1},{cardId:'C1',rank:1}], sources:['chart','position'], factor:'вход после импульса', layers:'S1 sprint'},
    {stage:2, level:22, requiredCards:[{cardId:'C5',rank:2},{cardId:'C6',rank:1}], sources:['chart','news'], factor:'новость как триггер', layers:'S2 newspaper'},
    {stage:3, level:48, requiredCards:[{cardId:'C5',rank:2},{cardId:'C11',rank:2}], sources:['chart','sentiment'], factor:'Siren: нарратив', secondDomain:'cognitive', comboRequired:['K13'], layers:'S3 siren'},
    {stage:4, level:88, requiredCards:[{cardId:'C5',rank:3},{cardId:'C16',rank:1}], sources:['chart'], factor:'поздний цикл, все «уже купили»', layers:'S4 crowd leaving'},
  ]},
  { id:'E06', name:'Loss Aversion Wraith', domain:'human', rankDanger:1, mode:'normal', stages:[
    {stage:1, level:18, requiredCards:[{cardId:'C5',rank:1}], sources:['chart','position'], factor:'держать убыток, резать прибыль', layers:'S1 ember'},
    {stage:2, level:27, requiredCards:[{cardId:'C5',rank:2},{cardId:'C4',rank:2}], sources:['chart','position'], factor:'усреднение убытка', layers:'S2 second ember'},
    {stage:3, level:52, requiredCards:[{cardId:'C5',rank:2},{cardId:'C13',rank:1}], sources:['chart','position'], factor:'Paper-Hands: конфликт «держать по плану / резать»', secondDomain:'risk', comboRequired:['K01'], layers:'S3 poltergeist tug'},
    {stage:4, level:90, requiredCards:[{cardId:'C5',rank:3},{cardId:'C14',rank:2}], sources:['position'], factor:'sunk cost в цифрах', layers:'S4 frost tally'},
  ]},
  { id:'E09', name:'Revenge Wraith', domain:'human', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:23, requiredCards:[{cardId:'C5',rank:1},{cardId:'C4',rank:1}], sources:['chart','position'], factor:'рост размера после потери', layers:'S1 fists'},
    {stage:2, level:34, requiredCards:[{cardId:'C5',rank:2},{cardId:'C4',rank:2}], sources:['chart','position'], factor:'плечо', layers:'S2 lever'},
    {stage:3, level:58, requiredCards:[{cardId:'C5',rank:2},{cardId:'C12',rank:2}], sources:['position'], factor:'gambler’s fallacy: «после трёх убытков — прибыль»', secondDomain:'cognitive', comboRequired:['K05'], layers:'S3 dice'},
    {stage:4, level:91, requiredCards:[{cardId:'C5',rank:3},{cardId:'C12',rank:2},{cardId:'C17',rank:2}], sources:['position'], factor:'нарушение стоп-дня', comboRequired:['T03'], layers:'S4 stop-sign'},
  ]},
  { id:'E10', name:'Dopamine Imp', domain:'human', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:25, requiredCards:[{cardId:'C5',rank:1}], sources:['position'], factor:'сделки ради ощущения, частота как симптом', layers:'S1 slot machine'},
    {stage:2, level:38, requiredCards:[{cardId:'C5',rank:2}], sources:['chart','position'], factor:'recency: последняя сделка определяет следующую', layers:'S2 sticker'},
    {stage:3, level:62, requiredCards:[{cardId:'C5',rank:2},{cardId:'C12',rank:2}], sources:['position'], factor:'дисциплина: сессии, усталость', secondDomain:'human', comboRequired:['K06'], layers:'S3 hourglass'},
    {stage:4, level:89, requiredCards:[{cardId:'C5',rank:3},{cardId:'C12',rank:2},{cardId:'C17',rank:2}], sources:['position'], factor:'система против «интересных» сделок', comboRequired:['T03'], layers:'S4 rulebook'},
  ]},
  { id:'E20', name:'Narrative Siren', domain:'human', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:47, requiredCards:[{cardId:'C11',rank:1}], sources:['sentiment','chart'], factor:'цикл нарратива', layers:'S1 mist siren'},
    {stage:2, level:53, requiredCards:[{cardId:'C11',rank:2},{cardId:'C5',rank:1}], sources:['sentiment','chart'], factor:'FOMO', secondDomain:'human', comboRequired:['K13'], layers:'S2 pink glow'},
    {stage:3, level:74, requiredCards:[{cardId:'C11',rank:2},{cardId:'C16',rank:1}], sources:['sentiment','chart'], factor:'фаза цикла', secondDomain:'context', layers:'S3 cycle ring'},
  ]},
  { id:'E22', name:'Routine Rot', domain:'human', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:52, requiredCards:[{cardId:'C12',rank:1}], sources:['position'], factor:'пропуск чек-листа', layers:'S1 moss humanoid'},
    {stage:2, level:60, requiredCards:[{cardId:'C12',rank:2},{cardId:'C5',rank:2}], sources:['position'], factor:'Imp: сделки вне сессии', secondDomain:'human', comboRequired:['K06'], layers:'S2 pink imp'},
    {stage:3, level:79, requiredCards:[{cardId:'C12',rank:2},{cardId:'C17',rank:2}], sources:['position'], factor:'ревизия не проведена', secondDomain:'cognitive', layers:'S3 calendar disc'},
  ]},
  { id:'E23', name:'Paper-Hands Poltergeist', domain:'human', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:53, requiredCards:[{cardId:'C5',rank:2},{cardId:'C12',rank:1}], sources:['chart','position'], factor:'выход раньше плана', layers:'S1 paper figure'},
    {stage:2, level:61, requiredCards:[{cardId:'C5',rank:2},{cardId:'C4',rank:2},{cardId:'C13',rank:1}], sources:['chart','position'], factor:'стоп в безубыток «слишком рано»', comboRequired:['K14'], layers:'S2 brass lock'},
    {stage:3, level:77, requiredCards:[{cardId:'C5',rank:2},{cardId:'C14',rank:2}], sources:['position'], factor:'математика: R:R системы ломается ранним выходом', secondDomain:'cognitive', layers:'S3 balance scale'},
  ]},

  // ═══ КОГНИТИВНЫЕ ИСКАЖЕНИЯ ── бронза/песок/обсидиан ═══
  { id:'E21', name:'Confirmation Bias Cult', domain:'cognitive', rankDanger:2, mode:'normal', stages:[
    {stage:1, level:49, requiredCards:[{cardId:'C5',rank:2},{cardId:'C11',rank:1}], sources:['sentiment','news'], factor:'подбор источников под вывод', layers:'S1 mirror circle'},
    {stage:2, level:57, requiredCards:[{cardId:'C5',rank:2},{cardId:'C3',rank:2}], sources:['chart','sentiment'], factor:'индикаторы «подтверждают»', comboRequired:['K08'], layers:'S2 gauges'},
    {stage:3, level:76, requiredCards:[{cardId:'C5',rank:3},{cardId:'C17',rank:2}], sources:['position','chart'], factor:'игнорирование сигналов выхода', secondDomain:'human', layers:'S3 scraped tablet'},
    {stage:4, level:92, requiredCards:[{cardId:'C5',rank:3},{cardId:'C14',rank:2},{cardId:'C17',rank:2}], sources:['position'], factor:'статистика, подобранная под систему', comboRequired:['T06'], layers:'S4 balance scales'},
  ]},
  { id:'E26', name:'Expectancy Sphinx', domain:'cognitive', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:62, requiredCards:[{cardId:'C14',rank:1},{cardId:'C4',rank:1}], sources:['position'], factor:'винрейт против R:R', layers:'S1 sphinx dice'},
    {stage:2, level:70, requiredCards:[{cardId:'C14',rank:2},{cardId:'C5',rank:2}], sources:['position'], factor:'психология: серии и уверенность', comboRequired:['K15'], layers:'S2 footprints'},
    {stage:3, level:81, requiredCards:[{cardId:'C14',rank:2},{cardId:'C17',rank:2}], sources:['position'], factor:'«идеальный бэктест»', secondDomain:'cognitive', layers:'S3 mirror tablet'},
  ]},
  { id:'E27', name:'Anchor Golem', domain:'cognitive', rankDanger:3, mode:'normal', stages:[
    {stage:1, level:63, requiredCards:[{cardId:'C14',rank:1},{cardId:'C5',rank:1}], sources:['chart','position'], factor:'якорь на цену входа', layers:'S1 anchor golem'},
    {stage:2, level:72, requiredCards:[{cardId:'C14',rank:2}], sources:['position'], factor:'sunk cost', layers:'S2 sand hands'},
    {stage:3, level:85, requiredCards:[{cardId:'C14',rank:2},{cardId:'C16',rank:1}], sources:['chart','position'], factor:'якорь на ATH в новом цикле', secondDomain:'context', layers:'S3 gold crown'},
  ]},
  { id:'E32', name:'Hubris Dragon', domain:'human', rankDanger:4, mode:'event', stages:[
    {stage:1, level:20, requiredCards:[{cardId:'C5',rank:1}], sources:['position'], factor:'серия побед + систематическая переоценка (без трофея)', layers:'S1 dragon eye'},
    {stage:2, level:80, requiredCards:[{cardId:'C5',rank:2},{cardId:'C14',rank:2}], sources:['position'], factor:'hindsight, «я знал»', layers:'S2 mirror shield'},
    {stage:3, level:92, requiredCards:[{cardId:'C5',rank:3},{cardId:'C17',rank:2}], sources:['position'], factor:'система переписана после удачной серии', secondDomain:'cognitive', layers:'S3 rewritten scroll'},
    {stage:4, level:98, requiredCards:[{cardId:'C5',rank:3},{cardId:'C14',rank:2},{cardId:'C17',rank:2}], sources:['position'], factor:'босс', layers:'S4 collapse'},
  ]},
  { id:'E33', name:'System Breaker', domain:'cognitive', rankDanger:4, mode:'boss', stages:[
    {stage:1, level:81, requiredCards:[{cardId:'C17',rank:1}], sources:['position','chart'], factor:'отклонение «по ситуации»', layers:'S1 crack'},
    {stage:2, level:89, requiredCards:[{cardId:'C17',rank:2},{cardId:'C14',rank:1}], sources:['position'], factor:'переобучение и малая выборка', layers:'S2 sand-castle'},
    {stage:3, level:95, requiredCards:[{cardId:'C17',rank:2},{cardId:'C5',rank:2},{cardId:'C12',rank:2}], sources:['position'], factor:'конфликт трёх искажений', secondDomain:'human', layers:'S3 three masks'},
    {stage:4, level:99, requiredCards:[{cardId:'C17',rank:3}], sources:['chart'], factor:'финальный босс: любые 5 комбо, мин. 2 тройки', comboRequired:['T01','T02','T03','T04','T05'], layers:'S4 arena all trophies'},
  ]},
];

export const enemyById = Object.fromEntries(enemies.map(e=>[e.id,e])) as Record<string,Enemy>;
export function stageOf(enemyId:string, stageNum:number){ const e=enemyById[enemyId]; return e?.stages.find(s=>s.stage===stageNum); }
export const enemiesByDomain: Record<string, Enemy[]> = enemies.reduce<Record<string, Enemy[]>>((acc,e)=>{ (acc[e.domain] ??= []).push(e); return acc; },{});

// Проверка покрытия: каждая карта минимум двумя врагами (ТЗ Часть 4 §8)
export const cardsLastTwo = (): string[] => {
  const use = new Set<string>();
  for(const e of enemies) for(const s of e.stages) for(const r of s.requiredCards) use.add(r.cardId);
  return [...use];
};
