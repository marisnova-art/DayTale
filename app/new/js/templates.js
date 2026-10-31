// 템플릿 목록 (10-31): 이름 = 그 템플릿만의 디자인 용어 · 장면, 소개 = 3줄(생김새 · 셔플로 바뀌는 것 · 언제 좋은지). pop = 인기 순서(서버 사용 수가 쌓이기 전까지 우리가 정해요).
// 포맷(기본 · 디자인 · 아트) 안의 작품 하나하나. 나중에 관리자 '템플릿' 메뉴에서 오는 값과 같은 모양이에요.
// 태그 = 칩 · 메인 줄에 보이는 것 (템플릿마다 2~3개, 아래 TAGS 안에서만). 검색어 = 검색에만 쓰는 비슷한 말 (안 보여요)
import * as S from './store.js';
import { sampleCard } from './formats.js';

export const TEMPLATES = [
  { id: 'rebus', fmt: 'rebus', name: '멤피스 문장', kind: '디자인', pop: 2, added: '2026-10-21',
    desc: ['80년대 이탈리아 멤피스 디자인처럼|물결선, 반원, 마름모가 낱말 옆에 붙어요.', '셔플할 때마다|도형 모양과 색이 새로 바뀌어요.', '짧은 하루 한 줄을|포스터처럼 남기고 싶을 때 좋아요.'], paid: true,
    tags: ['짧은글', '감성'], words: ['멤피스', '리버스', '그림 문장', '그림', '문장', '아이콘', '귀여운', '도형', '낱말', '알록달록', '포스터', '80년대'],
    ex: ['친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.',
      '아침에 <b>창문</b>을 열었더니 공기가 <mark>차가웠다</mark>. 겨울이 오나 보다.',
      '<b>비</b> 오는 날엔 <mark>따뜻한</mark> 차 한 잔.'] },
  { id: 'art', fmt: 'art', name: '오로라 커튼', kind: '아트', pop: 1, added: '2026-10-23',
    desc: ['오로라 그라데이션으로 그린 세로 빛줄기가|커튼처럼 천천히 흘러요.', '셔플할 때마다 새 빛이 번져요.', '늦은 밤|짧은 글과 잘 어울려요.'], paid: true,
    tags: ['밤', '감성'], words: ['오로라', '커튼', '그라데이션', '번지는 빛', '빛', '무지개', '몽환', '새벽', '네온', '번짐', '흐르는', '디지털 아트'],
    ex: [['창밖 불빛이 번지는 밤.', 11, '916'], ['퇴근길 하늘이 보라색이었다.', 42, '45'], ['오늘은 아무것도 하지 않아도 괜찮았다.', 77, '11']] },
];

// 칩 · 메인 줄 키워드. when = 이때 앞으로 와요 (날씨 · 시간 · 계절)
export const TAGS = [
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

export const tpl = id => TEMPLATES.find(t => t.id === id);
export const tplOfCard = c => TEMPLATES.find(t => t.fmt === c?.fmt);

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
  const out = [{ k: 'free', t: free }];
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
  const c = sampleCard(t.fmt, S.today()); const e = t.ex[i % t.ex.length];
  if (t.fmt === 'rebus') { c.html = e; c.seed = 7 + i * 14; return c; }
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
