// 템플릿 목록 (10-31): 이름 = 그 템플릿만의 디자인 용어 · 장면, 소개 = 3줄(생김새 · 셔플로 바뀌는 것 · 언제 좋은지). pop = 인기 순서(서버 사용 수가 쌓이기 전까지 우리가 정해요).
// 포맷(기본 · 디자인 · 아트) 안의 작품 하나하나. 나중에 관리자 '템플릿' 메뉴에서 오는 값과 같은 모양이에요.
// 태그 = 칩 · 메인 줄에 보이는 것 (템플릿마다 2~3개, 아래 TAGS 안에서만). words = 관련 검색어 (검색에만 써요, 안 보여요)
// 템플릿 틀 (11-06): 템플릿 하나 = 정보 한 줄 (서버 표 dz_templates, 관리자 '템플릿' 메뉴가 같은 표를 써요).
// 이름 · 종류 · 설명 · 태그 · 관련 검색어 · 유료 · 날짜 · 예시 3개 · 도구 · 모션 · 그림 파일 · 숨김/공개.
// 카드는 쓴 템플릿 id(card.tpl)를 저장해요. 그리는 틀(fmt)은 앱 안 코드라, 같은 틀로 템플릿을 여러 개 둘 수 있어요.
// 목록: 앱 안 기본값(아래) → 폰에 저장해 둔 서버 목록 → 앱을 열 때 서버에서 새로 받아요 (인터넷이 없으면 저장해 둔 것)
import * as S from './store.js';
import { sampleCard, FORMATS, failed, onFail } from './formats.js';

const BUILTIN = [
  { id: 'rebus', fmt: 'rebus', name: '멤피스 문장', kind: '디자인', pop: 2, added: '2026-10-21', motion: true,
    desc: ['80년대 이탈리아 멤피스 디자인처럼|물결선, 반원, 마름모가 낱말 옆에 붙어요.', '셔플할 때마다|도형 모양과 색이 새로 바뀌어요.', '짧은 하루 한 줄을|포스터처럼 남기고 싶을 때 좋아요.'], paid: true,
    tags: ['짧은글', '감성'], words: ['멤피스', '리버스', '그림 문장', '그림', '문장', '아이콘', '귀여운', '도형', '낱말', '알록달록', '포스터', '80년대'],
    ex: ['친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.',
      '아침에 <b>창문</b>을 열었더니 공기가 <mark>차가웠다</mark>. 겨울이 오나 보다.',
      '<b>비</b> 오는 날엔 <mark>따뜻한</mark> 차 한 잔.'] },
  { id: 'art', fmt: 'art', name: '오로라 커튼', kind: '아트', pop: 1, added: '2026-10-23', motion: true,
    desc: ['오로라 그라데이션으로 그린 세로 빛줄기가|커튼처럼 천천히 흘러요.', '셔플할 때마다 새 빛이 번져요.', '늦은 밤|짧은 글과 잘 어울려요.'], paid: true,
    tags: ['밤', '감성'], words: ['오로라', '커튼', '그라데이션', '번지는 빛', '빛', '무지개', '몽환', '새벽', '네온', '번짐', '흐르는', '디지털 아트'],
    ex: [['창밖 불빛이 번지는 밤.', 11, '916'], ['퇴근길 하늘이 보라색이었다.', 42, '45'], ['오늘은 아무것도 하지 않아도 괜찮았다.', 77, '11']] },
];

// 테스트용 더미 (10-31 앤드류: 2개로는 전체 볼륨을 몰라요). 같은 두 템플릿을 그림 · 태그 · 날짜만 바꿔 채워요. 오픈 전에 false
const DUMMY = true;   // 오픈 전에 false (런치 체크리스트)
const dummies = base => {
  const TG = [['밤', '감성'], ['비', '짧은글'], ['아침', '감성'], ['겨울', '밤'], ['가을', '짧은글'], ['눈', '감성'], ['봄', '아침'], ['여름', '비']], out = [];
  const two = ['rebus', 'art'].map(id => base.find(t => t.id === id) || BUILTIN.find(t => t.id === id));
  for (let i = 0; i < 16; i++) {
    const b = two[i % 2], ex = Array.isArray(b.ex[0]) ? b.ex.map(([t, sd, r]) => [t, (sd + i * 23) % 97, r]) : [...b.ex.slice(i % 3), ...b.ex.slice(0, i % 3)];
    out.push({ ...b, id: `${b.id}-${i + 1}`, pop: 3 + ((i * 7) % 16), added: `2026-10-${String(20 - i).padStart(2, '0')}`, tags: TG[i % TG.length], ex, dummy: true });
  }
  return out;
};

// 보이는 목록 (공개만). 배열은 그대로 두고 안의 것만 바꿔요 (다른 파일이 같은 배열을 봐요)
export const TEMPLATES = [];
const KNOWN = new Map();   // 지금 안 보여도(숨김 등) 내 카드 이름표를 찾을 수 있게 본 적 있는 것 전부
const CK = 'dz.tpl.v1';
// 서버 한 줄 → 앱 모양. 그리는 틀이 이 앱에 없으면(앱이 더 오래됨) 빼요
function fromRow(r) {
  if (!r || !r.id || !/^[a-z0-9-]{2,40}$/.test(r.fmt || '') || failed(r.fmt) || !r.name) return null;   // 틀은 볼 때 불러와요 (폴더가 없으면 그때 빼요)
  const arr = (v, d = []) => Array.isArray(v) ? v : d;
  const ex = arr(r.ex); if (!ex.length) return null;
  return { id: r.id, fmt: r.fmt, kind: r.kind, name: r.name, desc: arr(r.descr ?? r.desc), tags: arr(r.tags), words: arr(r.words), ex,
    tools: r.tools && typeof r.tools === 'object' ? r.tools : {}, assets: r.assets || {}, paid: !!r.paid, motion: !!r.motion,
    pop: r.pop ?? 99, sort: r.sort ?? 0, added: String(r.added || '2026-01-01').slice(0, 10),
    thumb: typeof r.assets?.thumb === 'string' ? r.assets.thumb : '' };   // 목록용 정지 그림 (공개할 때 자동으로 만들어요)
}
function use(list) {
  const base = list.length ? list : BUILTIN;
  TEMPLATES.splice(0, TEMPLATES.length, ...base, ...(DUMMY ? dummies(base) : []));
  TEMPLATES.forEach(t => KNOWN.set(t.id, t));
}
BUILTIN.forEach(t => KNOWN.set(t.id, t));
// 이 앱에 그 틀 폴더가 없으면(서버가 앞서 감) 목록에서 빼요
onFail(f => { const n = TEMPLATES.length; for (let i = TEMPLATES.length - 1; i >= 0; i--) if (TEMPLATES[i].fmt === f) TEMPLATES.splice(i, 1); if (TEMPLATES.length !== n) onUpd?.(); });
try { const c = JSON.parse(localStorage.getItem(CK) || 'null'); use((c?.rows || []).map(fromRow).filter(Boolean)); } catch { use([]); }

// 서버에서 받아 오기 (공개만). 1,000개가 넘어도 가볍게: 먼저 id · 고친 때만 받고(작아요), 새로 생기거나 바뀐 것만 내용을 받아요.
// 서버 목록에 없는 건(숨김 · 지움) 폰 사본에서도 빼요. 표가 아직 없거나 비었으면 앱 안 기본값 그대로
let onUpd = null;
export const onUpdate = f => { onUpd = f; };
export async function refresh() {
  const C = window.APP_CONFIG || {};
  if (!/^https:\/\//.test(C.SUPABASE_URL || '') || !C.SUPABASE_ANON_KEY) return false;
  const rest = tb => q => fetch(`${C.SUPABASE_URL}/rest/v1/${tb}?${q}`, { headers: { apikey: C.SUPABASE_ANON_KEY, authorization: `Bearer ${C.SUPABASE_ANON_KEY}` } }).then(r => r.ok ? r.json() : Promise.reject(r.status));
  const get = rest('dz_templates'), getK = rest('dz_kinds'), getT = rest('dz_tags');
  try {
    try {   // 종류 순서 (작아요). 표가 없으면 그대로
      const ks = await getK('select=name&order=sort.asc');
      if (Array.isArray(ks) && ks.length) { KORDER = ks.map(k => k.name).filter(Boolean); localStorage.setItem(KK, JSON.stringify(KORDER)); }
    } catch {}
    try {   // 태그 목록 · 순서 · 이때 앞으로 (작아요). 표가 없으면 그대로
      const ts = await getT('select=id,cond&order=sort.asc');
      if (Array.isArray(ts) && ts.length) { TAGS = tagsFrom(ts); localStorage.setItem(TK, JSON.stringify(ts)); }
    } catch {}
    const ids = await get('select=id,updated_at&state=eq.public&limit=5000');
    if (!Array.isArray(ids) || !ids.length) return false;
    let cache = {}; try { cache = JSON.parse(localStorage.getItem(CK) || '{}'); } catch {}
    const have = new Map((cache.rows || []).map(r => [r.id, r]));
    const want = ids.filter(x => have.get(x.id)?.updated_at !== x.updated_at).map(x => x.id);
    for (let i = 0; i < want.length; i += 100) {   // 바뀐 것만 100개씩
      const part = want.slice(i, i + 100).map(id => `"${id}"`).join(',');
      (await get(`select=*&state=eq.public&id=in.(${encodeURIComponent(part)})`)).forEach(r => have.set(r.id, r));
    }
    const live = new Set(ids.map(x => x.id));
    const rows = [...have.values()].filter(r => live.has(r.id)).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(b.added).localeCompare(String(a.added)));
    const list = rows.map(fromRow).filter(Boolean); if (!list.length) return false;
    const was = JSON.stringify(TEMPLATES.filter(t => !t.dummy));
    try { localStorage.setItem(CK, JSON.stringify({ at: Date.now(), rows })); } catch {}
    use(list);
    if (JSON.stringify(TEMPLATES.filter(t => !t.dummy)) !== was) onUpd?.();
    return true;
  } catch { return false; }
}

// 종류 (11-06): 디자인 · 아트 … 관리자가 정하는 목록 (서버 표 dz_kinds: 이름 · 순서). 새 종류를 넣으면 칩 · 홈 줄 · 프로필 그래프가 저절로 따라와요.
// 보이는 건 공개 템플릿이 1개 이상 있는 종류만. 목록에 없는 종류를 쓴 템플릿은 맨 뒤에 붙어요
const KK = 'dz.kinds.v1';
let KORDER = ['디자인', '아트'];
try { const k = JSON.parse(localStorage.getItem(KK) || 'null'); if (Array.isArray(k) && k.length) KORDER = k; } catch {}
export function kinds() {
  const used = [...new Set(TEMPLATES.map(t => t.kind).filter(Boolean))];
  return [...KORDER.filter(k => used.includes(k)), ...used.filter(k => !KORDER.includes(k))];
}
// '디자인 멤피스 문장' → '멤피스 문장' (프로필 '자주 쓴 템플릿')
export const stripKind = s => { const k = [...KORDER, ...kinds()].find(k => s.startsWith(k + ' ')); return k ? s.slice(k.length + 1) : s; };

// 칩 · 메인 줄 키워드. when = 이때 앞으로 와요 (날씨 · 시간 · 계절)
// 11-06: 관리자 '템플릿 > 종류 · 태그'에서 고쳐요 (서버 표 dz_tags: id · cond · sort). 아래는 표가 없거나 못 받을 때 기본값
export let TAGS = [
  { id: '밤', when: { time: ['evening', 'night'] } },
  { id: '비', when: { wx: ['rain', 'thunder'] } },
  { id: '눈', when: { wx: ['snow'] } },
  { id: '아침', when: { time: ['morning'] } },
  { id: '겨울', when: { season: ['winter'] } },
  { id: '봄', when: { season: ['spring'] } },
  { id: '여름', when: { season: ['summer'] } },
  { id: '가을', when: { season: ['autumn'] } },
  { id: '짧은글' }, { id: '감성' },
];
const TK = 'dz.tags.v1';
const tagsFrom = rows => rows.filter(r => r && r.id).map(r => r.cond && Object.keys(r.cond).length ? { id: r.id, when: r.cond } : { id: r.id });
try { const t = JSON.parse(localStorage.getItem(TK) || 'null'); if (Array.isArray(t) && t.length) TAGS = tagsFrom(t); } catch {}

export const tpl = id => TEMPLATES.find(t => t.id === id) || KNOWN.get(id);
// 카드의 템플릿: 저장한 id → (예전 카드) 같은 틀의 첫 템플릿
export const tplOfCard = c => !c || c.fmt === 'text' ? null : (c.tpl && KNOWN.get(c.tpl)) || TEMPLATES.find(t => t.fmt === c.fmt && !t.dummy) || [...KNOWN.values()].find(t => t.fmt === c.fmt);
// 카드 이름표: '기본' 또는 '디자인 · 멤피스 문장'
export const labelOf = c => { if (!c) return ''; if (c.fmt === 'text') return '기본'; const t = tplOfCard(c); return t ? `${t.kind} · ${t.name}` : ''; };
// 이 카드를 쓸 때 도구: 틀 기본값 + 템플릿이 바꾼 것
export const toolsOf = c => ({ ...(FORMATS[c?.fmt]?.tools || {}), ...(tplOfCard(c)?.tools || {}) });

// 지금: 시간대 · 계절 · 날씨(예전 앱이 남긴 값)
export function now(d = new Date()) {
  const h = d.getHours(), m = d.getMonth() + 1;
  let wx = null; try { const w = JSON.parse(localStorage.getItem('daytale.wx') || 'null'); if (w && Date.now() - w.at < 3 * 3600e3) wx = w.kind; } catch {}
  return { time: h >= 5 && h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night',
    season: m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter', wx };
}
// 이 태그가 지금과 얼마나 맞는지: 날씨 3 · 시간 2 · 계절 1
const fit = (t, n) => !t.when ? 0 : (t.when.wx?.includes(n.wx) ? 3 : 0) + (t.when.time?.includes(n.time) ? 2 : 0) + (t.when.season?.includes(n.season) ? 1 : 0);

// 칩 순서: 지금 맞는 것 최대 2개 → 내가 자주 쓰는 것 → 나머지 (정해 둔 순서). 템플릿이 하나도 없는 태그는 빼요
export function tagOrder(n = now()) {
  const used = new Set(TEMPLATES.flatMap(t => t.tags));
  const live = TAGS.filter(t => used.has(t.id));
  const hot = live.map(t => [t, fit(t, n)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0].id);
  const cnt = {}; S.cards().forEach(c => tplOfCard(c)?.tags.forEach(g => { cnt[g] = (cnt[g] || 0) + 1; }));
  const mine = live.map(t => t.id).filter(g => cnt[g] && !hot.includes(g)).sort((a, b) => cnt[b] - cnt[a]);
  return [...hot, ...mine, ...live.map(t => t.id).filter(g => !hot.includes(g) && !mine.includes(g))];
}
// 지금 맞는 템플릿 점수 (태그 중 가장 잘 맞는 것)
const score = (t, n) => Math.max(0, ...t.tags.map(g => fit(TAGS.find(x => x.id === g) || {}, n)));
const dayNo = () => Math.floor(new Date(S.today() + 'T00:00:00').getTime() / 864e5);

// 위 판 3장: 오늘 무료(유료 사용자는 오늘 추천) · 지금 추천 · 새로 나온. 같은 템플릿은 한 번만
export function heroes(n = now()) {
  const paid = TEMPLATES.filter(t => t.paid);
  const best = Math.max(...paid.map(t => score(t, n)));
  const pool = paid.filter(t => score(t, n) === best);
  const free = pool[dayNo() % pool.length];   // 날마다 하나, 그날은 그대로 (사용자가 고르지 않아요)
  const out = free ? [{ k: 'free', t: free }] : [];   // 유료 템플릿이 없으면 '오늘 무료' 판은 빼요
  const rec = TEMPLATES.filter(t => t !== free).sort((a, b) => score(b, n) - score(a, n))[0];
  if (rec) out.push({ k: 'now', t: rec });
  const nw = newest().find(t => !out.some(o => o.t === t));
  if (nw) out.push({ k: 'new', t: nw });
  return out;
}
export const newest = () => [...TEMPLATES].sort((a, b) => b.added.localeCompare(a.added));
// 내가 쓴 카드 수 (템플릿별)
export const mineCount = () => { const n = {}; S.cards().forEach(c => { const t = tplOfCard(c); if (t) n[t.id] = (n[t.id] || 0) + 1; }); return n; };
// 줄 탭 순서: 새로 나온(30일 안) · 인기 · 자주 쓴(내가 쓴 것만)
export function sorted(k) {
  if (k === 'pop') return [...TEMPLATES].sort((a, b) => (a.pop || 99) - (b.pop || 99));
  if (k === 'mine') { const n = mineCount(); return TEMPLATES.filter(t => n[t.id]).sort((a, b) => n[b.id] - n[a.id]); }
  return newest().filter(t => (new Date(S.today()) - new Date(t.added)) / 864e5 <= 30);
}

// 예시 카드 (작은 칸: 아트는 글 없이, 디자인은 글 그대로). i = 몇 번째 예시
export function exCard(t, i = 0, bare = false) {
  const c = sampleCard(t.fmt, S.today()); const e = t.ex[i % t.ex.length]; c.tpl = t.id;
  if (typeof e === 'string') { c.html = e; c.seed = 7 + i * 14; return c; }   // 한 덩어리 글 (디자인)
  const [txt, seed, ratio] = e;
  c.pages = [bare ? '' : txt]; c.bg = { ...c.bg, seed }; if (!bare && ratio) c.ratio = ratio;
  return c;
}
// 소개 줄의 | = 줄이 넘칠 때 내려갈 자리 (뜻이 끊기지 않게). 화면에선 안 보여요
export const line = d => d.replace(/\|/g, ' ');
// 검색: 이름 · 종류 · 설명 · 태그 · 검색어
export const hit = (t, q) => !q || [t.name, t.kind, ...t.desc.map(line), ...t.tags, ...t.words].some(s => s.toLowerCase().includes(q.toLowerCase()));

export const favs = () => S.pref('favT', []);
export const isFav = id => favs().includes(id);
export const toggleFav = id => { const f = favs(); S.setPref('favT', f.includes(id) ? f.filter(x => x !== id) : [id, ...f]); return !f.includes(id); };
