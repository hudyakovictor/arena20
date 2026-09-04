#!/usr/bin/env node
// Signal Arena — генератор ЗАГЛУШОК-РЕНДЕРОВ (SVG как база → Phaser растрирует в текстуру).
// Стиль: гибрид «10% fight / 30% finance analysis / 30% flat 3D»:
//   - финансовая основа: свечи/объём/линия тренда на фоне;
//   - fight-сущность: процедурный силуэт врага (домен-палитра, хэш id);
//   - flat-3D: изометрический плинтус и слои-«срезы».
// Per-stage: S2 = кольцо-«слой», S3 = акцент второго домена, S4 = арена-пол.
// Никаких читаемых цифр/стрелок/тикеров (ТЗ Часть 5 §7 нераскрытие).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'assets', 'render');
const TMP = path.join(__dirname, '..', 'public', 'assets');

// ── палитра доменов (Часть 5 §2.3) ──
const DOMAIN = {
  technical:{ base:['#0E2233','#12203A'], accent:'#50C8FF', accent2:'#31D6C4', glow:'#7FE0FF' },
  risk:{ base:['#0B1F24','#101A1E'], accent:'#FF5C70', accent2:'#FFB341', glow:'#FF8A67' },
  context:{ base:['#1B1A18','#23201C'], accent:'#F4B84B', accent2:'#E0C285', glow:'#FFF0C2' },
  crypto:{ base:['#170F28','#1E1233'], accent:'#B783FF', accent2:'#8CFF57', glow:'#D3A8FF' },
  human:{ base:['#1A1226','#221628'], accent:'#FF77BD', accent2:'#FFB341', glow:'#FF9AD1' },
  cognitive:{ base:['#1F1A14','#2A241C'], accent:'#9CA8FF', accent2:'#F0C060', glow:'#C7CDFF' },
};
const RANK_LABEL = { 1:'I', 2:'II', 3:'III', 4:'IV' };

// хэш — детерминированный выбор форм
function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function rng(seed){ let s=(seed>>>0)||1; return ()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; s=(s>>>0); return (s>>>0)/4294967296; }; }
function pick(r, arr){ return arr[Math.floor(r()*arr.length)]; }

function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

// ── генерация врага ──
function enemySVG(e, stage){
  const d = DOMAIN[e.domain];
  const r = rng(hash(e.id + '_' + stage));
  const W=512, H=512, cx=256;
  const g = [];

  // фон-виньетка
  g.push(`<defs>`);
  g.push(`<radialGradient id="bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stop-color="${d.base[0]}"/><stop offset="100%" stop-color="${d.base[1]}"/></radialGradient>`);
  g.push(`<linearGradient id="floor" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${d.accent}" stop-opacity="0.18"/><stop offset="100%" stop-color="${d.accent2}" stop-opacity="0.05"/></linearGradient>`);
  g.push(`<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${d.glow}" stop-opacity="0.5"/><stop offset="100%" stop-color="${d.glow}" stop-opacity="0"/></radialGradient>`);
  g.push(`</defs>`);
  g.push(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`);

  // финансовая основа: сетка свечей + линия тренда + объём (лёгкая, 0.12–0.25 непрозрачность)
  const bars=[];
  for(let i=0;i<8;i++){ const x=40+i*58; const h=40+Math.floor(r()*70); const up=r()>0.45; bars.push(`<rect x="${x}" y="${430-h}" width="16" height="${h}" fill="${up?d.accent:d.accent2}" opacity="0.16"/>`); }
  bars.push(`<polyline points="40,410 120,392 200,402 280,352 360,372 440,332" fill="none" stroke="${d.accent}" stroke-width="3" opacity="0.3"/>`);
  bars.push(`<rect x="40" y="430" width="432" height="2" fill="${d.accent}" opacity="0.3"/>`);
  g.push(bars.join(''));

  // flat-3D плинтус (изометрический срез)
  const py=430;
  g.push(`<path d="M${cx-150} ${py+10} L${cx-60} ${py+44} L${cx+150} ${py+44} L${cx+60} ${py+10} Z" fill="url(#floor)" stroke="${d.accent}" stroke-opacity="0.4" stroke-width="2"/>`);

  // существо (fight): силуэт из соединённых многоугольников, позиция по хэшу
  const bodyParts=[];
  const n=3+Math.floor(r()*3);
  let seedShape = pick(r,['blob','spike','tower','wing','arc','ring']);
  bodyParts.push(`<circle cx="${cx}" cy="300" r="34" fill="${d.accent}" opacity="0.9"/>`);
  for(let i=0;i<n;i++){
    const px=cx+(r()*160-80), py=170+r()*180, rr=14+r()*26, op=0.5+r()*0.4;
    bodyParts.push(`<circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="${rr.toFixed(0)}" fill="${i%2?d.accent2:d.accent}" opacity="${op.toFixed(2)}"/>`);
  }
  // «голова» + глаза
  const hy=200+r()*40;
  bodyParts.push(`<circle cx="${cx}" cy="${hy}" r="30" fill="${d.base[1]}" stroke="${d.accent}" stroke-width="3"/>`);
  bodyParts.push(`<circle cx="${cx-11}" cy="${hy}" r="5" fill="${d.glow}"/><circle cx="${cx+11}" cy="${hy}" r="5" fill="${d.glow}"/>`);
  // вытянутые «рога/щупальца»
  const horns = 3+Math.floor(r()*3);
  for(let i=0;i<horns;i++){
    const sx=cx+(i-(horns-1)/2)*34;
    const len=Math.round(40+r()*60);
    const dx=Math.round(r()*30-15);
    bodyParts.push(`<line x1="${sx}" y1="${Math.round(hy+26)}" x2="${sx+dx}" y2="${Math.round(hy+26+len)}" stroke="${d.accent}" stroke-width="4" stroke-linecap="round"/>`);
  }
  g.push(bodyParts.join(''));
  // тизер: силуэт залит тёмным + 5–8% rim (ТЗ Часть 5 §4)
  g.push(`<circle cx="${cx}" cy="${hy}" r="30" fill="#05070D" opacity="0.55"/>`);

  // stage-модификаторы
  if(stage>=2){
    g.push(`<circle cx="${cx}" cy="300" r="118" fill="none" stroke="${d.accent2}" stroke-width="2" stroke-dasharray="6 8" opacity="0.35"/>`);
  }
  if(stage>=3){
    // акцент второго домена — рим-свет с одной стороны
    const s2=Object.keys(DOMAIN).find(k=>k!==e.domain)||'cognitive';
    g.push(`<path d="M${cx-150} 180 L${cx+170} 130 L${cx+170} 470 L${cx-150} 470 Z" fill="${DOMAIN[s2].accent}" opacity="0.10"/>`);
  }
  if(stage>=4){
    g.push(`<path d="M40 470 L472 470 L452 486 L60 486 Z" fill="${d.accent}" opacity="0.16"/>`);
  }

  // glow (после тела)
  g.push(`<circle cx="${cx}" cy="310" r="120" fill="url(#glow)" opacity="0.28"/>`);

  // ранг-бейдж (визуальный ранг опасности, не раскрывает ответ)
  g.push(`<g transform="translate(452,46)"><circle r="26" fill="#070B14" opacity="0.8" stroke="${d.accent}" stroke-width="2"/><text x="0" y="7" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="18" fill="${d.accent}">${RANK_LABEL[e.rankDanger]}</text></g>`);
  // метка id только (без имени, чтобы не раскрывать до решения — оставляем как заглушку-контур)
  g.push(`<text x="24" y="486" font-family="IBM Plex Mono, monospace" font-size="14" fill="${d.accent}" opacity="0.6">${escAttr(e.id)} · S${stage}</text>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${g.join('')}</svg>`;
  return svg;
}

// ── генерация карт навыка ──
const CARD_GLYPH = {
  C1:'trend', C2:'volume', C3:'fibonacci', C4:'risk', C5:'wait', C6:'news', C7:'token',
  C8:'shield', C9:'chain', C10:'orderbook', C11:'megaphone', C12:'clipboard', C13:'exec',
  C14:'math', C15:'defi', C16:'cycle', C17:'system', Cwait:'wait'
};
function cardSVG(cid, name, short, domain, rank){
  const d = DOMAIN[domain] || DOMAIN.cognitive;
  const W=220, H=320;
  const glyph = CARD_GLYPH[cid] || 'trend';
  const strokes = {
    trend:'M20 220 L70 160 L105 185 L190 70', volume:'M28 230 h24 v50 h-24z M70 170 h24 v110 h-24z M112 200 h24 v80 h-24z M154 140 h24 v140 h-24z',
    fibonacci:'M30 230 C30 130 90 90 190 90', risk:'M110 40 L190 75 V150 C190 210 150 250 110 270 C70 250 30 210 30 150 V75 Z',
    wait:'M110 40 a90 90 0 1 0 0 180 a90 90 0 1 0 0 -180 z', news:'M40 50 h120 v150 h-120 z M60 80 h80 M60 110 h80 M60 140 h50',
    token:'M110 45 L185 90 V185 L110 230 L35 185 V90 Z', shield:'M110 45 L185 80 V150 C185 205 150 235 110 255 C70 235 35 205 35 150 V80 Z',
    chain:'M80 170 l30 -30 m0 0 l30 30 m-30 -30 v40', orderbook:'M40 120 h30 v80 h-30z M85 100 h30 v100 h-30z M130 140 h30 v60 h-30z',
    megaphone:'M40 150 h50 v50 h-50 z M90 140 l80 -40 v130 l-80 -40', clipboard:'M70 60 h80 v160 h-80 z M90 90 h40 M90 120 h40 M90 150 h25',
    exec:'M50 200 h120 M60 200 l20 -14 m-20 14 l20 14', math:'M60 100 h100 M110 60 v90 M40 200 h140', defi:'M110 55 L180 100 V165 L110 210 L40 165 V100 Z',
    cycle:'M110 55 a85 85 0 1 1 -85 85', system:'M40 90 h140 M40 130 h90 M40 170 h60'
  };
  const g=[];
  g.push(`<defs><linearGradient id="cgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${d.accent}"/><stop offset="100%" stop-color="${d.accent2}"/></linearGradient></defs>`);
  g.push(`<rect width="${W}" height="${H}" rx="16" fill="#0C1323" stroke="${d.accent}" stroke-width="2"/>`);
  g.push(`<text x="18" y="40" font-family="IBM Plex Mono, monospace" font-size="12" fill="${d.accent}">${escAttr(cid)}</text>`);
  g.push(`<rect x="24" y="56" width="${W-48}" height="150" rx="10" fill="#060A12" stroke="${d.accent}" stroke-opacity="0.5" stroke-width="1"/>`);
  g.push(`<path d="${strokes[cid]||strokes.trend}" fill="none" stroke="url(#cgrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
  g.push(`<text x="18" y="250" font-family="Inter, sans-serif" font-size="16" fill="#E9F2FF">${escAttr(short)}</text>`);
  g.push(`<text x="18" y="276" font-family="IBM Plex Mono, monospace" font-size="11" fill="${d.accent}">r${rank}/3</text>`);
  g.push(`<rect x="18" y="292" width="24" height="24" rx="6" fill="${d.accent}" opacity="${rank>=3?1:0.5}"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 320" width="220" height="320">${g.join('')}</svg>`;
  return svg;
}

// карты из data/cards — читаем TS-подобный список
const CARDS = [
  ['C1','ОСНОВЫ РЫНКА','РЫНОК','technical',1],['C2','УРОВНИ И ОБЪЁМ','УРОВНИ','technical',1],
  ['C3','ИНДИКАТОРЫ','ИНДИК','technical',1],['C4','РИСК-МЕНЕДЖМЕНТ','РИСК','risk',1],
  ['C5','ПСИХОЛОГИЯ','ПСИХО','human',1],['C6','НОВОСТИ И МАКРО','НОВОСТИ','context',1],
  ['C7','ТОКЕНОМИКА','ТОКЕН','crypto',1],['C8','БЕЗОПАСНОСТЬ','СЕЙФ','crypto',1],
  ['C9','ОНЧЕЙН-АНАЛИЗ','ОНЧЕЙН','context',1],['C10','ДЕРИВАТИВЫ','ДЕ-РИВ','risk',1],
  ['C11','НАРРАТИВЫ','НАРРА','cognitive',1],['C12','ДИСЦИПЛИНА','ДИСЦ','human',1],
  ['C13','ИСПОЛНЕНИЕ','ИСПОЛН','risk',1],['C14','МАТЕМАТИКА','МАТ','cognitive',1],
  ['C15','DeFi','DeFi','crypto',1],['C16','ПОРТФЕЛЬ И ЦИКЛЫ','ЦИКЛ','context',1],
  ['C17','ТОРГОВАЯ СИСТЕМА','СИСТЕМА','cognitive',1],['Cwait','ЖДАТЬ','ЖДАТЬ','human',1],
];

// ── иконки меню / доменов (24×24 stroke-family, как в assets/icons.svg) ──
const ICONS = {
  'nav-academy':'M4 6h16M4 12h16M4 18h10', 'nav-arena':'M12 3l8 4v5c0 4-3.5 7-8 9-4.5-2-8-5-8-9V7l8-4z',
  'nav-collection':'M3 3h8v8H3z M14 3h7v7h-7z M3 14h8v8H3z M14 14h7v7h-7z',
  'nav-more':'M5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0z M11 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0z M17 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0z',
  'dom-technical':'M3 17l5-6 4 4 8-9 M3 21h18', 'dom-risk':'M12 3l8 4v5c0 4-3.5 7-8 9-4.5-2-8-5-8-9V7l8-4z M12 9v4 M12 16v.5',
  'dom-context':'M12 12a9 9 0 1 0 0 18 9 9 0 1 0 0 -18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  'dom-crypto':'M12 3l8 4.5v9L12 21l-8-4.5v-9z M9 10v4 M13 9v4 M9 14l4-1 M13 13l4-1',
  'dom-human':'M12 7a4 4 0 1 0 0 8 4 4 0 1 0 0 -8z M5 21v-2a7 7 0 0 1 14 0v2',
  'dom-cognitive':'M9 6a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 5 1V6a3 3 0 0 0-3 0z M15 6a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-5 1V6a3 3 0 0 1 3 0z',
};
function iconSVG(id, d){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${d||'currentColor'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[id]||ICONS['nav-more']}"/></svg>`;
}

// ── сборка ──
const ENEMIES = [
  ['E01','Wick Mimic','technical',1,'normal',4],['E02','Fake Breakout Phantom','technical',1,'normal',4],
  ['E03','Indicator Cult','technical',1,'normal',4],['E04','Leverage Goblin','risk',1,'normal',4],
  ['E05','FOMO Wraith','human',1,'normal',4],['E06','Loss Aversion Wraith','human',1,'normal',4],
  ['E07','Meme Mirage','technical',1,'normal',3],['E08','Headline Titan','context',2,'normal',4],
  ['E09','Revenge Wraith','human',2,'normal',4],['E10','Dopamine Imp','human',2,'normal',4],
  ['E11','Unlock Titan','crypto',2,'normal',3],['E12','Token Parasite','crypto',2,'normal',3],
  ['E13','Rug Pull Phantom','crypto',2,'normal',4],['E14','Honeypot Mimic','crypto',2,'normal',3],
  ['E15','Approval Leech','crypto',2,'normal',3],['E16','Whale Syndicate','context',2,'normal',4],
  ['E17','Insider Syndicate','context',2,'normal',3],['E18','Stop-Hunt Kraken','risk',2,'normal',4],
  ['E19','Liquidity Hydra','risk',3,'normal',4],['E20','Narrative Siren','human',2,'normal',3],
  ['E21','Confirmation Bias Cult','cognitive',2,'normal',4],['E22','Routine Rot','human',3,'normal',3],
  ['E23','Paper-Hands Poltergeist','human',3,'normal',3],['E24','Slippage Slime','risk',3,'normal',3],
  ['E25','Correlation Spider','context',3,'normal',3],['E26','Expectancy Sphinx','cognitive',3,'normal',3],
  ['E27','Anchor Golem','cognitive',3,'normal',3],['E28','Yield Chimera','crypto',3,'normal',3],
  ['E29','Governance Golem','crypto',3,'normal',3],['E30','Cycle Ouroboros','context',3,'normal',3],
  ['E31','Drawdown Leviathan','risk',4,'event',4],['E32','Hubris Dragon','human',4,'event',4],
  ['E33','System Breaker','cognitive',4,'boss',4],
];

function ensure(dir){ fs.mkdirSync(dir,{recursive:true}); }
function write(dir, name, content){ ensure(dir); fs.writeFileSync(path.join(dir,name), content); }

const manifest = { schema:'signal-arena-assets/1', generated:new Date().toISOString(), sizes:{ master:1500, safeZonePct:15, avatarCircle:400, card:900, trophy:1000, banner:1500, popupV:1080, headerIcon:96, placeholder:512 }, enemies:[], cards:[], icons:[] };

let count=0;
for(const [id,name,domain,rankDanger,mode,stages] of ENEMIES){
  const meta={id,name,domain,rankDanger,mode,stages:[], files:[]};
  for(let s=1;s<=stages;s++){
    const fn=`E${id.replace('E','')}_s${s}.svg`;
    write(path.join(OUT,'enemies'), fn, enemySVG({id, name:String(name), domain, rankDanger}, s));
    meta.stages.push(s); meta.files.push(`render/enemies/${fn}`); count++;
  }
  // header-icon (моно-силуэт) + avatar (круглый кроп = 400) — производные
  write(path.join(OUT,'enemies'), `E${id.replace('E','')}_icon.svg`, enemyIconSVG({id,domain,rankDanger}));
  write(path.join(OUT,'enemies'), `E${id.replace('E','')}_avatar.svg`, enemyAvatarSVG({id,domain,rankDanger}));
  manifest.enemies.push({ ...meta, icon:`render/enemies/E${id.replace('E','')}_icon.svg`, avatar:`render/enemies/E${id.replace('E','')}_avatar.svg` });
}
for(const [id,name,short,domain,rank] of CARDS){
  const fn=`${id}.svg`;
  write(path.join(OUT,'cards'), fn, cardSVG(id,name,short,domain,rank));
  manifest.cards.push({ id, name, short, domain, rank, file:`render/cards/${fn}`, size:{ w:220, h:320 } }); count++;
}
for(const [id,g] of Object.entries(ICONS)){
  write(path.join(OUT,'icons'), `${id}.svg`, iconSVG(id, '#31D6C4'));
  manifest.icons.push({ id, file:`render/icons/${id}.svg`, size:24, role: id.startsWith('nav')?'menu':'domain' }); count++;
}

// полный список «что нужно к арту/иконкам» (для меню и на карте)
const menuIcons = [
  ['nav-academy','menu','Академия'],['nav-arena','menu','Арена'],['nav-collection','menu','Коллекция'],['nav-more','menu','Ещё'],
  ['dom-technical','domain','Тех анализ'],['dom-risk','domain','Риск'],['dom-context','domain','Контекст'],
  ['dom-crypto','domain','Крипто'],['dom-human','domain','Человек'],['dom-cognitive','domain','Когнитивное'],
];
write(path.join(TMP), 'icon-index.json', JSON.stringify({ menuIcons, friendly:true }, null, 2));
write(path.join(TMP), 'manifest.json', JSON.stringify(manifest, null, 2));

// ── производные силуэт/аватар (маленькие) ──
function enemyIconSVG(e){
  const d=DOMAIN[e.domain];
  const g=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">`];
  g.push(`<rect width="96" height="96" rx="20" fill="none" stroke="${d.accent}" stroke-width="2"/>`);
  g.push(`<circle cx="48" cy="52" r="20" fill="${d.accent}" opacity="0.92"/>`);
  g.push(`<path d="M28 52 L48 30 L68 52" stroke="#05070D" stroke-width="4"/>`);
  g.push(`<circle cx="42" cy="50" r="3" fill="#05070D"/><circle cx="54" cy="50" r="3" fill="#05070D"/>`);
  g.push(`<text x="48" y="86" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="${d.accent}">${RANK_LABEL[e.rankDanger]}</text></svg>`);
  return g.join('');
}
function enemyAvatarSVG(e){
  const d=DOMAIN[e.domain];
  const g=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">`];
  g.push(`<circle cx="200" cy="200" r="200" fill="#070B14"/>`);
  g.push(`<circle cx="200" cy="200" r="170" fill="${d.base[0]}" stroke="${d.accent}" stroke-width="4"/>`);
  g.push(`<circle cx="200" cy="210" r="70" fill="${d.accent}" opacity="0.85"/>`);
  g.push(`<circle cx="200" cy="210" r="70" fill="#05070D" opacity="0.5"/>`);
  g.push(`<circle cx="173" cy="205" r="9" fill="${d.glow}"/><circle cx="227" cy="205" r="9" fill="${d.glow}"/>`);
  g.push(`</svg>`);
  return g.join('');
}

console.log(`✔ сгенерировано заглушек: врагов ${ENEMIES.length} (стадий+иконки+аватары), карт ${CARDS.length}, иконок ${Object.keys(ICONS).length}`);
console.log(`→ ${OUT}`);
