/* 이야기 속 문학 한 구절: 저작권이 끝난 작가(사망 70년 이상)의 글을 2~3줄로, 우리 말투로 감싸요.
   목록(작가·원문 언어·계절/시간대/날씨 꼬리표)은 lit/catalogue.js, 글은 언어별 묶음 lit/<언어>.js 에 id로 있어요.
   앱은 쓰는 언어의 묶음 하나만 불러요(import). 서버 이야기 문장(phrase_packs, slot 'lit')이 있으면 그 위에 덧씌워요.
   새 언어: lit/<언어>.js 하나 + 아래 PACKS 한 줄. 자세한 건 docs/content-packs.md */
import { AUTHORS, CATALOGUE } from './lit/catalogue.js';

/* 언어별 묶음 (여기 한 줄 = 언어 하나). 묶음이 없는 언어는 FALLBACK 언어로 보여요 */
const PACKS = {
  ko: () => import('./lit/ko.js'),
  en: () => import('./lit/en.js'),
  ja: () => import('./lit/ja.js'),
  es: () => import('./lit/es.js'),
  fr: () => import('./lit/fr.js')
};
const FALLBACK = 'en';
const packLang = lang => PACKS[lang] ? lang : FALLBACK;

const SEASON = { spring: 1, summer: 1, autumn: 1, winter: 1 };
const BY_ID = new Map(CATALOGUE.map(x => [String(x.id), x]));

/* ---------- 불러오기 · 서버 덧씌우기 ---------- */
const texts = {};        // { 묶음 언어: { id: 글 } }
const loading = {};
let remote = {};         // { 언어: [서버 줄 { id, a, o, s, t, w, sun, weight, text }] }
let stamp = 0;           // 목록이 바뀔 때마다 올라가요 (화면이 이야기를 다시 쓰게)
const cache = {};
const changed = () => { stamp++; for (const k in cache) delete cache[k]; };

/** 그 언어의 묶음을 불러요 (한 번만). 끝나면 true */
function loadLit(lang) {
  const l = packLang(lang);
  if (texts[l]) return Promise.resolve(true);
  return loading[l] ||= PACKS[l]().then(m => { texts[l] = m.default || {}; changed(); return true; }).catch(() => { delete loading[l]; return false; });
}
const litReady = lang => !!texts[packLang(lang)];
/** 시험·미리 불러 둔 경우: 묶음을 직접 넣어요 */
function setLitPack(lang, pack) { texts[lang] = pack || {}; changed(); }

/* 서버 줄(phrase_packs, slot 'lit') → 문학 줄. cond 는 관리자 문장과 같은 말을 써요:
   tod 시간대 · season 계절 · wx 날씨 종류 · light true(햇빛 줄) + 문학 전용 id(앱 안 줄을 고칠 때) · a 작가 · o 원문 언어 */
const WX = k => k === 'sun' ? 'clear' : k === 'rain' || k === 'thunder' ? 'rain' : k === 'snow' ? 'snow' : k ? 'cloud' : undefined;
const hashOf = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
function setLitRemote(rows = []) {
  remote = {};
  for (const r of rows) {
    if (r?.slot !== 'lit' || !r.text) continue;
    const c = r.cond || {}, id = c.id != null ? String(c.id) : r.id != null ? 's' + r.id : 'h' + hashOf(r.text);
    const tags = { s: c.season, t: c.tod, w: WX(c.wx), sun: c.light === true ? 1 : undefined, a: c.a, o: c.o };
    Object.keys(tags).forEach(k => tags[k] === undefined && delete tags[k]);
    (remote[r.lang] ||= []).push({ id, ...tags, weight: Math.max(1, Number(r.weight) || 1), text: r.text });
  }
  changed();
}

/** 그 언어로 나올 수 있는 줄 전체: 앱 안 목록(묶음에 글이 있는 것만) + 서버 줄(같은 id면 덮어쓰기, 아니면 더하기) */
function litList(lang) {
  const l = packLang(lang);
  if (cache[l]) return cache[l];
  const pack = texts[l] || {}, out = new Map();
  for (const x of CATALOGUE) { const text = pack[x.id]; if (text) out.set(String(x.id), { ...x, id: x.id, text }); }
  for (const r of remote[l] || []) {
    const base = BY_ID.get(r.id), id = base ? base.id : r.id;
    out.set(String(id), { ...(base || { a: 'srv:' + r.id, o: 'world' }), ...r, id });
  }
  return cache[l] = [...out.values()];
}
const litById = (lang, id) => litList(lang).find(x => String(x.id) === String(id)) || null;

/* ---------- 고르기 ---------- */
const DARK_OK = x => x.t === 'night';   // 밤 풍경 줄
/* 그 언어 사용자에게 줄의 묶음: 원문 언어가 같으면 '그 나라 작가' 30% · 세계 고전 60% · 다른 나라(한국·일본) 작가 10% (대표 결정 2026-10-14) */
const originOf = x => x?.o || 'world';
const REGIONAL = ['ko', 'ja'];   // 세계적으로 덜 알려진 근대 문학: 그 나라가 아니면 '다른 나라 작가'(10%)
const bucket = (x, lang) => { const o = originOf(x); return o === lang ? 'local' : REGIONAL.includes(o) ? 'other' : 'world'; };
const SHARE = [['local', .3], ['world', .6], ['other', .1]];
/** 오늘(날짜·시간대) 하나를 골라요. 계절·시간대·날씨가 맞을수록 자주, 최근 2주에 나온 줄은 건너뛰어요.
    seen: 최근에 나온 줄 id (오래된 것부터). list: 고를 줄 (기본은 불러 둔 그 언어 목록) */
function pickLit(ctx, lang, seen = [], list = litList(lang)) {
  const kind = ctx.weather?.kind; const wx = kind === 'sun' ? 'clear' : kind === 'rain' || kind === 'thunder' ? 'rain' : kind === 'snow' ? 'snow' : kind ? 'cloud' : '';
  const light = ctx.light ?? (ctx.slot === 'morning' || ctx.slot === 'day');
  // 시간대: 밤 줄은 해가 진 저녁에도, 그 밖에는 적힌 시간대에만. 햇빛 줄은 해가 떠 있을 때만
  const tOk = x => !x.t || [].concat(x.t).includes(ctx.slot) || (DARK_OK(x) && ctx.slot === 'evening' && !light);
  const fits = list.filter(x => x.text && (!x.s || x.s === ctx.season) && tOk(x) && (!x.w || x.w === wx) && (!x.sun || light) && !(DARK_OK(x) && light));
  const score = x => (x.s ? 2 : 0) + (x.t ? 2 : 0) + (x.w ? 3 : 0);
  // 같은 작가가 며칠 내리 나오지 않게: 최근 여섯 번(약 사흘) 안에 나온 작가는 쉬어요. 줄 하나는 14일 동안 다시 나오지 않아요
  const seenS = seen.map(String), byId = new Map(list.map(x => [String(x.id), x]));
  const recent = new Set(seenS.slice(-6).map(i => byId.get(i)?.a).filter(Boolean));
  const unseen = fits.filter(x => !seenS.includes(String(x.id)));
  const fresh = unseen.filter(x => !recent.has(x.a));
  const pool = fresh.length ? fresh : unseen.length ? unseen : fits;
  if (!pool.length) return null;
  let h = 0; for (const c of ctx.today + ctx.slot) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b) >>> 0; h = (h ^ (h >>> 16)) >>> 0;   // >>> 0: 음수가 되지 않게
  // 먼저 묶음(그 나라 30 · 세계 고전 60 · 다른 나라 10)을 고르고, 그 묶음이 비면 세계 고전 → 아무거나
  const groups = Object.fromEntries(SHARE.map(([b]) => [b, pool.filter(x => bucket(x, lang) === b)]));
  let roll = (h % 1000) / 1000, want = 'world';
  for (const [b, p] of SHARE) { if (roll < p) { want = b; break; } roll -= p; }
  const cand = groups[want].length ? groups[want] : groups.world.length ? groups.world : pool;
  // 계절·시간대·날씨가 맞을수록 자주 나와요 (언제든 어울리는 줄도 가끔). 서버 줄은 weight 만큼 더
  const weight = x => score(x) + (x.weight || 1), total = cand.reduce((n, x) => n + weight(x), 0);
  let r = (h >>> 10) % total, pick = cand[0];
  for (const it of cand) { r -= weight(it); if (r < 0) { pick = it; break; } }
  return { i: pick.id, html: pick.text };
}

const litStamp = () => stamp;

export { AUTHORS, CATALOGUE, FALLBACK, PACKS, SEASON, bucket, litById, litList, litReady, litStamp, loadLit, originOf, packLang, pickLit, setLitPack, setLitRemote };
