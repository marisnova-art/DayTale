// 글포맷 배경: 무료(그라데이션·단색) / 유료 '배경'(작품 이미지·코드 배경). 딤은 배경마다 우리가 정해 둬요
// dim: [방식 all|center|bottom, 어두운 딤 색, 세기], ink = 딤 없이 쓰는 글색
// 무료 그라데이션 24개: 지금 앱 배경 24종의 색(시간대 4 × 6)을 카드용으로 밝게 옮겼어요. 단색 11개는 지금 앱 단색 그대로
const PAL24 = [
  ['#E86AA0', '#FFB59A', '#55559A'], ['#7FA6E0', '#F3D3A8', '#4E7A8A'], ['#EAA83A', '#FFE08A', '#4F8268'], ['#F06A5A', '#FFB27A', '#3E6A7A'],
  ['#3FA0D8', '#A8E6D8', '#2E6A70'], ['#EE7A4A', '#FFC48A', '#5E6A60'], ['#E0402A', '#F08A3E', '#2F5E5A'], ['#4A8EF0', '#A6D6FF', '#2F5C88'],
  ['#5DBE6A', '#D8E87A', '#2E6A50'], ['#3ED0B0', '#C2F2D8', '#2A6670'], ['#D9A050', '#F5D8A0', '#5E5A50'], ['#F05A6A', '#FFA080', '#3A5A9A'],
  ['#E8452A', '#FF9A3A', '#6A2E5A'], ['#C83A7A', '#F08AA0', '#4A2E7A'], ['#E86A1A', '#FFB040', '#7A3A2A'], ['#9A6AF0', '#F0A0C8', '#3E3A8A'],
  ['#D8506A', '#F0C090', '#5A3A50'], ['#F0503A', '#F09060', '#1E5A6A'], ['#2A5AD0', '#5AA0F0', '#1A3A6A'], ['#2AD08A', '#7AE0F0', '#3A2A7A'],
  ['#6A3AE0', '#B07AF0', '#2A2A6A'], ['#1A8A8A', '#5AC0B0', '#1A3A50'], ['#6A7AB0', '#C8D0E8', '#3A4460'], ['#C0401A', '#E8803A', '#3A2A3A'],
];
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
const SOLIDS = [['#F3EADB', '#2A2018'], ['#CFE2C4', '#1E2A20'], ['#C9DDF4', '#13243A'], ['#D9A441', '#2A1E08'], ['#9A4530', '#FFF4EC'], ['#DE939C', '#2A1218'],
  ['#256662', '#F0FFFC'], ['#173832', '#E8F3EE'], ['#131B32', '#E6ECFF'], ['#3A2240', '#F7E9F3'], ['#1C1C1E', '#F2F0EC']];
// 배경 이름: 고를 때 위 가운데에 "종류 · 이름"으로 잠깐 떠요 (언어마다 그 나라 말로, 18글자 안쪽)
const G_NAMES = ['노을 핑크', '하늘 모래', '레몬 숲', '산호 바다', '새벽 바다', '귤빛 오후', '저녁 불꽃', '맑은 하늘', '여름 풀밭', '민트 호수', '가을 들판', '장밋빛 노을',
  '석양', '베리 밤', '호박 등불', '라벤더 꿈', '복숭아 저녁', '여름 노을', '깊은 파랑', '오로라', '보랏빛 밤', '청록 숲', '안개 새벽', '모닥불'];
const S_NAMES = ['크림', '연두', '하늘', '겨자', '벽돌', '장미', '청록', '숲', '밤하늘', '자두', '먹색'];
export const KIND = { g: '그라데이션', s: '솔리드' };
export const FREE = [
  ...PAL24.map(([hot, warm, deep], i) => ({ id: 'g' + (i + 1), name: G_NAMES[i], kind: 'g', css: `linear-gradient(165deg,${warm} 0%,${hot} 52%,${deep} 100%)`, tone: hot, ink: '#fff', dim: ['all', rgb(deep), .3] })),
  ...SOLIDS.map(([bg, ink], i) => ({ id: 's' + (i + 1), name: S_NAMES[i], kind: 's', css: bg, tone: bg, ink, dim: ['all', '0,0,0', 0] })),
];

export const PAID = [
  { id: 'haze', img: './bg/haze.webp', tone: '#2f6b55', ink: '#F3ECE0', dim: ['all', '10,30,22', .55] },
  { id: 'stars', img: './bg/stars.webp', tone: '#3a3f7a', ink: '#F3E6C8', dim: ['center', '0,0,0', .55] },
  { id: 'bands', code: 'bands', tone: '#a35cff', ink: '#fff', dim: ['center', '40,16,70', .55] },
];

// 내 사진: 사진은 카드마다 달라서(ph) 여기엔 딤 · 글색만. 어둡게 덮고 흰 글
export const PHOTO = { id: 'photo', name: '내 사진', photo: true, tone: '#555555', ink: '#fff', dim: ['all', '0,0,0', .34] };
export const find = id => id === 'photo' ? PHOTO : FREE.find(b => b.id === id) || PAID.find(b => b.id === id) || FREE[0];
export const isPaid = id => PAID.some(b => b.id === id);

// 사용자가 고르는 건 '밝게 / 어둡게' 하나뿐이에요
export function dimCss(b, mode) {
  if (mode === 'light') return { layer: 'rgba(255,255,255,.5)', ink: '#26231E' };
  const [kind, rgb, a] = b.dim;
  const c = x => `rgba(${rgb},${x})`;
  const layer = kind === 'center' ? `radial-gradient(ellipse at center, ${c(a)} 0%, ${c(a * .6)} 45%, ${c(0)} 78%)`
    : kind === 'bottom' ? `linear-gradient(to bottom, ${c(0)} 30%, ${c(a * 1.3)} 80%)` : c(a);
  return { layer, ink: b.ink };
}

// 코드 배경: 씨앗 번호가 같으면 늘 같은 모양이에요
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PAL = ['#3fd35a', '#ff4d6d', '#ff6ad5', '#8a5cff', '#e8d84a', '#ff8a3d', '#6ec8ff', '#c9a8ff', '#ff3fa0', '#4b6bff'];

// 번지는 빛 (앤드류 작품 → 코드): 가로로 번지는 색 띠들. 띠마다 제 속도로 옆으로 흐르고 색이 옆 색으로 천천히 바뀌어요.
// 작게(폭 64) 부드러운 띠를 그린 뒤 키워서 번지게 해요 (캔버스 블러 없이 → 아이폰에서도 같은 모양, 매 장면 그려도 가벼움)
// t = 초(0이면 멈춘 그림). shift(0~1) = 9:16 원본에서 장마다 보이는 부분이 아래로 옮겨가요
const mix = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; };
const bandCache = new Map();
function bandsOf(seed) {
  if (bandCache.has(seed)) return bandCache.get(seed);
  const r = rng(seed), n = 16 + Math.floor(r() * 6), out = [];
  for (let i = 0; i < n; i++) out.push({
    y: (i + r() * .8) / n, x: r(), rx: .35 + r() * .75, ry: .025 + r() * .045, a: .75 + r() * .25,
    c1: Math.floor(r() * PAL.length), c2: Math.floor(r() * PAL.length), ph: r() * 6.28,
    v: (r() < .5 ? -1 : 1) * (.006 + r() * .016),   // 1초에 폭의 0.6~2.2%
  });
  bandCache.set(seed, out); return out;
}
const small = document.createElement('canvas');
export function drawCode(cv, seed, shift = 0, t = 0) {
  const W = cv.width, H = cv.height, c = cv.getContext('2d');
  const w = 64, full = Math.round(w * 16 / 9), h = Math.max(1, Math.round(w * H / W)), off = (full - h) * shift;
  small.width = w; small.height = h;
  const s = small.getContext('2d');
  s.fillStyle = '#c48bff'; s.fillRect(0, 0, w, h);
  for (const b of bandsOf(seed)) {
    const y = b.y * full - off, ry = b.ry * full * 2.2, rx = b.rx * w;
    if (y < -ry || y > h + ry) continue;
    const k = (Math.sin(t * .16 + b.ph) + 1) / 2, col = t ? mix(PAL[b.c1], PAL[b.c2], k * .8) : PAL[b.c1];
    const x0 = ((b.x + b.v * t) % 1 + 1) % 1 * w;
    for (const x of [x0 - w - rx, x0, x0 + w + rx]) {   // 옆으로 흘러 나간 띠는 반대쪽에서 들어와요
      s.save(); s.translate(x, y); s.scale(rx, ry);
      const g = s.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, col); g.addColorStop(.55, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      s.globalAlpha = b.a; s.fillStyle = g; s.beginPath(); s.arc(0, 0, 1, 0, 7); s.fill(); s.restore();
    }
  }
  s.globalAlpha = 1;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.drawImage(small, 0, 0, W, H);
  if (t) return;
  // 멈춘 그림(저장 · 쓰기 화면)에만 옅은 그레인
  const d = c.getImageData(0, 0, W, H), p = d.data, r = rng(seed ^ 7);
  for (let i = 0; i < p.length; i += 4) { const g = (r() - .5) * 12; p[i] += g; p[i + 1] += g; p[i + 2] += g; }
  c.putImageData(d, 0, 0);
}
