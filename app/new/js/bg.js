// 글포맷 배경: 무료(그라데이션·단색) / 유료 '배경'(작품 이미지·코드 배경). 딤은 배경마다 우리가 정해 둬요
// dim: [방식 all|center|bottom, 어두운 딤 색, 세기], ink = 딤 없이 쓰는 글색
// 무료 그라데이션 24개 (10-30): 모양 4가지 × 색 6계열(빨강 · 주황 · 연두 · 청록 · 파랑 · 보라)
// 하늘형(위 밝게 → 아래 진하게) · 빛 번짐(왼쪽 위에서 퍼짐) · 반사형(가운데 은은한 띠, 탁한 톤) · 파스텔(서로 다른 옅은 두 색)
// [이름, css, 딤 색(가장 어두운 색), 글색]
const refl = (d, m) => `linear-gradient(180deg,${d} 0%,${m} 50%,${d} 100%)`;
const G24 = [
  ['노을 하늘', 'linear-gradient(180deg,#FFB3A7 0%,#E5484D 55%,#5A1424 100%)', '#5A1424'], ['귤빛 저녁', 'linear-gradient(180deg,#FFD39B 0%,#F27A2E 55%,#5C2410 100%)', '#5C2410'],
  ['풀빛 아침', 'linear-gradient(180deg,#E9F5A8 0%,#7DBB42 55%,#1F4A1C 100%)', '#1F4A1C'], ['호수', 'linear-gradient(180deg,#B5F0E4 0%,#1FA39A 55%,#0B3B3C 100%)', '#0B3B3C'],
  ['깊은 바다', 'linear-gradient(180deg,#A9D2FF 0%,#2F6BE0 55%,#0E1F55 100%)', '#0E1F55'], ['보랏빛 밤', 'linear-gradient(180deg,#D9C2FF 0%,#7B4BD6 55%,#26124F 100%)', '#26124F'],
  ['장미 빛', 'radial-gradient(120% 90% at 0% 0%,#FFC9A8 0%,#F0607A 38%,#3B0E2A 100%)', '#3B0E2A'], ['모닥불', 'radial-gradient(120% 90% at 0% 0%,#FFE7A0 0%,#FF8A3D 35%,#2A1240 100%)', '#2A1240'],
  ['햇살 숲', 'radial-gradient(120% 90% at 0% 0%,#FFF3B0 0%,#9BCB4E 38%,#123A2E 100%)', '#123A2E'], ['물빛', 'radial-gradient(120% 90% at 0% 0%,#FFE1C7 0%,#2BB3A6 40%,#0A2540 100%)', '#0A2540'],
  ['새벽 빛', 'radial-gradient(120% 90% at 0% 0%,#FFD6E8 0%,#4D7CF0 40%,#0B1236 100%)', '#0B1236'], ['오로라', 'radial-gradient(120% 90% at 0% 0%,#B8FFD9 0%,#8A5BE8 42%,#1A0B38 100%)', '#1A0B38'],
  ['버건디', refl('#3A1820', '#8C4A52'), '#3A1820'], ['흙빛', refl('#33241A', '#8A6A50'), '#33241A'], ['올리브', refl('#262A18', '#737A4E'), '#262A18'],
  ['먹빛 청록', refl('#14272A', '#4F7A78'), '#14272A'], ['남회색', refl('#1A2030', '#5E6C86'), '#1A2030'], ['자두', refl('#2A1A2E', '#7A5A80'), '#2A1A2E'],
  ['분홍 하늘', 'linear-gradient(160deg,#FFC6D9 0%,#A9D4FF 100%)', '#6A7A9A', '#2A2230'], ['레몬 민트', 'linear-gradient(160deg,#FFF1A1 0%,#9EE6CF 100%)', '#5A7A6A', '#22302A'],
  ['라일락 복숭아', 'linear-gradient(160deg,#D2B8FF 0%,#FFC7A6 100%)', '#7A6A8A', '#2A2230'], ['살구 라벤더', 'linear-gradient(160deg,#FFC59A 0%,#BFB3F2 100%)', '#7A6A8A', '#2A2230'],
  ['민트 연분홍', 'linear-gradient(160deg,#A6EAD9 0%,#FFC2D1 100%)', '#6A7A7A', '#22302A'], ['하늘 연노랑', 'linear-gradient(160deg,#9FCBFF 0%,#FFF0A8 100%)', '#6A7A8A', '#1E2A3A'],
];
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
const SOLIDS = [['#F3EADB', '#2A2018'], ['#CFE2C4', '#1E2A20'], ['#C9DDF4', '#13243A'], ['#D9A441', '#2A1E08'], ['#9A4530', '#FFF4EC'], ['#DE939C', '#2A1218'],
  ['#256662', '#F0FFFC'], ['#173832', '#E8F3EE'], ['#131B32', '#E6ECFF'], ['#3A2240', '#F7E9F3'], ['#1C1C1E', '#F2F0EC']];
// 배경 이름: 고를 때 위 가운데에 "종류 · 이름"으로 잠깐 떠요 (언어마다 그 나라 말로, 18글자 안쪽)
const S_NAMES = ['크림', '연두', '하늘', '겨자', '벽돌', '장미', '청록', '숲', '밤하늘', '자두', '먹색'];
export const KIND = { g: '그라데이션', s: '솔리드' };
export const FREE = [
  ...G24.map(([name, css, deep, ink], i) => ({ id: 'g' + (i + 1), name, kind: 'g', css, tone: css.match(/#[0-9A-F]{6}/gi)[1] || deep, ink: ink || '#fff', dim: ['all', rgb(deep), ink ? 0 : .3] })),   // 파스텔은 단색처럼 덮지 않고 어두운 글
  ...SOLIDS.map(([bg, ink], i) => ({ id: 's' + (i + 1), name: S_NAMES[i], kind: 's', css: bg, tone: bg, ink, dim: ['all', '0,0,0', 0] })),
];

export const PAID = [
  { id: 'haze', img: './bg/haze.webp', tone: '#2f6b55', ink: '#F3ECE0', dim: ['all', '10,30,22', .55] },
  { id: 'stars', img: './bg/stars.webp', tone: '#3a3f7a', ink: '#F3E6C8', dim: ['center', '0,0,0', .55] },
  { id: 'bands', code: 'bands', tone: '#a35cff', ink: '#fff', dim: ['center', '40,16,70', .55] },
  { id: 'slit', code: 'slit', tone: '#F07F3C', ink: '#fff', dim: ['all', '10,8,14', 0] },
  { id: 'fold', code: 'fold', tone: '#3A80F8', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 크롬 폴드 (129차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'swarm', code: 'swarm', tone: '#40F0D0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 스웜 (128차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'dotw', code: 'dotw', tone: '#3A50F0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 도트 웨이브 (127차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'cloud', code: 'cloud', tone: '#1868F0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 클라우드 텍스처 (126차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'float', code: 'float', tone: '#8EE0D0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 플로팅 셰이프 (125차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'liquid', code: 'liquid', tone: '#D8282A', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 리퀴드 (124차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'field', code: 'field', tone: '#1430E0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 컬러 필드 (123차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'lens', code: 'lens', tone: '#8CF08C', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 웨이브 렌즈 (122차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'blob', code: 'blob', tone: '#E0C040', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 컬러 블롭 (120차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'city', code: 'city', tone: '#FFD640', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 3D 시티 (118차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'spec', code: 'spec', tone: '#E040C0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 스펙트럼 커브 (117차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'wint', code: 'wint', tone: '#7A4BF0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 웨이브 인터퍼런스 (116차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'bmod', code: 'bmod', tone: '#E3A82B', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 블록 모더니즘 (114차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'ccomp', code: 'ccomp', tone: '#E4572E', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 큐브 컴포지션 (113차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'cube', code: 'cube', tone: '#5BC4BE', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 미니멀 큐브 (111차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'gband', code: 'gband', tone: '#FF3D7F', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 그라데이션 밴드 (110차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'retro', code: 'retro', tone: '#2FE0B4', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 레트로 픽셀 (109차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'pixel', code: 'pixel', tone: '#DCCB2A', ink: '#1E1B18', dim: ['center', '0,0,0', 0] },   // 픽셀 체커 (105차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'fractal', code: 'fractal', tone: '#1F6F99', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 프랙탈 패턴 (107차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'plasma', code: 'plasma', tone: '#0A6E8C', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 플라즈마 (106차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'mesh', code: 'mesh', tone: '#A8F03C', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 네온 메시 (104차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'eclipse', code: 'eclipse', tone: '#6E3A44', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 이클립스 링 (103차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'tunnel', code: 'tunnel', tone: '#2A1F7A', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 라이트 터널 (101차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'neon', code: 'neon', tone: '#6A3DFF', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 네온 플로우 (100차): 글자색은 바탕 밝기로 (formats.js)
  { id: 'swirl', code: 'swirl', tone: '#93CBE0', ink: '#fff', dim: ['center', '0,0,0', 0] },   // 라이트 스월 (99차): 글자색 · 막은 바탕 밝기로 (formats.js)   // 슬릿스캔: 딤 · 글자색은 띠 밝기로 (formats.js slitLayer)
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

// 번지는 빛 (앤드류 작품 → 코드): 세로 오로라 · 프리즘. 빛줄기 6~9개가 위에서 아래로 흐르고, 가운데는 하얗게, 가장자리는 무지개색으로 갈라져요.
// 그래픽 칩(WebGL)이 점마다 계산해서 원래 해상도로 선명하고, 화면 속도대로 매끄럽게 움직여요. 셰이더가 하나라 모든 카드가 같이 써요
// (그린 뒤 카드의 캔버스로 옮겨 그려요). WebGL이 없는 기기는 같은 계산을 작게 해서 키워 그려요.
// 9:16 원본에서 카드(4:5)만큼 잘라 보여 주고, shift(0~1)로 장마다 아래로 옮겨가요. t = 초(0이면 멈춘 그림)
const MAXR = 9;
const paramCache = new Map();
function auroraOf(seed) {
  if (paramCache.has(seed)) return paramCache.get(seed);
  const r = rng(seed), n = 6 + Math.floor(r() * 4), R = [];
  for (let i = 0; i < n; i++) R.push([
    (i + .5) / n + (r() - .5) * .5 / n,   // 가로 자리 (고르게 펼치고 조금씩 어긋나게)
    .05 + r() * .06,                       // 굵기
    .02 + r() * .045,                      // 휘는 정도
    .5 + r() * 1.1,                        // 휘는 횟수
    r() * 6.283,                           // 시작 위상
    r(),                                   // 색 시작(무지개 위치)
    (.18 + r() * .3) * (r() < .5 ? -1 : 1),   // 일렁이는 속도
    .55 + r() * .45,                       // 밝기
  ]);
  const p = { n, R, base: r() };
  paramCache.set(seed, p); return p;
}
const GLSL = `precision highp float;
uniform vec2 uRes; uniform float uFull, uOff, uT, uBase, uGrain; uniform int uN; uniform float uR[${MAXR * 8}];
vec3 hue(float h) { return clamp(abs(mod(h * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.); }
// 정밀도가 낮은 휴대폰 칩에서도 고르게: sin 없이 좌표를 섞는 해시 (Dave Hoskins hash12)
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 f = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float x = f.x / uRes.x, y = (f.y + uOff) / uFull;
  vec3 top = mix(vec3(.16, .10, .26), vec3(.12, .14, .30), uBase), bot = mix(vec3(.02, .13, .09), vec3(.03, .07, .16), uBase);
  vec3 c = vec3(0.);
  for (int i = 0; i < ${MAXR}; i++) {
    if (i >= uN) break;
    float x0 = uR[i * 8], w = uR[i * 8 + 1], amp = uR[i * 8 + 2], fr = uR[i * 8 + 3], ph = uR[i * 8 + 4], h0 = uR[i * 8 + 5], sp = uR[i * 8 + 6], br = uR[i * 8 + 7];
    float cx = x0 + amp * sin(y * fr * 6.283 + ph + uT * sp) + .015 * sin(y * 9. + ph * 2. + uT * sp * 1.7);
    float d = (x - cx) / w;
    float glow = exp(-d * d * 1.6), core = exp(-d * d * 14.);
    float along = .55 + .45 * sin(y * 2.4 + ph * 3. - uT * .22 * sign(sp));   // 줄기를 따라 밝아졌다 흐려졌다
    vec3 pr = hue(h0 + d * .18 + y * .35 - uT * .025);                     // 프리즘: 가장자리로 갈수록 색이 갈라지고, 색이 줄기를 따라 흘러요
    c += (pr * glow * .85 + vec3(1.) * core * .55) * along * br;
  }
  vec3 col = mix(top, bot, smoothstep(.15, 1., y)) + (1. - exp(-c * 1.15));
  // 필름 그레인: 화면 한 픽셀에 점 하나, 밝기만 흔들어요. 정수 해시라 기기마다 무늬가 생기지 않아요. 어두운 곳에서 조금 더
  if (uGrain > 0.) {
    float n = (grain(f) + grain(f + vec2(37., 91.)) - 1.), lum = dot(col, vec3(.3, .55, .15));
    col += n * uGrain * (1. - .6 * smoothstep(.15, .9, lum));
  }
  gl_FragColor = vec4(col, 1.);
}`;
let G = null;
function gl() {
  if (G !== null) return G;
  G = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!g) return G;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uFull', 'uOff', 'uT', 'uBase', 'uN', 'uR', 'uGrain'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    G = { cv, g, u };
  } catch (e) { console.warn('aurora gl', e); G = false; }
  return G;
}
// WebGL이 없을 때: 같은 계산을 작게(폭 96) 해서 두 번에 나눠 키워요
const hueJS = h => [0, 4, 2].map(o => Math.min(1, Math.max(0, Math.abs(((h * 6 + o) % 6 + 6) % 6 - 3) - 1)));
function cpu(cv, P, off, full, t) {
  const W = cv.width, H = cv.height, w = 96, h = Math.max(1, Math.round(w * H / W)), k = w / W;
  const sm = document.createElement('canvas'); sm.width = w; sm.height = h;
  const sc = sm.getContext('2d'), im = sc.createImageData(w, h), px = im.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = i / w, y = (j / k + off) / full, top = [.16, .10, .26], bot = [.02, .13, .09], m = Math.min(1, Math.max(0, (y - .15) / .85)), mm = m * m * (3 - 2 * m);
    const c = [0, 0, 0];
    for (const [x0, wd, amp, fr, ph, h0, sp, br] of P.R) {
      const cx = x0 + amp * Math.sin(y * fr * 6.283 + ph + t * sp) + .015 * Math.sin(y * 9 + ph * 2 + t * sp * 1.7), d = (x - cx) / wd;
      const glow = Math.exp(-d * d * 1.6), core = Math.exp(-d * d * 14), along = .55 + .45 * Math.sin(y * 2.4 + ph * 3 - t * .22 * Math.sign(sp)), pr = hueJS(h0 + d * .18 + y * .35 - t * .025);
      for (let q = 0; q < 3; q++) c[q] += (pr[q] * glow * .85 + core * .55) * along * br;
    }
    const o = (j * w + i) * 4;
    for (let q = 0; q < 3; q++) px[o + q] = 255 * (top[q] + (bot[q] - top[q]) * mm + 1 - Math.exp(-c[q] * 1.15));
    px[o + 3] = 255;
  }
  sc.putImageData(im, 0, 0);
  const mid = document.createElement('canvas'); mid.width = w * 3; mid.height = h * 3;
  const mc = mid.getContext('2d'); mc.imageSmoothingQuality = 'high'; mc.drawImage(sm, 0, 0, mid.width, mid.height);
  const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(mid, 0, 0, W, H);
}

// 슬릿스캔 (11-20, 앤드류 레퍼런스: 슬릿스캔 가로 띠 풍경 → 코드). 가는 띠 많이 + 굵은 띠 가끔, 띠마다 가로로 살짝 번진 색.
// 색 묶음 5개(노을 · 붉은 저녁 · 황금빛 · 새벽 · 밤 바다) = 씨앗 % 5. 같은 씨앗이면 늘 같은 그림.
// 9:16 원본을 한 번 그려 두고(그레인까지) 카드만큼 잘라 보여 줘요. 모션 = 원본을 아주 조금 당겼다 놓는 숨 (t=0이면 정확히 멈춘 그림)
const Z = (s, e, cols, acc, ar) => [s, e, cols, acc || null, ar || 0];
export const SLIT_PAL = [
  ['노을', [
    Z(0, .10, ['#011A12', '#03221A', '#021A0C']),
    Z(.10, .25, ['#03424F', '#06506E', '#04302C', '#05342F'], '#0B5C78', .25),
    Z(.25, .46, ['#0670B2', '#0A7DBE', '#2B84BF', '#3487B8'], '#5A9CCB', .2),
    Z(.46, .51, ['#6E87B0', '#929AB3', '#8B8BAB'], '#F7A07E', .45),
    Z(.51, .55, ['#FFCB87', '#FFC27E', '#FEAB59']),
    Z(.55, .635, ['#FA7347', '#E5543F', '#FF6F43', '#FF693B', '#F25C2C'], '#FFD631', .25),
    Z(.635, .66, ['#7A2F1D', '#61463B', '#817D7A', '#6A737E']),
    Z(.66, .672, ['#050406']),
    Z(.672, .69, ['#3498CB', '#2E8CC4'], '#5FB0DD', .3),
    Z(.69, .775, ['#0B0503', '#1E0C05', '#2E160A', '#3A2410']),
    Z(.775, .885, ['#6A5A28', '#8E8040', '#A59C68', '#9A8C50', '#7C6E30']),
    Z(.885, 1, ['#2A3418', '#0E1A0E', '#2F3B1C', '#08120A', '#162214'], '#55602E', .3),
  ]],
  ['붉은 저녁', [
    Z(0, .10, ['#14061C', '#1C0A26', '#120418']),
    Z(.10, .25, ['#2A1446', '#341C5E', '#22103A'], '#4A2C7A', .25),
    Z(.25, .46, ['#3B2C8E', '#4A3AA6', '#5B48B0', '#6A50B4'], '#8A70D0', .2),
    Z(.46, .51, ['#9A6AA8', '#B07AA6', '#A0709E'], '#FF8AA0', .45),
    Z(.51, .55, ['#FFB0A0', '#FFA08C', '#FF8A78']),
    Z(.55, .635, ['#F0485A', '#D8304A', '#FF5A5A', '#E83E50', '#C82848'], '#FFC060', .25),
    Z(.635, .66, ['#6A1A2A', '#4E2A34', '#6E5A66', '#5A5266']),
    Z(.66, .672, ['#060306']),
    Z(.672, .69, ['#C04A8A', '#A83E7C'], '#F07AB0', .3),
    Z(.69, .775, ['#0A0408', '#1C0A12', '#2C1018', '#3A1A1E']),
    Z(.775, .885, ['#5A3A3A', '#7A5048', '#9A6C5C', '#84584C', '#6A4640']),
    Z(.885, 1, ['#2A1A22', '#120A10', '#30202A', '#0A0608', '#1A1018'], '#5A3A48', .3),
  ]],
  ['황금빛', [
    Z(0, .10, ['#0A1A16', '#0E2420', '#081610']),
    Z(.10, .25, ['#0E4A4A', '#145A58', '#0C3A36'], '#1C6E6A', .25),
    Z(.25, .46, ['#178A8A', '#1E9A94', '#3AA49A', '#4AA898'], '#70C0B0', .2),
    Z(.46, .51, ['#8AA88A', '#A8B48A', '#9CA884'], '#FFD27A', .45),
    Z(.51, .55, ['#FFE08A', '#FFD470', '#FFC24E']),
    Z(.55, .635, ['#FFAA2E', '#F0901E', '#FFB840', '#F89A24', '#E07C14'], '#FFF0A0', .25),
    Z(.635, .66, ['#7A4A12', '#5E4A2E', '#7E786A', '#6A6E66']),
    Z(.66, .672, ['#060504']),
    Z(.672, .69, ['#2AA8A0', '#209890'], '#60D0C4', .3),
    Z(.69, .775, ['#0C0804', '#1E1206', '#30200C', '#3E2C12']),
    Z(.775, .885, ['#6E6020', '#948634', '#B0A456', '#A09444', '#827426']),
    Z(.885, 1, ['#2C3214', '#10180A', '#323A18', '#0A1006', '#1A2210'], '#5C6428', .3),
  ]],
  ['새벽', [
    Z(0, .10, ['#0A0E24', '#10162E', '#080C1E']),
    Z(.10, .25, ['#1E2A58', '#26366E', '#18224A'], '#34488A', .25),
    Z(.25, .46, ['#3A5AAE', '#4A6CC0', '#6A80C8', '#7C8CCC'], '#9AAAE0', .2),
    Z(.46, .51, ['#A49AC8', '#B8A6CC', '#AA9CC4'], '#FFB4C8', .45),
    Z(.51, .55, ['#FFD4D8', '#FFC6CC', '#FFB0BC']),
    Z(.55, .635, ['#F58AA8', '#E0708E', '#FF9AB0', '#EA7C98', '#D46484'], '#FFE0B0', .25),
    Z(.635, .66, ['#6A3A52', '#5A4A5E', '#7E7A88', '#6A7084']),
    Z(.66, .672, ['#05050A']),
    Z(.672, .69, ['#6A8AD8', '#5A7ACA'], '#A0B8F0', .3),
    Z(.69, .775, ['#08080E', '#141420', '#20202E', '#2C2C3C']),
    Z(.775, .885, ['#4E5468', '#6A7084', '#8A90A2', '#7A8094', '#5E6478']),
    Z(.885, 1, ['#1E2230', '#0C0E16', '#242838', '#08080E', '#141826'], '#3E4660', .3),
  ]],
  ['밤 바다', [
    Z(0, .10, ['#02060E', '#040A16', '#02040A']),
    Z(.10, .25, ['#081E3A', '#0C2A50', '#061830'], '#12386A', .25),
    Z(.25, .46, ['#0E3E7E', '#144A92', '#1E5298', '#24589C'], '#3A70B4', .2),
    Z(.46, .51, ['#3A5480', '#4A5C84', '#40527A'], '#FF8A6A', .45),
    Z(.51, .55, ['#FF9A6E', '#F27A5A', '#D85E4A']),
    Z(.55, .635, ['#8A2E46', '#6A2440', '#9A3A4E', '#7A2A44', '#5A1E3A'], '#FFB070', .25),
    Z(.635, .66, ['#2A1428', '#2A2434', '#3E4256', '#36405A']),
    Z(.66, .672, ['#020204']),
    Z(.672, .69, ['#1E7AC0', '#186CB0'], '#4AA4E0', .3),
    Z(.69, .775, ['#030812', '#06101E', '#0A182C', '#0E2038']),
    Z(.775, .885, ['#163A5E', '#1E4A74', '#2A5A84', '#22507A', '#183E64']),
    Z(.885, 1, ['#0A1A2C', '#040C16', '#0E2034', '#02060C', '#081424'], '#24486E', .3),
  ]],
];
export const slitPal = seed => ((seed >>> 0) || 1) % SLIT_PAL.length;
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mx = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const cl = c => c.map(v => Math.round(Math.max(0, Math.min(255, v))));
const lumOf = c => (.2126 * c[0] + .7152 * c[1] + .0722 * c[2]) / 255;
const bandCache = new Map();
// 띠 목록 (0~1, 원본 9:16 세로 기준): [위, 높이, 색, 가로 음영]. v2 (11-20 89차, 앤드류 레퍼런스에 가깝게): 구간 구조 그대로, 선명한 띠, 가는 밝은 선
function slitBands(seed) {
  if (bandCache.has(seed)) return bandCache.get(seed);
  const r = rng(seed ^ 0x2c1b3c6d), zones = SLIT_PAL[slitPal(seed)][1], out = [];
  // 4:5 카드(원본 9:16의 가운데 70%)에 구조가 다 보이게 .1~.9로 모으고, 위아래 남는 곳은 첫 · 끝 구간 색. 경계는 셔플마다 조금씩
  const edges = zones.map(z => z[0]).concat(1).map((e, i, a) => .1 + .8 * (i === 0 || i === a.length - 1 ? e : e + (r() - .5) * .022));
  edges[0] = 0; edges[edges.length - 1] = 1;
  zones.forEach(([, , cols, acc, ar], zi) => {
    const s0 = edges[zi], e = edges[zi + 1], P = cols.map(hx);
    let y = s0;
    while (y < e - 1e-4) {
      const k = r(), thin = acc && r() < ar;
      let h = thin ? .0012 + r() * .0025 : k < .55 ? .0015 + r() * .005 : k < .88 ? .006 + r() * .014 : .018 + r() * .03;
      h = Math.min(h, e - y);
      const t = (y - s0) / Math.max(1e-6, e - s0), x = Math.min(.9999, Math.max(0, t + (r() - .5) * .35)) * (P.length - 1), i = Math.floor(x);
      let c = P.length > 1 ? mx(P[i], P[Math.min(P.length - 1, i + 1)], x - i) : P[0];
      c = thin ? mx(hx(acc), c, r() * .25) : c.map(v => v * (1 + (r() - .5) * .1));
      out.push([y, h, cl(c), (r() - .5) * .08]);
      y += h;
    }
  });
  if (bandCache.size > 40) bandCache.delete(bandCache.keys().next().value);
  bandCache.set(seed, out); return out;
}
// 원본 세로 a~b(0~1) 사이의 평균 밝기 → 글자색 고르기에 써요 (그리기 전에도 알 수 있게 띠 목록으로 계산)
export function slitLum(seed, a, b) {
  let s = 0, n = 0;
  for (const [y, h, c] of slitBands(seed)) { const o = Math.min(b, y + h) - Math.max(a, y); if (o > 0) { s += o * lumOf(c); n += o; } }
  return n ? s / n : .5;
}
const slitImgs = new Map();
function slitImg(seed, W, gr) {
  const key = seed + '|' + W + '|' + gr;
  if (slitImgs.has(key)) { const v = slitImgs.get(key); slitImgs.delete(key); slitImgs.set(key, v); return v; }
  const H = Math.round(W * 16 / 9), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (const [y, h, c, sh] of slitBands(seed)) {   // 띠 안은 거의 한 색 (가로로 아주 옅은 음영만), 경계는 선명하게
    const gr2 = g.createLinearGradient(0, 0, W, 0);
    gr2.addColorStop(0, `rgb(${cl(c.map(v => v * (1 - sh)))})`); gr2.addColorStop(1, `rgb(${cl(c.map(v => v * (1 + sh)))})`);
    g.fillStyle = gr2; g.fillRect(0, Math.floor(y * H), W, Math.ceil(h * H) + 1);
  }
  if (gr > 0) {   // 필름 그레인 아주 약하게: 밝기만 흔들어요
    const id = g.getImageData(0, 0, W, H), d = id.data, rr = rng(seed ^ 0x51ed27), a = gr * 200;
    for (let i = 0; i < d.length; i += 4) { const n = (rr() - .5) * a; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
  }
  slitImgs.set(key, cv);
  while (slitImgs.size > 4) slitImgs.delete(slitImgs.keys().next().value);   // 큰 그림이라 4장만 기억해요
  return cv;
}
// 띠마다 흐르는 빛 (11-20 88차, 앤드류 "더 강하게"): 띠의 60%에 밝은 자리가 하나씩, 띠마다 다른 속도 · 방향으로 옆으로 흘러요
const sweepCache = new Map();
function slitSweeps(seed) {
  if (sweepCache.has(seed)) return sweepCache.get(seed);
  const r = rng(seed ^ 0x7a3d91), out = [];
  for (const [y, h] of slitBands(seed)) {
    if (r() > .6) continue;
    out.push([y, h, (.035 + r() * .09) * (r() < .5 ? -1 : 1), r() * 1.6, .18 + r() * .3, (.16 + r() * .26) * .6]);   // 89차 뒤 앤드류 '조금 과해요' → 속도 70% · 밝기 60%   // 위, 높이, 속도(폭/초), 시작, 빛 폭, 세기
  }
  if (sweepCache.size > 40) sweepCache.delete(sweepCache.keys().next().value);
  sweepCache.set(seed, out); return out;
}
function drawSlit(cv, seed, shift, t, grainAmt) {
  const W = cv.width, H = cv.height, src = slitImg(seed, W, grainAmt), full = src.height, g = cv.getContext('2d');
  const off = Math.max(0, full - H) * shift;
  const e = t > 0 ? (x => x * x * (3 - 2 * x))(Math.min(1, t / 2.5)) : 0;   // 처음 2.5초에 천천히 시작 (t=0이면 정확히 멈춘 그림)
  const vis = Math.min(full, H), sh = vis * (1 - .08 * e);   // 8% 당겨 두고 그 안에서 위아래로 흘러요
  const room = full - sh, mid = Math.min(room, Math.max(0, off + (vis - sh) / 2));
  const sy = Math.max(0, Math.min(room, mid + Math.min(mid, room - mid, vis * .06) * Math.sin(t * .32) * e));
  g.drawImage(src, 0, sy, W, sh, 0, 0, W, H);
  if (!e) return;
  const k = H / sh;
  g.save(); g.globalCompositeOperation = 'screen';
  for (const [y, h, sp, ph, w, a] of slitSweeps(seed)) {
    const y0 = (y * full - sy) * k, hh = h * full * k; if (y0 > H || y0 + hh < 0) continue;
    const cx = (((ph + sp * t) % 1.6 + 1.6) % 1.6 - .3) * W, ww = w * W;
    const gr = g.createLinearGradient(cx - ww, 0, cx + ww, 0);
    gr.addColorStop(0, 'rgba(255,240,220,0)'); gr.addColorStop(.5, `rgba(255,240,220,${(a * e).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,240,220,0)');
    g.fillStyle = gr; g.fillRect(cx - ww, y0, ww * 2, hh + 1);
  }
  g.restore();
}
// 라이트 스월 (11-25 99차, 앤드류 레퍼런스(셰이더 그림)의 느낌만 · 코드는 새로 작성). 연한~어두운 바탕 위 가운데 흐린 빛,
// 겹겹 원 위 반짝임(도는 방향으로 살짝 늘어진 빛)이 천천히 돌고, 가운데서 부드러운 물결 고리(파장)가 번져 나가요.
// 색 20가지 = 연한 · 중간 · 선명한 · 어두운 4단계 × 5. 칩으로 고르면(pb.pal) 고정, 아니면 씨앗 % 20.
// 셔플 = 겹 수(3~7) · 반짝임 자리 · 감김 · 도는 방향 · 파장 간격 · 나선 물결(0~3갈래). t = 초(0이면 멈춘 그림)
export const SWIRL_PAL = [
  ['하늘', '#93CBE0', '#D6F7FF'], ['분홍', '#EDBCCB', '#FFE3EC'], ['라벤더', '#BFB8EA', '#EEEAFF'], ['민트', '#A9DEC9', '#E0FFF1'], ['복숭아', '#F2C6AA', '#FFE9D9'],
  ['코발트', '#4F78D6', '#BFD3FF'], ['산호', '#EC7C6A', '#FFD2C6'], ['보라', '#8A63D2', '#DCCBFF'], ['청록', '#2FA3A0', '#BDF5F0'], ['겨자', '#D9A93A', '#FFEBB5'],
  ['파랑', '#1E4BFF', '#9FD8FF'], ['빨강', '#F2210C', '#FFC08A'], ['연두', '#6CC81A', '#F4FFB0'], ['자홍', '#F01E9E', '#FFB3EC'], ['주황', '#FF7A00', '#FFE08A'],
  ['남색', '#0E1A44', '#3FA9FF'], ['검보라', '#24103D', '#B65CFF'], ['짙은 초록', '#0B2B22', '#3DE8A6'], ['검정', '#070708', '#8FE3FF'], ['와인', '#3A0B19', '#FF5F8A'],
];
export const swirlPal = (seed, pal) => pal != null && SWIRL_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % SWIRL_PAL.length;
const hx3 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
export const swirlLight = (seed, pal) => { const [r, g, b] = hx3(SWIRL_PAL[swirlPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .55; };
const swirlCache = new Map();
function swirlOf(seed) {
  if (swirlCache.has(seed)) return swirlCache.get(seed);
  const r = rng(seed ^ 0x5a17c3), rings = 3 + Math.floor(r() * 5), dir = r() < .5 ? -1 : 1, tw = .2 + r() * 1.1, wf = 14 + r() * 30, a = r();
  const p = { rings, dir, tw, wf, arm: a < .55 ? 0 : a < .75 ? 1 : a < .9 ? 2 : 3, wa: wf > 36 ? .14 : .17, s: (seed >>> 0) % 97 };
  if (swirlCache.size > 60) swirlCache.delete(swirlCache.keys().next().value);
  swirlCache.set(seed, p); return p;
}
const SW_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uS, uRings, uDir, uTw, uWf, uWa, uArm, uGrain; uniform vec3 uBase, uGlow;
float h(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7)) + uS * 1.37) * 43758.5453); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / max(uRes.x * 1.25, uRes.y); float r = length(uv), th = atan(uv.y, uv.x);
  float lum = dot(uBase, vec3(.2126, .7152, .0722)), kk = 1. - .45 * smoothstep(.45, .8, lum);
  vec3 c = uBase * (1. - .2 * r) + uGlow * .55 * kk * exp(-r * r * 9.);
  float wv = sin(r * uWf - uT * 1.1 + th * uArm + sin(th * 3. + uS) * .4), wave = pow(.5 + .5 * wv, 3.) * smoothstep(.9, .05, r) * smoothstep(0., .12, r);   // 파장
  c += uGlow * uWa * wave * kk + vec3(1.) * uWa * .12 * pow(.5 + .5 * wv, 12.) * smoothstep(.8, .1, r) * kk;
  float L = 0.;
  for (int k = 0; k < 7; k++) { float fk = float(k); if (fk >= uRings) break;
    float rk = .07 + fk * .085 + .02 * h(vec2(fk, 1.)), sp = uDir * .22 / (1. + fk * .35), ph = fk * uTw + h(vec2(fk, 2.)) * 6.283 + uT * sp, n = 3. + fk * 1.6;
    L += .05 * exp(-pow((r - rk) / .0016, 2.)) * smoothstep(.2, .9, h(vec2(floor((th + ph) * 3.), fk)));   // 가는 빛 줄
    for (int j = 0; j < 14; j++) { float fj = float(j); if (fj >= n) break;
      float on = h(vec2(fk, fj + 7.)); if (on < .25) continue;
      float a = fj / n * 6.2832 + ph + (h(vec2(fj, fk + 3.)) - .5) * .5, rr = rk * (1. + (h(vec2(fj, fk + 9.)) - .5) * .12);
      vec2 q = vec2(cos(a), sin(a)), d = uv - q * rr;
      float dt = dot(d, vec2(-q.y, q.x)), dr = dot(d, q), sz = .4 + on;
      L += sz * (exp(-(dt * dt / (.00028 * sz) + dr * dr / .000012)) * 1.1 + exp(-dot(d, d) / (.0016 * sz)) * .07);
    }
  }
  L = 1. - exp(-L * 1.4); c += (uGlow * .7 + .3) * L * .75 * kk;
  if (uGrain > 0.) c += (grain(gl_FragCoord.xy) + grain(gl_FragCoord.xy + vec2(37., 91.)) - 1.) * uGrain;
  gl_FragColor = vec4(pow(clamp(c, 0., 1.), vec3(.95)), 1.);
}`;
let SG = null;
function swGl() {
  if (SG !== null) return SG;
  SG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!g) return SG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, SW_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uS', 'uRings', 'uDir', 'uTw', 'uWf', 'uWa', 'uArm', 'uGrain', 'uBase', 'uGlow'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    SG = { cv, g, u };
  } catch (e) { console.warn('swirl gl', e); SG = false; }
  return SG;
}
// WebGL이 없을 때: 캔버스로 비슷하게 (바탕 · 가운데 빛 · 물결 고리 · 반짝임)
function swirlCpu(cv, P, pal, t) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d'), U = Math.max(W * 1.25, H), cx = W / 2, cy = H / 2, [, base, glow] = SWIRL_PAL[pal];
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35;
  let gr = g.createRadialGradient(cx, cy, 0, cx, cy, U * .45); gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalAlpha = .12; g.strokeStyle = glow; g.lineWidth = U * .03;
  const sp = 2 * Math.PI / P.wf, off = (t * 1.1 / P.wf) % sp;
  for (let rr = off; rr < .8; rr += sp) { g.beginPath(); g.arc(cx, cy, rr * U, 0, 7); g.stroke(); }
  const r = rng(P.s * 7919 + 1); g.globalAlpha = .7; g.fillStyle = '#fff';
  for (let k = 0; k < P.rings; k++) { const rk = .07 + k * .085, n = 3 + Math.floor(k * 1.6), ph = k * P.tw + r() * 6.283 + t * P.dir * .22 / (1 + k * .35);
    for (let j = 0; j < n; j++) { if (r() < .25) continue; const a = j / n * 6.283 + ph; g.save(); g.translate(cx + Math.cos(a) * rk * U, cy + Math.sin(a) * rk * U); g.rotate(a + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, U * .012, U * .0025, 0, 0, 7); g.fill(); g.restore(); } }
  g.restore();
}
function drawSwirl(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = swirlOf(seed), pal = swirlPal(seed, cv.dataset.pal), R = swGl();
  if (!R) return swirlCpu(cv, P, pal, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 720 / W) : 1, w = Math.round(W * k), h = Math.round(H * k);   // 움직일 땐 폭 720까지만 계산해서 키워요 (부드러운 빛이라 차이 없음)
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, t); g.uniform1f(u.uS, P.s); g.uniform1f(u.uRings, P.rings); g.uniform1f(u.uDir, P.dir); g.uniform1f(u.uTw, P.tw);
  g.uniform1f(u.uWf, P.wf); g.uniform1f(u.uWa, P.wa); g.uniform1f(u.uArm, P.arm); g.uniform1f(u.uGrain, grainAmt * .5);
  g.uniform3fv(u.uBase, hx3(SWIRL_PAL[pal][1])); g.uniform3fv(u.uGlow, hx3(SWIRL_PAL[pal][2]));
  g.drawArrays(g.TRIANGLES, 0, 3);
  cv.getContext('2d').drawImage(gc, 0, 0, W, H);
}
// 네온 플로우 (11-25 100차, 앤드류 레퍼런스(옵아트 캔버스)의 느낌만 · 코드는 새로 작성, 링 없음). 흐린 네온 덩어리 3~6개가
// 리사주 길(8자 · 타원 · 물결)을 따라 천천히 흐르며 지난 3~4초 자리를 부드러운 꼬리로 남겨요. 가운데는 글 자리로 덜 밝게.
// 색 묶음 10가지(어두운 바탕 8 · 연한 바탕 2). 칩으로 고르면(pb.pal) 고정, 아니면 씨앗 % 10. 한 바퀴 약 22초. t = 초(0이면 멈춘 그림)
export const NEON_PAL = [
  ['연두 · 보라', '#0B0B12', ['#B6FF2E', '#6A3DFF']], ['분홍 · 하늘', '#0D0A14', ['#FF4FB3', '#4FD8FF']], ['주황 · 파랑', '#0A0C16', ['#FF8A1F', '#2F5BFF']], ['민트 · 자홍', '#0A1210', ['#3DFFC2', '#FF2FA6']],
  ['노랑 · 빨강 · 보라', '#120A0C', ['#FFE14F', '#FF3B3B', '#8A3DFF']], ['하늘 · 보라 · 분홍', '#0A1030', ['#5FD0FF', '#9A5BFF', '#FF6FC8']], ['청록 · 주황', '#06141A', ['#18E0D0', '#FF9A3D']], ['흰빛 · 파랑', '#05060C', ['#E8F4FF', '#3F7BFF']],
  ['연한 분홍 · 파랑', '#F3EEE6', ['#FF5FA8', '#5B8CFF']], ['연한 민트 · 보라', '#EEF2EF', ['#2FD6A0', '#A05BFF']],
];
export const neonPal = (seed, pal) => pal != null && NEON_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % NEON_PAL.length;
export const neonLight = (seed, pal) => { const [r, g, b] = hx3(NEON_PAL[neonPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const neonCache = new Map();
function neonOf(seed) {
  if (neonCache.has(seed)) return neonCache.get(seed);
  const r = rng(seed ^ 0x3e0f1b), nb = 3 + Math.floor(r() * 4), p = { nb, sz: nb <= 3 ? .12 : nb >= 6 ? .07 : .09, pk: Math.floor(r() * 3), t0: 4 + r() * 18, s: (seed >>> 0) % 89 };
  if (neonCache.size > 60) neonCache.delete(neonCache.keys().next().value);
  neonCache.set(seed, p); return p;
}
const NE_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uS, uNb, uSz, uPk, uNc, uGrain; uniform vec3 uBg, uC0, uC1, uC2;
float h(float x) { return fract(sin(x * 78.233 + uS * 12.9898) * 43758.5453); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 path(float i, float t) {
  float a = 1. + floor(h(i + 1.) * 2.), bb = a + (uPk < .5 ? 1. : uPk < 1.5 ? 0. : 2.), w = 6.2832 / 22.;
  float ph = h(i + 3.) * 6.2832, ps = h(i + 5.) * 6.2832, rx = .34 + .12 * h(i + 7.), ry = .44 + .12 * h(i + 9.);
  return vec2(rx * sin(a * w * t + ph), ry * sin(bb * w * t * (1. + .08 * h(i + 11.)) + ps));
}
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / max(uRes.x * 1.25, uRes.y);
  vec3 acc = vec3(0.); float tot = 0.;
  for (int i = 0; i < 6; i++) { float fi = float(i); if (fi >= uNb) break;
    float k3 = mod(fi, uNc); vec3 col = k3 < .5 ? uC0 : k3 < 1.5 ? uC1 : uC2;
    float rad = uSz * (.75 + .5 * h(fi + 13.)), g = 0.;
    for (int k = 0; k < 28; k++) { float fk = float(k);   // 꼬리: 지난 자리 28번 (0.13초 간격)
      vec2 d = uv - path(fi, uT - fk * .13);
      g += pow(1. - fk / 28., 1.6) * exp(-dot(d, d) / (rad * rad * (1. + fk * .03)));
    }
    vec2 d0 = uv - path(fi, uT); g += 2.2 * exp(-dot(d0, d0) / (rad * rad * .45));   // 머리는 조금 또렷하게
    g /= 9.; acc += col * g; tot += g;
  }
  float r = length(uv * vec2(1.2, 1.)), keep = (.3 + .7 * smoothstep(.12, .42, r)) * .95;   // 가운데는 덜 (글 자리)
  acc *= keep; tot *= keep;
  vec3 c = dot(uBg, vec3(.2126, .7152, .0722)) < .4 ? uBg + (1. - exp(-acc * 1.6)) : mix(uBg, (acc / max(tot, 1e-3)) * .95, 1. - exp(-tot * 1.3));
  c *= 1. - .25 * smoothstep(.45, .95, length(uv));
  if (uGrain > 0.) c += (grain(gl_FragCoord.xy) + grain(gl_FragCoord.xy + vec2(37., 91.)) - 1.) * uGrain;
  gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
}`;
let NG = null;
function neGl() {
  if (NG !== null) return NG;
  NG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!g) return NG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, NE_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uS', 'uNb', 'uSz', 'uPk', 'uNc', 'uGrain', 'uBg', 'uC0', 'uC1', 'uC2'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    NG = { cv, g, u };
  } catch (e) { console.warn('neon gl', e); NG = false; }
  return NG;
}
// WebGL이 없을 때: 캔버스로 비슷하게 (덩어리 · 꼬리를 흐린 원으로)
function neonCpu(cv, P, pal, t) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d'), U = Math.max(W * 1.25, H), [, bg, cs] = NEON_PAL[pal], r = rng(P.s * 7919 + 3), light = neonLight(0, pal);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = light ? 'multiply' : 'lighter';
  for (let i = 0; i < P.nb; i++) {
    const a = 1 + Math.floor(r() * 2), b = a + [1, 0, 2][P.pk], ph = r() * 6.283, ps = r() * 6.283, rx = .34 + .12 * r(), ry = .44 + .12 * r(), w = 6.2832 / 22, col = cs[i % cs.length];
    for (let k = 9; k >= 0; k--) { const tt = P.t0 + t - k * .36, x = W / 2 + rx * Math.sin(a * w * tt + ph) * U, y = H / 2 - ry * Math.sin(b * w * tt + ps) * U, rad = P.sz * U * 1.6;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, light ? '#FFFFFF00' : '#00000000');
      g.globalAlpha = .1 * (1 - k / 10); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  }
  g.restore();
}
function drawNeon(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = neonOf(seed), pal = neonPal(seed, cv.dataset.pal), R = neGl();
  if (!R) return neonCpu(cv, P, pal, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 540 / W) : 1, w = Math.round(W * k), h = Math.round(H * k), cs = NEON_PAL[pal][2];   // 움직일 땐 폭 540까지만 (흐린 빛이라 차이 없음)
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, P.t0 + t); g.uniform1f(u.uS, P.s); g.uniform1f(u.uNb, P.nb); g.uniform1f(u.uSz, P.sz); g.uniform1f(u.uPk, P.pk); g.uniform1f(u.uNc, cs.length); g.uniform1f(u.uGrain, grainAmt * .5);
  g.uniform3fv(u.uBg, hx3(NEON_PAL[pal][1])); g.uniform3fv(u.uC0, hx3(cs[0])); g.uniform3fv(u.uC1, hx3(cs[1])); g.uniform3fv(u.uC2, hx3(cs[2] || cs[0]));
  g.drawArrays(g.TRIANGLES, 0, 3);
  cv.getContext('2d').drawImage(gc, 0, 0, W, H);
}
// 라이트 터널 (11-25 101차, 앤드류 레퍼런스(사진을 붙인 3D 터널)의 느낌만 · 사진 없이 코드로 새로 작성). 가운데 한 점에서 밖으로 뻗어 나오는 (102차 방향 바꿈)
// 가는 빛줄기 + 색 다른 큰 부채꼴 면 3~5개 + 별가루. 가운데는 빛줄기가 옅어지는 글 자리. 색 묶음 10가지(어두운 8 · 연한 2),
// 칩으로 고르면(pb.pal) 고정, 아니면 씨앗 % 10. 셔플 = 부채꼴 수 · 빛줄기 밀도 · 소실점(가운데/살짝 위) · 도는 방향. t = 초(0이면 멈춘 그림)
export const TUNNEL_PAL = [   // [이름, 바탕, 가운데 어둠, 면1, 면2, 빛줄기]
  ['남보라 · 빨강', '#2A1F7A', '#07051A', '#4B5BFF', '#E0283C', '#D6E4FF'], ['청록 · 파랑', '#0E3E6A', '#030B16', '#18C8D8', '#2F5BFF', '#DFFBFF'],
  ['자홍 · 주황', '#4A0E4A', '#12030F', '#FF2FA6', '#FF8A1F', '#FFE6F4'], ['초록 · 노랑', '#0E3A2A', '#03100A', '#2FE08A', '#E8FF4F', '#F2FFE0'],
  ['남색 · 금빛', '#101A44', '#03050F', '#3F7BFF', '#FFC24F', '#FFF4D6'], ['보라 · 민트', '#2A1050', '#08030F', '#9A5BFF', '#3DFFC2', '#EDE4FF'],
  ['빨강 · 분홍', '#3A0A14', '#0D0205', '#FF3B3B', '#FF8FC8', '#FFE4EC'], ['은빛', '#1A1D24', '#050608', '#8A96A8', '#E8EEF8', '#FFFFFF'],
  ['연한 하늘 · 분홍', '#E6EEFA', '#F7F9FD', '#8FB0FF', '#FF9CC2', '#5F78C8'], ['연한 살구 · 보라', '#F8ECE2', '#FDF8F4', '#FFB48A', '#B99BFF', '#B0705A'],
];
export const tunnelPal = (seed, pal) => pal != null && TUNNEL_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % TUNNEL_PAL.length;
export const tunnelLight = (seed, pal) => { const [r, g, b] = hx3(TUNNEL_PAL[tunnelPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const tunnelCache = new Map();
function tunnelOf(seed) {
  if (tunnelCache.has(seed)) return tunnelCache.get(seed);
  const r = rng(seed ^ 0x71c0de), p = { nf: 3 + Math.floor(r() * 3), den: .25 + r() * .45, vy: r() < .3 ? .1 : 0, rot: (r() < .5 ? -1 : 1) * .02, t0: r() * 30, s: (seed >>> 0) % 83 };
  if (tunnelCache.size > 60) tunnelCache.delete(tunnelCache.keys().next().value);
  tunnelCache.set(seed, p); return p;
}
const TU_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uS, uNf, uDen, uVy, uRot, uGrain; uniform vec3 uBg, uDk, uF0, uF1, uSk;
float h(float x) { return fract(sin(x * 78.233 + uS * 12.9898) * 43758.5453); }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uS * 3.1) * 43758.5453); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float ad(float a, float b) { return mod(a - b + 3.14159, 6.28318) - 3.14159; }
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / max(uRes.x * 1.25, uRes.y) - vec2(0., uVy);
  float r = length(uv), a = atan(uv.y, uv.x) + uT * uRot, lr = log(r + 1e-4), light = step(.5, dot(uBg, vec3(.2126, .7152, .0722)));
  float band = .5 + .5 * sin(a * 3. + h(1.) * 6.) * sin(a * 7. + h(2.) * 6.);
  vec3 c = mix(uDk, uBg, smoothstep(0., .45, r) * (.55 + .45 * band));
  for (int i = 0; i < 5; i++) { float fi = float(i); if (fi >= uNf) break;   // 큰 부채꼴 면
    float d = ad(a, h(fi + 10.) * 6.2832), w = .12 + .25 * h(fi + 20.);
    c = mix(c, mod(fi, 2.) < .5 ? uF0 : uF1, exp(-d * d / (w * w)) * smoothstep(.02, .35, r) * (.5 + .5 * h(fi + 30.)) * (light > .5 ? .5 : .75));
  }
  float N = 260., k = (a + 3.14159) / 6.28318 * N, ai = floor(k), af = fract(k);   // 가는 빛줄기: 칸마다 길이 · 속도 · 밝기, 밖으로 뻗어 나와요 (바깥 끝이 밝은 머리)
  float on = step(1. - uDen, h(ai + 40.)), sp = .25 + .5 * h(ai + 50.), ln = .25 + .6 * h(ai + 60.);
  float u = fract(lr * .9 - uT * sp * .35 + h(ai + 70.));   // 102차: 가운데서 밖으로 (내가 터널 안으로 들어가는 느낌, 밖으로 갈수록 빨라 보여요)
  float st = on * smoothstep(0., ln * .85, u) * (1. - smoothstep(ln - .04, ln, u)) * (1. - smoothstep(.15, .5, abs(af - .5))) * smoothstep(.1, .45, r) * (.35 + .65 * h(ai + 80.));
  vec2 g = vec2(floor((a + 3.14159) * 30.), floor(lr * 14. - uT * .5)), gf = vec2(fract((a + 3.14159) * 30.), fract(lr * 14. - uT * .5));   // 별가루
  float dust = step(.9, h2(g)) * exp(-dot(gf - .5, gf - .5) * 60.) * smoothstep(.02, .25, r);
  if (light > .5) c = mix(c, uSk, st * .55 + dust * .3); else c += uSk * (st * .42 + dust * .4);
  c = mix(c, uDk, (1. - smoothstep(0., .3, r)) * .35 * (1. - light));   // 가운데 글 자리는 조금 더 차분하게
  c *= 1. - .2 * smoothstep(.5, 1., r);
  if (uGrain > 0.) c += (grain(gl_FragCoord.xy) + grain(gl_FragCoord.xy + vec2(37., 91.)) - 1.) * uGrain;
  gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
}`;
let TG = null;
function tuGl() {
  if (TG !== null) return TG;
  TG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!g) return TG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, TU_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uS', 'uNf', 'uDen', 'uVy', 'uRot', 'uGrain', 'uBg', 'uDk', 'uF0', 'uF1', 'uSk'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    TG = { cv, g, u };
  } catch (e) { console.warn('tunnel gl', e); TG = false; }
  return TG;
}
// WebGL이 없을 때: 캔버스로 비슷하게 (바탕 · 부채꼴 · 빛줄기 선)
function tunnelCpu(cv, P, pal, t) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d'), U = Math.max(W * 1.25, H), cx = W / 2, cy = H / 2 - P.vy * U, [, bg, dk, f0, f1, sk] = TUNNEL_PAL[pal], r = rng(P.s * 7919 + 5);
  let gr = g.createRadialGradient(cx, cy, 0, cx, cy, U * .5); gr.addColorStop(0, dk); gr.addColorStop(1, bg); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = .5;
  for (let i = 0; i < P.nf; i++) { const a = r() * 6.283 + t * P.rot, w = .12 + .25 * r(); g.fillStyle = i % 2 ? f1 : f0; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, U, a - w, a + w); g.fill(); }
  g.globalAlpha = .35; g.strokeStyle = sk; g.lineWidth = Math.max(1, U * .002);
  for (let i = 0; i < 120 * P.den; i++) { const a = r() * 6.283 + t * P.rot, r0 = U * (.15 + r() * .5), r1 = r0 + U * (.05 + r() * .2); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); }
  g.restore();
}
function drawTunnel(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = tunnelOf(seed), pal = tunnelPal(seed, cv.dataset.pal), R = tuGl();
  if (!R) return tunnelCpu(cv, P, pal, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 720 / W) : 1, w = Math.round(W * k), h = Math.round(H * k), C = TUNNEL_PAL[pal];   // 움직일 땐 폭 720까지만
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, P.t0 + t); g.uniform1f(u.uS, P.s); g.uniform1f(u.uNf, P.nf); g.uniform1f(u.uDen, P.den); g.uniform1f(u.uVy, P.vy); g.uniform1f(u.uRot, P.rot); g.uniform1f(u.uGrain, grainAmt * .5);
  ['uBg', 'uDk', 'uF0', 'uF1', 'uSk'].forEach((n, i) => g.uniform3fv(u[n], hx3(C[i + 1])));
  g.drawArrays(g.TRIANGLES, 0, 3);
  cv.getContext('2d').drawImage(gc, 0, 0, W, H);
}
// 이클립스 링 (11-25 103차, 앤드류 레퍼런스(만화경 그림)의 느낌만 · 코드로 새로 작성). 가운데 크게 번진 빛의 고리 안에 어두운 원이 한쪽으로 비켜서
// 초승달처럼 (일식 느낌). 색 4가지가 고리를 따라 이어지고 아주 천천히 돌아요 (한 바퀴 약 40초), 두께는 숨 쉬듯 살짝. 글은 안쪽 원 가운데.
// 색 묶음 10가지(어두운 8 · 연한 2), 칩으로 고르면(pb.pal) 고정, 아니면 씨앗 % 10. 셔플 = 초승달 방향 · 굵기 · 고리 크기. t = 초(0이면 멈춘 그림)
export const ECLIPSE_PAL = [   // [이름, 바탕, 안쪽 원, 고리 색 4]
  ['장미 갈색 · 무지개', '#6E3A44', '#5A1A12', '#2A2AE8', '#D0107A', '#C89A40', '#30E070'], ['남색 · 청록', '#1C2440', '#0A0F22', '#19D3E0', '#3A6BFF', '#8A4BFF', '#1FE0A0'],
  ['보라 · 분홍', '#3A2350', '#1E0E30', '#FF5FA8', '#B04BFF', '#FF9A6B', '#6B7BFF'], ['숲 · 노랑', '#1F3A2E', '#0C1E15', '#E8F04F', '#2FE08A', '#18A8C8', '#F0A030'],
  ['먹색 · 불꽃', '#1A1618', '#0A0808', '#FF4A2A', '#FFB02A', '#FF2F7A', '#FFE06A'], ['바다 · 산호', '#123848', '#06202C', '#FF7A6B', '#2FC8E0', '#FFD08A', '#4A8BFF'],
  ['자두 · 민트', '#4A1A3A', '#2A0A20', '#3DFFC2', '#FF4FA0', '#7A5BFF', '#BFFF6A'], ['회색 · 옅은 무지갯빛', '#2A2C33', '#15161A', '#A8B8FF', '#FFB8D8', '#B8FFE0', '#FFF0B0'],
  ['연한 분홍 · 하늘', '#F4E6EA', '#FBF5F6', '#8FB0FF', '#FF9CC2', '#FFD08A', '#9FE8C8'], ['아이보리 · 보라', '#F3EEE4', '#FAF8F3', '#B99BFF', '#FFB48A', '#7FD0E0', '#F28AB0'],
];
export const eclipsePal = (seed, pal) => pal != null && ECLIPSE_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % ECLIPSE_PAL.length;
export const eclipseLight = (seed, pal) => { const [r, g, b] = hx3(ECLIPSE_PAL[eclipsePal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const eclipseCache = new Map();
function eclipseOf(seed) {
  if (eclipseCache.has(seed)) return eclipseCache.get(seed);
  const r = rng(seed ^ 0xec1195), p = { r1: .42 + r() * .06, of: .045 + r() * .08, dir: r() * 6.2832, c0: r(), t0: r() * 40, s: (seed >>> 0) % 89 };
  if (eclipseCache.size > 60) eclipseCache.delete(eclipseCache.keys().next().value);
  eclipseCache.set(seed, p); return p;
}
const EC_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uS, uR1, uOf, uDir, uC, uBl, uCy, uGrain; uniform vec3 uBg, uDk, uC0, uC1, uC2, uC3;
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec3 ringCol(float u) { float p = fract(u) * 4., f = smoothstep(0., 1., fract(p)), i = floor(p);
  if (i < 1.) return mix(uC0, uC1, f); if (i < 2.) return mix(uC1, uC2, f); if (i < 3.) return mix(uC2, uC3, f); return mix(uC3, uC0, f); }
void main() {
  float U = min(uRes.x, uRes.y * .8);   // 세로 카드는 폭, 가로 카드는 높이에 맞춰 고리 크기
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / U - vec2(0., uCy);
  float light = step(.5, dot(uBg, vec3(.2126, .7152, .0722)));
  vec2 dv = vec2(cos(uDir), sin(uDir)) * uOf * (1. + .18 * sin(uT * .7 + uS));   // 숨 쉬듯 두께가 살짝
  float r = length(uv), a = atan(uv.y, uv.x), R0 = uR1 * .74;
  float outer = 1. - smoothstep(uR1 - uBl, uR1 + uBl, r), inner = smoothstep(R0 - uBl * .8, R0 + uBl * .8, length(uv - dv));
  vec3 rc = ringCol(a / 6.28318 + uC + uT * .025);
  vec3 c = mix(uBg, uBg * (light > .5 ? .96 : .8), smoothstep(.25, .9, r));
  float halo = exp(-pow(max(r - uR1, 0.) / .11, 2.)) * (1. - outer);   // 바깥 은은한 빛 번짐
  c = light > .5 ? mix(c, rc, halo * .18) : c + rc * halo * .12;
  c = mix(c, rc, outer * inner * (light > .5 ? .85 : .95));
  vec3 dc = mix(uDk, uDk * (light > .5 ? 1. : 1.25) + rc * .05, smoothstep(R0, 0., length(uv - dv)));   // 안쪽 원 (가운데가 아주 살짝 밝게)
  c = mix(c, dc, (1. - inner) * outer);
  if (uGrain > 0.) c += (grain(gl_FragCoord.xy) + grain(gl_FragCoord.xy + vec2(37., 91.)) - 1.) * uGrain;
  gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
}`;
let EG = null;
function ecGl() {
  if (EG !== null) return EG;
  EG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!g) return EG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, EC_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uS', 'uR1', 'uOf', 'uDir', 'uC', 'uBl', 'uCy', 'uGrain', 'uBg', 'uDk', 'uC0', 'uC1', 'uC2', 'uC3'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    EG = { cv, g, u };
  } catch (e) { console.warn('eclipse gl', e); EG = false; }
  return EG;
}
const ecCy = (W, H) => H / W > 1.6 ? .08 : 0;   // 9:16은 글 자리(위 28 · 아래 44)에 맞춰 고리를 살짝 위로
// WebGL이 없을 때: 캔버스로 비슷하게 (바탕 · 원뿔 그라데이션 고리 · 비켜선 안쪽 원)
function eclipseCpu(cv, P, pal, t) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d'), U = Math.min(W, H * .8), [, bg, dk, ...cs] = ECLIPSE_PAL[pal];
  const cx = W / 2, cy = H / 2 - ecCy(W, H) * U, R1 = P.r1 * U, k = 1 + .18 * Math.sin(t * .7 + P.s), dx = Math.cos(P.dir) * P.of * U * k, dy = -Math.sin(P.dir) * P.of * U * k;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (g.createConicGradient) { const cg = g.createConicGradient(-(P.c0 + t * .025) * 6.2832, cx, cy); [...cs, cs[0]].forEach((c, i) => cg.addColorStop(i / 4, c)); g.fillStyle = cg; } else g.fillStyle = cs[0];
  g.beginPath(); g.arc(cx, cy, R1, 0, 6.2832); g.fill();
  const rg = g.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, R1 * .78); rg.addColorStop(0, dk); rg.addColorStop(.9, dk); rg.addColorStop(1, dk + '00');
  g.fillStyle = rg; g.beginPath(); g.arc(cx + dx, cy + dy, R1 * .78, 0, 6.2832); g.fill();
}
function drawEclipse(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = eclipseOf(seed), pal = eclipsePal(seed, cv.dataset.pal), R = ecGl();
  if (!R) return eclipseCpu(cv, P, pal, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 540 / W) : 1, w = Math.round(W * k), h = Math.round(H * k), C = ECLIPSE_PAL[pal];   // 움직일 땐 폭 540까지만 (번진 그림이라 충분)
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, P.t0 + t); g.uniform1f(u.uS, P.s); g.uniform1f(u.uR1, P.r1); g.uniform1f(u.uOf, P.of); g.uniform1f(u.uDir, P.dir); g.uniform1f(u.uC, P.c0);
  g.uniform1f(u.uBl, .05); g.uniform1f(u.uCy, ecCy(W, H)); g.uniform1f(u.uGrain, grainAmt * .5);
  ['uBg', 'uDk', 'uC0', 'uC1', 'uC2', 'uC3'].forEach((n, i) => g.uniform3fv(u[n], hx3(C[i + 1])));
  g.drawArrays(g.TRIANGLES, 0, 3);
  cv.getContext('2d').drawImage(gc, 0, 0, W, H);
}
// 네온 메시 (11-25 104차, 앤드류 레퍼런스(노이즈 + 네온 색 영상)의 느낌만 · 코드로 새로 작성). 부드러운 무늬 값이 한 높이를 지나는 자리에 굵은 형광 선,
// 선 한 줄 안에서 두 색이 번지고 선이 만나는 곳은 저절로 두껍게. 정돈 정도(ord)가 셔플마다 랜덤: 두 방향 물결을 겹친 고른 칸 ↔ 자유로운 그물 (대부분 정돈).
// 가운데 글 자리는 선이 옅어져요. 두 색 묶음 10가지(어두운 8 · 연한 2), 칩으로 고르면(pb.pal) 고정, 아니면 씨앗 % 10. t = 초(0이면 멈춘 그림)
export const MESH_PAL = [   // [이름, 바탕, 색1, 색2]
  ['라임 · 분홍', '#000000', '#A8F03C', '#FF1F8A'], ['하늘 · 보라', '#04040A', '#5FD8FF', '#8A4BFF'], ['주황 · 청록', '#050404', '#FF8A2A', '#1FD0C0'], ['노랑 · 빨강', '#050303', '#FFE14A', '#FF3B3B'],
  ['민트 · 자홍', '#030605', '#3DFFB0', '#E040FF'], ['분홍 · 파랑', '#04030A', '#FF8FC8', '#3A6BFF'], ['연보라 · 살구', '#0A0810', '#C9B5FF', '#FFB48A'], ['흰색 · 회색', '#050505', '#F2F2EC', '#6A707C'],
  ['종이 · 연두 분홍', '#F4F1EA', '#6BB800', '#E0207A'], ['종이 · 남색 하늘', '#EFF2F6', '#1E3A8A', '#3FA8E0'],
];
export const meshPal = (seed, pal) => pal != null && MESH_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % MESH_PAL.length;
export const meshLight = (seed, pal) => { const [r, g, b] = hx3(MESH_PAL[meshPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const meshCache = new Map();
function meshOf(seed) {
  if (meshCache.has(seed)) return meshCache.get(seed);
  const r = rng(seed ^ 0x3e5a), ord = r() < .65 ? .75 + r() * .25 : r() * .75;   // 대부분 정돈, 가끔 자유롭게
  const p = { ord, sc: 3.2 + r() * 1.9, w: .032 + r() * .03, ang: r() * 6.2832, t0: r() * 60, s: (seed >>> 0) % 97 };
  if (meshCache.size > 60) meshCache.delete(meshCache.keys().next().value);
  meshCache.set(seed, p); return p;
}
const ME_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uS, uSc, uW, uAng, uOrd, uCy, uGrain; uniform vec3 uBg, uC0, uC1;
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uS * 3.17) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6. - 15.) + 10.);
  return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.x;
  float ca = cos(uAng), sa = sin(uAng), t = uT * .06;
  vec2 p = mat2(ca, -sa, sa, ca) * uv * uSc * vec2(1., .7);   // 자유로운 그물
  p += (vec2(vn(p * .7 + vec2(t, 3.)), vn(p * .7 + vec2(7., -t))) - .5) * .55 + vec2(t * .8, t * .3);
  float fr = .85 * vn(p) + .15 * vn(p * 1.7 + 11. - t);
  vec2 q = mat2(ca, -sa, sa, ca) * uv * uSc * 1.25;   // 정돈된 그물: 두 방향 물결을 겹쳐 고른 칸 · 같은 기울기, 살짝만 휘게
  q += (vec2(vn(q * .35 + vec2(t, 5.)), vn(q * .35 + vec2(9., t))) - .5) * 1.8;
  float fo = .5 + .14 * (sin(q.x * 1.9 + q.y * .9 + t * 2.2) + sin(q.x * .55 - q.y * 1.6 + t * 1.4 + h2(vec2(3.)) * 6.));
  float Wd = uW * mix(1., .55, uOrd), d = mix(fr, fo, uOrd) - .5, band = exp(-d * d / (Wd * Wd));
  float light = step(.5, dot(uBg, vec3(.2126, .7152, .0722)));
  vec3 lc = mix(uC1, uC0, smoothstep(-Wd * .8, Wd * .8, d));
  vec2 e = (uv - vec2(0., uCy)) / vec2(.36, .24 * uRes.y / uRes.x * .8);   // 가운데 글 자리는 선이 옅게
  band *= 1. - (1. - smoothstep(.7, 1.1, length(e))) * .8;
  vec3 c = light > .5 ? mix(uBg, lc, band * .9) : uBg + lc * band;
  if (uGrain > 0.) c += (grain(gl_FragCoord.xy) + grain(gl_FragCoord.xy + vec2(37., 91.)) - 1.) * uGrain;
  gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
}`;
let MG = null;
function meGl() {
  if (MG !== null) return MG;
  MG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!g) return MG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, ME_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uS', 'uSc', 'uW', 'uAng', 'uOrd', 'uCy', 'uGrain', 'uBg', 'uC0', 'uC1'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    MG = { cv, g, u };
  } catch (e) { console.warn('mesh gl', e); MG = false; }
  return MG;
}
// WebGL이 없을 때: 캔버스로 비슷하게 (같은 방향으로 기운 물결선 두 묶음)
function meshCpu(cv, P, pal, t) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d'), [, bg, c0, c1] = MESH_PAL[pal], n = Math.round(P.sc * 1.6), lw = W * P.w * .35;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(P.ang); g.lineCap = 'round';
  [[c1, lw * 1.8, .5], [c0, lw, .9]].forEach(([c, w, a]) => { g.strokeStyle = c; g.lineWidth = w; g.globalAlpha = a;
    for (let k = 0; k < 2; k++) for (let i = -n; i <= n; i++) { g.beginPath();
      for (let s = -1.2; s <= 1.2; s += .04) { const x = i / n * H, y = s * H, o = Math.sin(s * 5 + i + t * .15 + k * 2) * W * .05; k ? g.lineTo(y + o, x) : g.lineTo(x + o, y); }
      g.stroke(); } });
  g.restore();
}
function drawMesh(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = meshOf(seed), pal = meshPal(seed, cv.dataset.pal), R = meGl();
  if (!R) return meshCpu(cv, P, pal, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 540 / W) : 1, w = Math.round(W * k), h = Math.round(H * k), C = MESH_PAL[pal];   // 움직일 땐 폭 540까지만 (번진 선이라 충분)
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, P.t0 + t); g.uniform1f(u.uS, P.s); g.uniform1f(u.uSc, P.sc); g.uniform1f(u.uW, P.w); g.uniform1f(u.uAng, P.ang); g.uniform1f(u.uOrd, P.ord);
  g.uniform1f(u.uCy, H / W > 1.6 ? .08 : 0); g.uniform1f(u.uGrain, grainAmt * .5);
  ['uBg', 'uC0', 'uC1'].forEach((n, i) => g.uniform3fv(u[n], hx3(C[i + 1])));
  g.drawArrays(g.TRIANGLES, 0, 3);
  cv.getContext('2d').drawImage(gc, 0, 0, W, H);
}
// 픽셀 체커 (11-26 105차, 앤드류 레퍼런스(물결 바둑판 이미지 · 영상)의 느낌만 · 코드로 새로 작성). 굵은 픽셀 격자 위에 가로 물결 × 세로 물결 =
// 밝은 칸 · 어두운 칸이 번갈아 놓인 바둑판, 칸 사이는 바탕색 줄, 5단계로 끊어 픽셀 느낌. 글 뒤 박스 없이 대비를 낮춰요: 전체 조금 + 글 둘레는 경계 없이
// 서서히, 특히 글자색과 부딪히는 칸(짙은 글이면 어두운 칸)을 거의 지워요. 색 10가지(한 색 7 · 무지개 1 · 연한 2). 셔플 = 칸 크기 · 픽셀 크기 · 칸 모양
export const PIXEL_PAL = [   // [이름, 바탕(줄), 밝은 칸, 어두운 칸, 무지개?]
  ['노랑', '#DCCB2A', '#FFFBE6', '#0B0A02'], ['분홍', '#E86AA6', '#FFF0F6', '#2A0616'], ['하늘', '#4FA8E8', '#F0F8FF', '#04121F'], ['민트', '#3CC79A', '#ECFFF7', '#031A12'],
  ['주황', '#F08A2C', '#FFF4E8', '#200C02'], ['보라', '#8A5BE0', '#F4EEFF', '#120624'], ['회색', '#8C8F96', '#FAFAFA', '#101114'], ['무지개', '#7A2A9A', '#FFFFFF', '#000000', 1],
  ['연한 노랑', '#F4EDC4', '#FFFFFF', '#C2B252'], ['연한 하늘', '#DCEAF8', '#FFFFFF', '#86A9D2'],
];
export const pixelPal = (seed, pal) => pal != null && PIXEL_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % PIXEL_PAL.length;
export const pixelLight = (seed, pal) => { const [r, g, b] = hx3(PIXEL_PAL[pixelPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .45; };   // 셰이더의 글자색 판단과 같은 기준
const pixelCache = new Map();
function pixelOf(seed) {
  if (pixelCache.has(seed)) return pixelCache.get(seed);
  const r = rng(seed ^ 0x9e1c), p = { np: Math.round(44 + r() * 52), cx: 3.6 + r() * 3, el: 1.05 + r() * .85, ph: r() * 6.28, t0: r() * 30 };
  if (pixelCache.size > 60) pixelCache.delete(pixelCache.keys().next().value);
  pixelCache.set(seed, p); return p;
}
const PX_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uPh, uNp, uCx, uEl, uRb, uCy, uGrain; uniform vec3 uBg, uLt, uDk;
vec3 hsv(float h, float s, float v) { vec3 p = abs(fract(vec3(h) + vec3(1., 2. / 3., 1. / 3.)) * 6. - 3.); return v * mix(vec3(1.), clamp(p - 1., 0., 1.), s); }
float hh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float ps = uRes.x / uNp; vec2 pi = floor(gl_FragCoord.xy / ps), u = ((pi + .5) * ps - .5 * uRes) / uRes.x;   // 굵은 픽셀
  float t = uT * .35, v = sin(u.x * 3.14159 * uCx + t + uPh) * sin(u.y * 3.14159 * uCx * uEl - t * .7 + uPh * 1.7);
  v = sign(v) * max(abs(v) - .14, 0.) / .86;   // 칸 사이 바탕색 줄
  v = floor(v * 5. + .5) / 5.;   // 5단계
  float soft = 1. - smoothstep(.4, 1.25, length((u - vec2(0., uCy)) / vec2(.42, .2 * uRes.y / uRes.x / 1.25)));   // 글 둘레 (경계 없이)
  float inkDark = step(.45, dot(uBg, vec3(.2126, .7152, .0722))), against = inkDark > .5 ? step(v, 0.) : step(0., v);
  v *= .62 * (1. - soft * mix(.55, .92, against));
  vec3 c;
  if (uRb > .5) { float a = abs(v); c = hsv(fract((290. + v * 125.) / 360.), mix(.75, 1., a), mix(.55, 1., a)); }
  else c = v > 0. ? mix(uBg, uLt, pow(v, .8)) : mix(uBg, uDk, pow(-v, .8));
  if (uGrain > 0.) c += (hh(pi) - .5) * uGrain;   // 노이즈도 픽셀 단위로
  gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
}`;
let PG = null;
function pxGl() {
  if (PG !== null) return PG;
  PG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!g) return PG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, PX_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uPh', 'uNp', 'uCx', 'uEl', 'uRb', 'uCy', 'uGrain', 'uBg', 'uLt', 'uDk'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    PG = { cv, g, u };
  } catch (e) { console.warn('pixel gl', e); PG = false; }
  return PG;
}
// WebGL이 없을 때: 작은 캔버스에 칸마다 직접 계산해서 키워요 (픽셀이라 그대로 같은 그림)
function pixelCpu(cv, P, pal, t) {
  const W = cv.width, H = cv.height, C = PIXEL_PAL[pal], w = P.np, h = Math.max(1, Math.round(P.np * H / W)), sc = document.createElement('canvas'); sc.width = w; sc.height = h;
  const x = sc.getContext('2d'), im = x.createImageData(w, h), [bg, lt, dk] = [C[1], C[2], C[3]].map(hx3), inkDark = .2126 * bg[0] + .7152 * bg[1] + .0722 * bg[2] > .45, cy = H / W > 1.6 ? .08 : 0, tt = t * .35;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ux = (i + .5) / w - .5, uy = ((h - j - .5) / h - .5) * H / W;
    let v = Math.sin(ux * Math.PI * P.cx + tt + P.ph) * Math.sin(uy * Math.PI * P.cx * P.el - tt * .7 + P.ph * 1.7);
    v = Math.sign(v) * Math.max(Math.abs(v) - .14, 0) / .86; v = Math.floor(v * 5 + .5) / 5;
    const L = Math.hypot(ux / .42, (uy - cy) / (.2 * H / W / 1.25)), soft = 1 - Math.min(1, Math.max(0, (L - .4) / .85)), against = inkDark ? v <= 0 : v >= 0;
    v *= .62 * (1 - soft * (against ? .92 : .55));
    const to = v > 0 ? lt : dk, k = Math.pow(Math.abs(v), .8), o = (j * w + i) * 4;
    for (let q = 0; q < 3; q++) im.data[o + q] = Math.round((bg[q] + (to[q] - bg[q]) * k) * 255);
    im.data[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(sc, 0, 0, W, H);
}
function drawPixel(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = pixelOf(seed), pal = pixelPal(seed, cv.dataset.pal), R = pxGl();
  if (!R) return pixelCpu(cv, P, pal, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 540 / W) : 1, w = Math.round(W * k), h = Math.round(H * k), C = PIXEL_PAL[pal];   // 움직일 땐 폭 540까지만 (픽셀 수는 같아요)
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, P.t0 + t); g.uniform1f(u.uPh, P.ph); g.uniform1f(u.uNp, P.np); g.uniform1f(u.uCx, P.cx); g.uniform1f(u.uEl, P.el); g.uniform1f(u.uRb, C[4] ? 1 : 0);
  g.uniform1f(u.uCy, H / W > 1.6 ? .08 : 0); g.uniform1f(u.uGrain, grainAmt);
  ['uBg', 'uLt', 'uDk'].forEach((n, i) => g.uniform3fv(u[n], hx3(C[i + 1])));
  g.drawArrays(g.TRIANGLES, 0, 3);
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(gc, 0, 0, W, H);
}
// 플라즈마 (11-26 106차, 앤드류 레퍼런스(셰이더 효과 모음 중 플라즈마)의 원리만 · 코드는 셰이더로 새로 작성). 가로 · 세로 · 대각선 물결과
// 떠다니는 한 점의 둥근 물결을 더한 값을 휜 좌표 위에서 계산 → 큰 덩어리 2~3개만, 세 색을 한 방향으로 넓게 섞어 바다 · 숲처럼 매끈하게 번져요.
// 밝은 쪽엔 빛 번짐(스크린 섞기), 가장자리는 살짝 깊게, 글 둘레는 넓고 옅게 (짙은 글이면 밝게, 흰 글이면 어둡게). 색 11가지(깊은 9 · 연한 2, 불꽃은 앤드류 요청).
// 셔플 = 물결 크기 · 방향 · 빛 번짐 세기 · 모양
export const PLASMA_PAL = [   // [이름, 색1, 색2, 색3]
  ['바다', '#031B3A', '#0A6E8C', '#7FD3D8'], ['숲', '#0B2418', '#2F6B45', '#B7D98B'], ['새벽', '#1B1740', '#5B5BA8', '#F2B8C6'], ['노을', '#3A0E2A', '#C2453E', '#F7C873'],
  ['호수', '#062A2A', '#1F8A82', '#D6F0D8'], ['자두', '#24082E', '#7B2A6E', '#F09AB8'], ['밤', '#05060F', '#1D2B64', '#6FA8DC'], ['오로라', '#04121C', '#14806A', '#B6F5A0'], ['불꽃', '#2A0508', '#C0200E', '#FFB703'],
  ['안개', '#DDE6EC', '#B9CFDC', '#F7F4EE'], ['복숭아', '#FBE3D6', '#F3C1B5', '#FFF6E4'],
];
export const plasmaPal = (seed, pal) => pal != null && PLASMA_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % PLASMA_PAL.length;
export const plasmaLight = (seed, pal) => { const C = PLASMA_PAL[plasmaPal(seed, pal)]; return [1, 2, 3].reduce((a, i) => { const [r, g, b] = hx3(C[i]); return a + .2126 * r + .7152 * g + .0722 * b; }, 0) / 3 > .5; };   // 셰이더의 글자색 판단과 같은 기준
const plasmaCache = new Map();
function plasmaOf(seed) {
  if (plasmaCache.has(seed)) return plasmaCache.get(seed);
  const r = rng(seed ^ 0x51a5), p = { sc: 2 + r() * 1.4, di: r() * 6.28, gl: .25 + r() * .65, s: r() * 7.7, t0: r() * 40 };
  if (plasmaCache.size > 60) plasmaCache.delete(plasmaCache.keys().next().value);
  plasmaCache.set(seed, p); return p;
}
const PL_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uS, uSc, uDi, uGl, uInk, uCy, uGrain; uniform vec3 uC0, uC1, uC2;
float hh(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float field(vec2 p, float t) {
  vec2 q = p + .75 * vec2(sin(p.y * .8 + t * .5 + uS), cos(p.x * .7 - t * .4 + uS * 1.3));   // 좌표를 휘게 → 물처럼
  vec2 cc = vec2(sin(t * .37 + uS) * .8, cos(t * .29 + uS * 2.));
  float v = sin(q.x * 1.1 + t + uS) + sin(q.y * .8 - t * .7 + uS * .7) + sin((q.x * cos(uDi) + q.y * sin(uDi)) * .9 + t * .5) + sin(length(q - cc) * 1.3 - t * .9);
  return v * .125 + .5;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.x, p = uv * uSc;
  float t = uT * .2, n = smoothstep(.08, .92, field(p, t));
  vec3 c = n < .5 ? mix(uC0, uC1, smoothstep(0., 1., n * 2.)) : mix(uC1, uC2, smoothstep(0., 1., n * 2. - 1.));
  float g = pow(smoothstep(.45, 1., field(p * .7 + 3.1, t * .8 + 1.7)), 1.6);   // 빛 번짐
  vec3 lt = mix(max(max(uC0, uC1), uC2), vec3(1.), .35);
  c = 1. - (1. - c) * (1. - lt * g * uGl);
  c *= 1. - .18 * smoothstep(.45, 1.1, length(uv * vec2(1., uRes.x / uRes.y * 1.25)));   // 가장자리 살짝 깊게
  float soft = 1. - smoothstep(.2, 1.4, length((uv - vec2(0., uCy)) / vec2(.5, .32 * uRes.y / uRes.x / 1.25)));
  c = mix(c, uInk > .5 ? vec3(1.) : vec3(0.), soft * (uInk > .5 ? .34 : .22));   // 글 둘레: 넓고 옅게
  if (uGrain > 0.) c += (hh(gl_FragCoord.xy + uS) - .5) * uGrain;
  gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
}`;
let PLG = null;
function plGl() {
  if (PLG !== null) return PLG;
  PLG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false });
    if (!g) return PLG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, PL_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uS', 'uSc', 'uDi', 'uGl', 'uInk', 'uCy', 'uGrain', 'uC0', 'uC1', 'uC2'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    PLG = { cv, g, u };
  } catch (e) { console.warn('plasma gl', e); PLG = false; }
  return PLG;
}
// WebGL이 없을 때: 작은 캔버스에 같은 식을 계산하고 부드럽게 키워요 (매끈한 그림이라 거의 같아요)
function plasmaCpu(cv, P, pal, t) {
  const W = cv.width, H = cv.height, C = PLASMA_PAL[pal].slice(1).map(hx3), ink = plasmaLight(0, pal), w = 90, h = Math.round(90 * H / W), sc = document.createElement('canvas'); sc.width = w; sc.height = h;
  const x = sc.getContext('2d'), im = x.createImageData(w, h), cy = H / W > 1.6 ? .08 : 0, tt = t * .2, ss = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const field = (px, py, t) => {
    const qx = px + .75 * Math.sin(py * .8 + t * .5 + P.s), qy = py + .75 * Math.cos(px * .7 - t * .4 + P.s * 1.3), cx = Math.sin(t * .37 + P.s) * .8, cyy = Math.cos(t * .29 + P.s * 2);
    const v = Math.sin(qx * 1.1 + t + P.s) + Math.sin(qy * .8 - t * .7 + P.s * .7) + Math.sin((qx * Math.cos(P.di) + qy * Math.sin(P.di)) * .9 + t * .5) + Math.sin(Math.hypot(qx - cx, qy - cyy) * 1.3 - t * .9);
    return v * .125 + .5;
  };
  const lt = [0, 1, 2].map(q => Math.max(C[0][q], C[1][q], C[2][q]) * .65 + .35);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ux = (i + .5) / w - .5, uy = ((h - j - .5) / h - .5) * H / W, n = ss(.08, .92, field(ux * P.sc, uy * P.sc, tt));
    const [A, B, k] = n < .5 ? [C[0], C[1], ss(0, 1, n * 2)] : [C[1], C[2], ss(0, 1, n * 2 - 1)];
    const g = Math.pow(ss(.45, 1, field(ux * P.sc * .7 + 3.1, uy * P.sc * .7 + 3.1, tt * .8 + 1.7)), 1.6) * P.gl;
    const edge = 1 - .18 * ss(.45, 1.1, Math.hypot(ux, uy * W / H * 1.25)), soft = (1 - ss(.2, 1.4, Math.hypot(ux / .5, (uy - cy) / (.32 * H / W / 1.25)))) * (ink ? .34 : .22), o = (j * w + i) * 4;
    for (let q = 0; q < 3; q++) { let v = A[q] + (B[q] - A[q]) * k; v = 1 - (1 - v) * (1 - lt[q] * g); v *= edge; v += ((ink ? 1 : 0) - v) * soft; im.data[o + q] = Math.round(Math.min(1, Math.max(0, v)) * 255); }
    im.data[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); const g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(sc, 0, 0, W, H);
}
function drawPlasma(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = plasmaOf(seed), pal = plasmaPal(seed, cv.dataset.pal), R = plGl();
  if (!R) return plasmaCpu(cv, P, pal, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 360 / W) : 1, w = Math.round(W * k), h = Math.round(H * k), C = PLASMA_PAL[pal];   // 매끈해서 움직일 땐 폭 360까지만
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, P.t0 + t); g.uniform1f(u.uS, P.s); g.uniform1f(u.uSc, P.sc); g.uniform1f(u.uDi, P.di); g.uniform1f(u.uGl, P.gl);
  g.uniform1f(u.uInk, plasmaLight(seed, cv.dataset.pal) ? 1 : 0); g.uniform1f(u.uCy, H / W > 1.6 ? .08 : 0); g.uniform1f(u.uGrain, grainAmt);
  ['uC0', 'uC1', 'uC2'].forEach((n, i) => g.uniform3fv(u[n], hx3(C[i + 1])));
  g.drawArrays(g.TRIANGLES, 0, 3);
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.drawImage(gc, 0, 0, W, H);
}
// 프랙탈 패턴 (11-26 107차, 앤드류 레퍼런스(점 밀도 무늬)의 원리만 · 식과 코드는 새로 작성). 점 수만 개를 사인 물결 식으로 계속 옮겨
// 많이 지나간 자리일수록 밝게 → 실이 얽힌 무늬 (모서리끼리 이어지는 타일). 밝기는 순위로 고르게 펴서 다섯 색으로. 배경 도구 없이 셔플만:
// 셔플 한 번에 무늬 · 크기(1~3칸) · 색 묶음(10가지) · 색 방향(가끔 밝은 바탕에 짙은 실)이 함께 바뀌어요. 글 둘레는 바탕색으로 넓고 옅게
export const FRACTAL_PAL = [   // [이름, 빈 자리 → 실이 가장 많이 지나간 자리 다섯 색]
  ['심해', '#020B1A', '#0B2E59', '#1F6F99', '#6FC3D6', '#E6F6F2'], ['숲', '#06140C', '#173D26', '#3F7A4A', '#A9C97A', '#F2EFC8'],
  ['노을', '#12060E', '#4A1230', '#A8323E', '#E8894A', '#FBE3B0'], ['자두', '#0E0614', '#3A1550', '#7E3A8C', '#D47FB0', '#FBE0EC'],
  ['금빛', '#0D0A04', '#3A2A0C', '#8A6420', '#D9AE55', '#FFF1C8'], ['밤하늘', '#05060F', '#151E4A', '#3B4FA0', '#8FA8E8', '#EEF2FF'],
  ['오로라', '#03100F', '#0B3B3A', '#1E8A6E', '#8FE0A6', '#F0FFE8'], ['먹', '#0A0A0A', '#262626', '#5A5A5A', '#A8A8A8', '#F2F2F2'],
  ['종이', '#F6F1E7', '#E6D9C3', '#C2A887', '#8A6E52', '#3E2F22'], ['하늘빛', '#F2F6FA', '#D6E3EE', '#A3BED6', '#5F84A8', '#22384F'],
];
const FTAU = Math.PI * 2;
function frDensity(P, G, N, IT, seed) {
  const cnt = new Float32Array(G * G), r = rng(seed), { a, b, c, d, k, ph } = P;
  const f = (x, y) => a * Math.sin(FTAU * x) + b * Math.sin(FTAU * x) * Math.cos(FTAU * y + ph) + c * Math.cos(2 * FTAU * y) + d * Math.sin(3 * FTAU * x + ph) * Math.sin(2 * FTAU * y) + k * y;
  for (let n = 0; n < N; n++) {
    let x = r(), y = r();
    for (let i = 0; i < IT; i++) {
      const u = f(x, y), v = f(y, x); x = u - Math.floor(u); y = v - Math.floor(v);   // 가로세로를 바꾼 같은 식 → 대각선으로 마주 보는 무늬
      if (i > 4) cnt[(Math.floor(y * G) % G) * G + (Math.floor(x * G) % G)]++;
    }
  }
  return cnt;
}
const fractalCache = new Map();
function fractalOf(seed) {
  if (fractalCache.has(seed)) return fractalCache.get(seed);
  const r = rng(seed ^ 0x3f7a), pal = ((seed >>> 0) || 1) % FRACTAL_PAL.length;
  let P;
  for (let i = 0; i < 10; i++) {   // 휑하거나 꽉 찬 무늬는 다시
    P = { a: r() * 2 - 1, b: r() * 2 - 1, c: r() * 1.6 - .8, d: r() * 1.4 - .7, k: Math.floor(r() * 5) - 2, ph: r() * FTAU };
    const D = frDensity(P, 100, 4000, 22, seed + i); let nz = 0; for (const v of D) if (v > 0) nz++;
    const cv = nz / 1e4; if (cv > .18 && cv < .8) break;
  }
  const o = { P, pal, inv: pal < 8 && r() < .22, n: [1, 1.5, 1.5, 2, 2, 3][Math.floor(r() * 6)], tile: null, bg: null };
  if (fractalCache.size > 8) fractalCache.delete(fractalCache.keys().next().value);
  fractalCache.set(seed, o); return o;
}
export const fractalLight = seed => { const o = fractalOf(seed), C = FRACTAL_PAL[o.pal], [r, g, b] = hx3(o.inv ? C[5] : C[1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
// 타일은 한 번만 계산해서 기억해요 (밝기 순위 → 다섯 색, 고운 결도 같이 구워요)
// 레트로 픽셀 (11-26 109차, 앤드류 레퍼런스(진동판 마디선 점 격자)의 원리만 · 식과 코드는 새로 작성). 네모 픽셀 격자 위에서 두 진동 모양의 합이
// 0에 가까운 자리(모래가 모이는 마디선)만 켜고, 밝기는 4단계로 끊어 레트로하게. 색은 가운데 → 바깥으로 세 색(무지개 묶음은 색상환).
// 글 뒤 박스 없이 가운데 넓은 타원에서 픽셀을 옅게. 모션 = 두 모양 사이를 8초에 한 번 오가요. 셔플 = 대칭 모양 · 픽셀 크기 (+ 칩 안 고르면 색 10가지 중)
export const RETRO_PAL = [   // [이름, 바탕, 안쪽 색, 가운데 색, 바깥 색, 무지개?]
  ['무지개', '#07070C', '#FF5A7A', '#FFD25A', '#5AD7FF', 1], ['네온 민트', '#04110F', '#D9FFF1', '#2FE0B4', '#0E8F7A'], ['노을', '#120708', '#FFD08A', '#E8664A', '#9A2340'],
  ['보라', '#0B0716', '#F0D6FF', '#A47CF4', '#5A34A8'], ['바다', '#03101C', '#CFF4FF', '#3AAEE0', '#155A92'], ['금빛', '#0E0B05', '#FFF0C2', '#E0AE45', '#8A5F18'],
  ['체리', '#14060C', '#FFD6E8', '#F25596', '#A31F58'], ['모노', '#0B0B0B', '#F4F4F4', '#A8A8A8', '#5A5A5A'], ['종이', '#F3EEE3', '#6B5646', '#9A7A5E', '#B98A64'], ['하늘빛', '#E6F0F7', '#245F96', '#3D7CB8', '#6FA3D6'],
];
export const retroPal = (seed, pal) => pal != null && RETRO_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % RETRO_PAL.length;
export const retroLight = (seed, pal) => { const [r, g, b] = hx3(RETRO_PAL[retroPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const RT_MODES = [[1, 2], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 6], [4, 5], [3, 7], [5, 6]];
const retroCache = new Map();
function retroOf(seed) {
  if (retroCache.has(seed)) return retroCache.get(seed);
  const r = rng(seed ^ 0x3c71), md = () => { const [n, m] = RT_MODES[Math.floor(r() * RT_MODES.length)]; return { n, m, a: r() < .5 ? 1 : -1, b: r() < .5 ? 1 : -1 + r() * .6 }; };
  const p = { np: [40, 44, 50, 57][Math.floor(r() * 4)], A: md(), B: md(), ph: r() * 6.28, hue: r() * 360 };
  if (retroCache.size > 60) retroCache.delete(retroCache.keys().next().value);
  retroCache.set(seed, p); return p;
}
function hslRgb(h, s, l) { const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }
function drawRetro(cv, seed, t, grainAmt) {
  const W = cv.width, H = cv.height, P = retroOf(seed), C = RETRO_PAL[retroPal(seed, cv.dataset.pal)], light = retroLight(seed, cv.dataset.pal);
  const bg = hx3(C[1]), cI = hx3(C[2]), cM = hx3(C[3]), cO = hx3(C[4]), x = cv.getContext('2d');
  const cs = W / P.np, cols = P.np, rows = Math.ceil(H / cs), asp = H / W, PI = Math.PI, cy = asp > 1.6 ? .16 : 0;   // 9:16은 글 자리가 조금 위
  const ph = (Math.sin(t / 8 * PI * 2 + P.ph) + 1) / 2, s = Math.max(1, cs * .72), o = (cs - s) / 2, hr = rng(seed * 7 + 3);
  const f = (M, X, Y) => M.a * Math.sin(PI * M.n * X) * Math.sin(PI * M.m * Y) + M.b * Math.sin(PI * M.m * X) * Math.sin(PI * M.n * Y);
  x.fillStyle = C[1]; x.fillRect(0, 0, W, H);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const X = (i + .5) / cols * 2 - 1, Yh = ((j + .5) * cs / H) * 2 - 1, Y = Yh * asp;   // Yh = 높이 기준 -1~1
    let v = 1 - Math.min(1, Math.abs(f(P.A, X, Y) + (f(P.B, X, Y) - f(P.A, X, Y)) * ph) / .34); v = v * v * (3 - 2 * v);
    v = Math.round(v * 4) / 4; const g = grainAmt ? (hr() - .5) * grainAmt : 0;   // 노이즈도 픽셀 단위로 (꺼진 칸에도 같은 순서로 뽑아요)
    if (v <= 0) continue;
    const e = Math.hypot(X / .78, (Yh + cy) / (asp > 1.6 ? .46 : .5)), veil = 1 - (light ? .82 : .76) * (1 - Math.min(1, Math.max(0, (e - .55) / .5)));
    const d = Math.min(1, Math.hypot(X, Yh) / 1.25);
    const c = C[5] ? hslRgb((d * 300 + t * 12 + P.hue) % 360, .72, .6) : d < .5 ? cI.map((q, k) => q + (cM[k] - q) * d / .5) : cM.map((q, k) => q + (cO[k] - q) * (d - .5) / .5);
    const a = v * veil * (light ? .78 : 1);
    x.fillStyle = `rgb(${c.map((q, k) => Math.round(Math.min(1, Math.max(0, bg[k] + (q - bg[k]) * a + g)) * 255)).join(',')})`;
    x.fillRect(Math.round(i * cs + o), Math.round(j * cs + o), Math.round(s), Math.round(s));
  }
}
// 그라데이션 밴드 (11-26 110차, 앤드류 레퍼런스(세로 띠 대칭 그라데이션)의 원리만 · 코드는 새로 작성). 세로 띠마다 위아래 끝 색 → 물결 색 → 수평선 색으로 모이는
// 대칭 그라데이션, 물결 색 자리가 띠마다 코사인으로 조금씩 밀려 물결처럼. 글 둘레는 박스 없이 수평선 색으로 넓고 옅게, 날짜 자리(아래)도 살짝 눌러요.
// 색 10가지(어두운 8 · 연한 2). 셔플 = 띠 수 · 물결 폭 · 수평선 높이 · 흐르는 방향. 모션 = 물결이 12초에 한 바퀴 옆으로
export const GBAND_PAL = [   // [이름, 끝 색, 물결 색, 수평선 색]
  ['노을', '#FF9A5C', '#FF3D7F', '#1B0A2E'], ['바다', '#7FE6FF', '#1E7BFF', '#031335'], ['오로라', '#3DF0A6', '#4A7BFF', '#14063A'], ['보라 밤', '#F0A8FF', '#7B3CFF', '#0D0624'],
  ['숲', '#D2EC78', '#2E9E6A', '#06180F'], ['체리', '#FFC0D0', '#E8245A', '#2A0510'], ['금빛', '#FFE59A', '#E09A2A', '#1E1204'], ['먹빛', '#D5D9E0', '#6C7480', '#0C0E12'],
  ['파스텔 하늘', '#8FBEFA', '#C8DEFF', '#F6F9FF'], ['복숭아', '#FFA47A', '#FFD3BE', '#FFF8F3'],
];
export const gbandPal = (seed, pal) => pal != null && GBAND_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % GBAND_PAL.length;
export const gbandLight = (seed, pal) => { const [r, g, b] = hx3(GBAND_PAL[gbandPal(seed, pal)][3]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const gbandCache = new Map();
function gbandOf(seed) {
  if (gbandCache.has(seed)) return gbandCache.get(seed);
  const r = rng(seed ^ 0x6b2d), p = { n: 12 + Math.floor(r() * 17), span: .35 + r() * .9, amp: .25 + r() * .2, hz: .46 + r() * .08, ph: r() * 6.28, dir: r() < .5 ? 1 : -1 };
  if (gbandCache.size > 60) gbandCache.delete(gbandCache.keys().next().value);
  gbandCache.set(seed, p); return p;
}
let GB_NOISE = null;
function gbNoise() {   // 필름 노이즈 타일 (한 번만 만들어 깔아요)
  if (GB_NOISE) return GB_NOISE;
  const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'), im = x.createImageData(160, 160), r = rng(4242);
  for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - .5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0); return (GB_NOISE = c);
}
function drawGband(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = gbandOf(seed), C = GBAND_PAL[gbandPal(seed, cv.dataset.pal)], light = gbandLight(seed, cv.dataset.pal), x = cv.getContext('2d');
  const tall = H / W > 1.6, hy = H * P.hz - (tall ? .08 * W : 0), top = hy / H, bot = 1 - top, cw = W / P.n, ph = P.ph + P.dir * t / 12 * Math.PI * 2;
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  for (let i = 0; i < P.n; i++) {
    const k = .5 + .5 * Math.cos(P.span * Math.PI * 2 * (i + .5) / P.n - ph), f = .06 + P.amp * 1.9 * k, g = x.createLinearGradient(0, 0, 0, H);   // f = 물결 색 자리 (끝 → 수평선 사이 비율)
    g.addColorStop(0, C[1]); g.addColorStop(Math.min(top - .02, top * f), C[2]); g.addColorStop(top, C[3]); g.addColorStop(Math.max(top + .02, 1 - bot * f), C[2]); g.addColorStop(1, C[1]);
    x.fillStyle = g; x.fillRect(Math.floor(i * cw), 0, Math.ceil(cw) + 1, H);
  }
  const d = hx3(C[3]).map(v => Math.round(v * 255)).join(','), cy = H / 2 - (tall ? .08 * W : 0), rad = x.createRadialGradient(W / 2, cy, 0, W / 2, cy, W * .62);   // 글 둘레: 박스 없이 수평선 색으로 넓고 옅게
  rad.addColorStop(0, `rgba(${d},${light ? .55 : tall ? .6 : .5})`); rad.addColorStop(.6, `rgba(${d},${tall ? .32 : .22})`); rad.addColorStop(1, `rgba(${d},0)`);
  x.save(); x.translate(W / 2, cy); x.scale(1, tall ? 1.05 : .6); x.translate(-W / 2, -cy); x.fillStyle = rad; x.fillRect(-W, -H, W * 3, H * 3); x.restore();
  if (!light) { const b = x.createLinearGradient(0, H * .8, 0, H); b.addColorStop(0, `rgba(${d},0)`); b.addColorStop(.55, `rgba(${d},.32)`); b.addColorStop(1, `rgba(${d},.4)`); x.fillStyle = b; x.fillRect(0, H * .8, W, H * .2); }   // 날짜 자리: 밝은 끝 색을 살짝 눌러요
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 미니멀 큐브 (11-26 111차, 앤드류 레퍼런스(바닥 위 큐브 하나)의 느낌만 · 3D 라이브러리 없이 꼭짓점 8개를 직접 투영해 새로 작성). 빈 스튜디오 벽 · 바닥 위에
// 단색 큐브 하나, 벽엔 바닥선 근처 빛 번짐, 바닥엔 부드러운 그림자. 큐브는 아래 1/3에 작게, 가운데 ~ 오른쪽(날짜가 왼쪽 아래라서, 가운데면 조금 위), 글은 벽 위라 박스 없이.
// 색 10가지(벽 · 바닥 · 보색 큐브, 어두운 8 · 연한 2). 셔플 = 크기 · 자리 · 카메라 방향 · 큐브 각도. 모션 = 카메라 30초에 한 바퀴 + 큐브 10초에 구름
export const CUBE_PAL = [   // [이름, 벽, 바닥, 큐브]
  ['버건디 · 민트', '#7A1A2A', '#3E1A24', '#5BC4BE'], ['남색 · 살구', '#1B2A5A', '#121A38', '#FFB38A'], ['숲 · 분홍', '#1E4A36', '#12281F', '#FF9EB8'], ['보라 · 레몬', '#4A2A7A', '#241640', '#F4E36A'],
  ['먹 · 주황', '#2A2A2E', '#18181B', '#FF7A3D'], ['청록 · 코랄', '#0F4C5C', '#0A2A33', '#FF7F6B'], ['자두 · 하늘', '#5A1E4A', '#2E1028', '#8FD3FF'], ['올리브 · 라일락', '#4A4A1E', '#262612', '#C7A8FF'],
  ['종이 · 파랑', '#EFE9DE', '#DCD3C3', '#3F6FD8'], ['연분홍 · 초록', '#F6E4E4', '#E6CFCF', '#2F9E7A'],
];
export const cubePal = (seed, pal) => pal != null && CUBE_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % CUBE_PAL.length;
export const cubeLight = (seed, pal) => { const [r, g, b] = hx3(CUBE_PAL[cubePal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const cubeCache = new Map();
function cubeOf(seed) {
  if (cubeCache.has(seed)) return cubeCache.get(seed);
  const r = rng(seed ^ 0x51c3), p = { size: .8 + r() * .35, pos: [.5, .62, .74][Math.floor(r() * 3)], th: r() * 6.28, rx: r() * 6.28, ry: r() * 6.28 };
  if (cubeCache.size > 60) cubeCache.delete(cubeCache.keys().next().value);
  cubeCache.set(seed, p); return p;
}
const CB_V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const CB_F = [[[0, 1, 2, 3], [0, 0, -1]], [[5, 4, 7, 6], [0, 0, 1]], [[4, 0, 3, 7], [-1, 0, 0]], [[1, 5, 6, 2], [1, 0, 0]], [[3, 2, 6, 7], [0, 1, 0]], [[4, 5, 1, 0], [0, -1, 0]]];
const cbHull = P => { P = P.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
// 112차 (앤드류 T1): 원근 투영 + 끝이 있는 바닥 판. 카메라가 판 둘레를 30초에 한 바퀴 돌아 판 모서리와 공간이 같이 돌고, 큐브는 두 축으로 구르듯 돌며 떠 있어요.
// 카메라 높이는 고정이라 바닥은 늘 아래 1/4 안 (글은 벽 위). 그림자는 빛 방향으로 판 위에 눕힌 모양을 흐리게
function drawCube(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = cubeOf(seed), C = CUBE_PAL[cubePal(seed, cv.dataset.pal)], light = cubeLight(seed, cv.dataset.pal), x = cv.getContext('2d');
  const K = v => v.map(q => q * 255), wall = K(hx3(C[1])), floor = K(hx3(C[2])), cube = K(hx3(C[3])), mix = (A, B, k) => A.map((v, i) => v + (B[i] - v) * k), css = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;
  const tall = H / W > 1.6, th = P.th + t / 30 * Math.PI * 2, rx = P.rx + t / 10 * Math.PI * 2, ry = P.ry + t / 10 * Math.PI, lift = t > 0 ? Math.sin(t / 10 * Math.PI * 4) * .18 : 0;
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
  const cam = [Math.sin(th) * 9, 3.4, Math.cos(th) * 9], fw = nrm(sub([0, 1.1, 0], cam)), rt = nrm([-fw[2], 0, fw[0]]), up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
  const f = W * 1.25, X0 = W * P.pos, Y0 = H * (tall ? .87 : .76), prj = p => { const d = sub(p, cam), z = dot(d, fw); return [X0 + f * dot(d, rt) / z, Y0 - f * dot(d, up) / z]; };
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  let gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, css(mix(wall, [0, 0, 0], light ? .06 : .35))); gr.addColorStop(.7, css(mix(wall, [255, 255, 255], light ? .3 : .12))); gr.addColorStop(1, css(wall));
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  const gy = Y0 - H * .12, gl = x.createRadialGradient(X0, gy, 0, X0, gy, W * .8); gl.addColorStop(0, css(mix(wall, [255, 255, 255], light ? .5 : .22), .7)); gl.addColorStop(1, css(wall, 0));
  x.fillStyle = gl; x.fillRect(0, 0, W, H);
  const FS = 4.2, fl = [[-FS, 0, -FS], [FS, 0, -FS], [FS, 0, FS], [-FS, 0, FS]].map(prj), top = Math.min(...fl.map(p => p[1]));
  x.beginPath(); fl.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath();
  gr = x.createLinearGradient(0, top, 0, H); gr.addColorStop(0, css(mix(floor, wall, .3))); gr.addColorStop(1, css(mix(floor, [0, 0, 0], light ? .05 : .3))); x.fillStyle = gr; x.fill();
  const cxr = Math.cos(rx), sxr = Math.sin(rx), cyr = Math.cos(ry), syr = Math.sin(ry), hs = P.size * .55, C0 = [0, 1.15 + lift, 0];
  const rot = ([a, b, c]) => { const b1 = b * cxr - c * sxr, c1 = b * sxr + c * cxr; return [a * cyr + c1 * syr, b1, -a * syr + c1 * cyr]; };
  const Wv = CB_V.map(v => rot(v).map((q, i) => q * hs + C0[i])), Ld = nrm([-.5, 1, .35]);
  const shp = cbHull(Wv.map(p => { const k = p[1] / Ld[1]; return prj([p[0] - Ld[0] * k, 0, p[2] - Ld[2] * k]); })), off = W * 3;   // 그림자: 판 밖에 그리고 흐린 그림자만 옮겨 와요 (사파리도 되는 방법)
  x.save(); x.shadowColor = `rgba(0,0,0,${light ? .28 : .55})`; x.shadowBlur = W * .03; x.shadowOffsetX = off; x.fillStyle = '#000';
  x.beginPath(); shp.forEach(([a, b], i) => i ? x.lineTo(a - off, b) : x.moveTo(a - off, b)); x.closePath(); x.fill(); x.restore();
  const Pp = Wv.map(prj);
  CB_F.map(([ix, n]) => { const rn = rot(n), c = ix.reduce((a, i) => a.map((v, k) => v + Wv[i][k] / 4), [0, 0, 0]); return { ix, rn, vis: dot(rn, sub(cam, c)) > 0, dep: Math.hypot(...sub(c, cam)) }; })
    .filter(q => q.vis).sort((p, q) => q.dep - p.dep).forEach(q => {
      x.fillStyle = css(mix([0, 0, 0], cube, .45 + .55 * Math.max(0, dot(q.rn, Ld)))); x.beginPath(); q.ix.forEach((i, j) => j ? x.lineTo(Pp[i][0], Pp[i][1]) : x.moveTo(Pp[i][0], Pp[i][1])); x.closePath(); x.fill();
      x.strokeStyle = x.fillStyle; x.lineWidth = Math.max(.5, W / 700); x.stroke();   // 면 사이 틈 메우기
    });
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 큐브 컴포지션 (11-26 113차, 앤드류 레퍼런스(격자 상자 구성)의 원리만 · 코드는 새로 작성). 격자를 크고 작은 상자로 빈틈없이 채우고 붙은 상자끼리 색이 안 겹치게,
// 상자마다 비스듬한 입체(두께는 글 자리 쪽으로), 그리는 방식 4가지(세 면 입체 · 선 입체 · 앞면+선 · 옆 두 면 같은 색). 글 둘레는 박스 없이 가운데 타원에서 서서히
// 채도를 낮추고 바탕색 쪽으로(앤드류 T2: 비우지 않고). 아래 날짜 자리는 카드 높이 10%. 색 10가지(어두운 8 · 연한 2). 셔플 = 격자 · 큰 상자 비율 · 방식 섞임. 모션 = 두께 물결 8초
export const CCOMP_PAL = [   // [이름, 바탕, 다섯 색, 선 색]
  ['밤 바우하우스', '#0E0F14', ['#E4572E', '#F3C13A', '#2E86AB', '#E9E6DF', '#3BB273'], '#F4F1EA'], ['네온', '#0A0614', ['#FF3D7F', '#7B5CFF', '#2BE0C4', '#FFD23F', '#F4F1FF'], '#FFFFFF'],
  ['바다', '#061A26', ['#1E7BA8', '#5BC0EB', '#F4D35E', '#EE964B', '#E9F1F5'], '#E9F1F5'], ['숲', '#0E1A12', ['#2F7D4F', '#A3C76D', '#F2E3BC', '#D96C3B', '#7A5236'], '#F2E3BC'],
  ['와인', '#1A0A10', ['#9E2A4B', '#E07A5F', '#F2CC8F', '#81B29A', '#F4F1DE'], '#F4F1DE'], ['먹', '#111111', ['#3A3A3A', '#7A7A7A', '#BDBDBD', '#EDEDED', '#E4572E'], '#EDEDED'],
  ['보라 사막', '#160F1E', ['#6D597A', '#B56576', '#E56B6F', '#EAAC8B', '#F4E9DD'], '#F4E9DD'], ['청록 금', '#071C1C', ['#0F766E', '#14B8A6', '#FBBF24', '#F59E0B', '#ECFEFF'], '#ECFEFF'],
  ['종이', '#F2ECE1', ['#D7263D', '#1B998B', '#F46036', '#2E294E', '#C5D86D'], '#2E294E'], ['하늘 종이', '#E9F0F6', ['#3D5A80', '#98C1D9', '#EE6C4D', '#293241', '#F2CC8F'], '#293241'],
];
export const ccompPal = (seed, pal) => pal != null && CCOMP_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % CCOMP_PAL.length;
export const ccompLight = (seed, pal) => { const [r, g, b] = hx3(CCOMP_PAL[ccompPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const ccompCache = new Map();
function ccompOf(seed, asp) {   // 상자 배치는 격자 단위라 카드 비율마다 한 번만
  const key = seed + ':' + asp.toFixed(2);
  if (ccompCache.has(key)) return ccompCache.get(key);
  const r = rng(seed ^ 0x7c0f), N = 12 + Math.floor(r() * 9), big = .4 + r() * .5, maxS = 2 + Math.floor(r() * 3), mixS = r(), M = Math.ceil(asp * (N - 1)) + 1;   // 앤드류 T7: 테두리 없이 격자를 카드보다 반 칸씩 크게 깔아 가장자리까지 꽉 채워요
  const occ = Array.from({ length: M }, () => Array(N).fill(false));
  const R = [], free = (i, j, w, h) => { if (i + w > N || j + h > M) return false; for (let y = j; y < j + h; y++) for (let x = i; x < i + w; x++) if (occ[y][x]) return false; return true; };
  const put = (i, j, w, h) => { for (let y = j; y < j + h; y++) for (let x = i; x < i + w; x++) occ[y][x] = R.length + 1; R.push({ i, j, w, h }); };
  for (let k = 0; k < 900 * big; k++) { const i = Math.floor(r() * N), j = Math.floor(r() * M), s = 2 + Math.floor(r() * (maxS - 1)); let w = s, h = s; if (r() < .3) { if (r() < .5) w = s - 1; else h = s - 1; } if (free(i, j, w, h)) put(i, j, w, h); }
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) if (!occ[j][i]) put(i, j, 1, 1);
  R.forEach((q, n) => {   // 붙은 상자끼리 색이 안 겹치게 (앞에서부터 욕심껏)
    const used = new Set();
    for (let y = q.j - 1; y <= q.j + q.h; y++) for (let x = q.i - 1; x <= q.i + q.w; x++) { if (y < 0 || x < 0 || y >= M || x >= N) continue; const m = occ[y][x]; if (typeof m === 'number' && m - 1 !== n && R[m - 1].c != null) used.add(R[m - 1].c); }
    const ok = [0, 1, 2, 3, 4].filter(c => !used.has(c)); q.c = ok.length ? ok[Math.floor(r() * ok.length)] : Math.floor(r() * 5);
    q.st = r() < mixS ? 0 : 1 + Math.floor(r() * 3); q.c2 = (q.c + 1 + Math.floor(r() * 4)) % 5; q.c3 = (q.c2 + 1 + Math.floor(r() * 3)) % 5; if (q.c3 === q.c) q.c3 = (q.c3 + 1) % 5;
  });
  const p = { N, M, R };
  if (ccompCache.size > 60) ccompCache.delete(ccompCache.keys().next().value);
  ccompCache.set(key, p); return p;
}
function drawCcomp(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = ccompOf(seed, H / W), C = CCOMP_PAL[ccompPal(seed, cv.dataset.pal)], light = ccompLight(seed, cv.dataset.pal), x = cv.getContext('2d');
  const tall = H / W > 1.6, u = W / (P.N - 1), ox = -u / 2, oy = (H - P.M * u) / 2, CX = W / 2, CY = H / 2 - (tall ? .08 * W : 0), gp = u * .14, lw0 = Math.max(1, u * .06);
  const K = h => hx3(h).map(v => v * 255), BG = K(C[1]), PAL = C[2].map(K), LN = K(C[3]), mixA = light ? .9 : .78;
  const fade = (c, k) => { const gr = (c[0] + c[1] + c[2]) / 3; return `rgb(${c.map((v, i) => { v += (gr - v) * k * .7; return Math.round(v + (BG[i] - v) * k * mixA); }).join(',')})`; };   // 글 둘레: 채도 낮추고 바탕색 쪽으로
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = C[1]; x.fillRect(0, 0, W, H); x.lineJoin = 'miter';
  let lw = lw0;
  const poly = (pts, fill, stroke) => { x.beginPath(); pts.forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); } };
  const ties = (F, B, s) => { x.strokeStyle = s; x.lineWidth = lw; x.beginPath(); for (let k = 0; k < 4; k++) { x.moveTo(F[k][0], F[k][1]); x.lineTo(B[k][0], B[k][1]); } x.stroke(); };
  for (const q of P.R) {
    const bx = ox + q.i * u + gp / 2, by = oy + q.j * u + gp / 2, w = q.w * u - gp, h = q.h * u - gp, mx = bx + w / 2, my = by + h / 2;
    const wave = t > 0 ? .5 + .5 * Math.sin(t / 8 * Math.PI * 2 - Math.hypot(mx - CX, my - CY) / W * 7) : .55;
    const d = Math.min(w, h) * (.18 + .2 * wave), sx = mx < CX ? 1 : -1, sy = my < CY ? 1 : -1;   // 두께는 글 자리 쪽으로
    const fx = bx + (sx < 0 ? d : 0), fy = by + (sy < 0 ? d : 0), fw = w - d, fh = h - d;
    const F = [[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]], B = F.map(([a, b]) => [a + sx * d, b + sy * d]);
    const ex = sx > 0 ? [1, 2] : [3, 0], ey = sy > 0 ? [2, 3] : [0, 1], cn = ex[1] === ey[0] ? ex[1] : ex[0] === ey[1] ? ex[0] : ex[1];
    const SX = [F[ex[0]], F[ex[1]], B[ex[1]], B[ex[0]]], SY = [F[ey[0]], F[ey[1]], B[ey[1]], B[ey[0]]];
    const e = Math.hypot((mx - CX) / (W * (tall ? .5 : .42)), (my - CY) / (H * (tall ? .44 : .21))), sm = Math.min(1, Math.max(0, tall ? (e - .78) / .45 : (e - .55) / .7)), ed = Math.hypot((mx - W * .2) / (W * .34), (my - H * .925) / (W * .14)), sd = Math.min(1, Math.max(0, (ed - .6) / .6)), k = (light ? 1 : .95) * Math.max(1 - sm * sm * (3 - 2 * sm), .85 * (1 - sd * sd * (3 - 2 * sd)));   // 날짜 둘레도 옅게
    const c0 = fade(PAL[q.c], k), c1 = fade(PAL[q.c2], k), c2 = fade(PAL[q.c3], k), ln = fade(LN, Math.min(1, k * (light ? 1.12 : 1))); lw = lw0 * (1 - k * .4);
    if (q.st === 0) { poly(SX, c1); poly(SY, c2); poly(F, c0); }
    else if (q.st === 1) { poly(B, null, ln); ties(F, B, ln); poly(F, null, ln); }
    else if (q.st === 2) { poly(B, c1); ties(F, B, ln); poly(F, c0); }
    else { poly(SX, c1); poly(SY, c1); x.strokeStyle = ln; x.lineWidth = lw; x.beginPath(); x.moveTo(F[cn][0], F[cn][1]); x.lineTo(B[cn][0], B[cn][1]); x.stroke(); poly(F, c0); }
  }
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 블록 모더니즘 (11-26 114차, 앤드류 레퍼런스(3차원 격자 박스)의 원리만 · 3D 라이브러리 없이 꼭짓점 투영으로 새로 작성). 3차원 격자 위 판 · 기둥 모양 박스가
// 겹겹이 카드를 꽉 채우고, 박스마다 한 색의 어둡고 밝은 톤으로 면을 칠하고 면 안은 그라데이션, 입자 질감(앤드류 T3: 적당히). 글 뒤엔 아무것도 없이 카드 전체의
// 채도와 밝기 폭을 고르게 낮춰요(앤드류). 색 10가지(어두운 8 · 연한 2). 셔플 = 박스 배치 · 개수 · 보는 각도. 모션 = 묶음이 40초에 한 바퀴, 박스 길이가 10초 주기로 숨 쉬어요
export const BMOD_PAL = [   // [이름, 바탕, 다섯 색]
  ['금 · 자주', '#1A1024', ['#E3A82B', '#8E1F6E', '#3FA7B5', '#3A3F9E', '#EDE4D3']], ['바다', '#0A1A2A', ['#2D6CDF', '#45C4D9', '#F2C14E', '#E9EEF2', '#16325C']],
  ['노을', '#1C0D0D', ['#E85D3A', '#F2A541', '#7A2E5C', '#F5E1C8', '#3B1F4A']], ['숲', '#0F1A14', ['#3E8E5A', '#A7C957', '#F2E8CF', '#BC4749', '#386641']],
  ['네온', '#0C0818', ['#FF3D9A', '#6A4CFF', '#22D3C5', '#FFD23F', '#F1EEFF']], ['먹', '#121212', ['#5A5A5A', '#9A9A9A', '#D9D9D9', '#E4572E', '#2E2E2E']],
  ['청록 · 산호', '#08201F', ['#14877F', '#5FD1C1', '#FF7A5C', '#FFD7A8', '#1D3B53']], ['보라 · 레몬', '#150F24', ['#6C4AB6', '#B9A2FF', '#F4E04D', '#E85D75', '#2B2350']],
  ['종이', '#EFE8DC', ['#D1495B', '#EDAE49', '#00798C', '#30638E', '#3B3B58']], ['민트 종이', '#E6F2EE', ['#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#264653']],
];
export const bmodPal = (seed, pal) => pal != null && BMOD_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % BMOD_PAL.length;
export const bmodLight = (seed, pal) => { const [r, g, b] = hx3(BMOD_PAL[bmodPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const bmodCache = new Map();
function bmodOf(seed) {
  if (bmodCache.has(seed)) return bmodCache.get(seed);
  const r = rng(seed ^ 0x2b4d), n = 20 + Math.floor(r() * 21), B = [], BR = 1.15, GAP = .04;
  const ext = (p, sz, ax) => [0, 1, 2].map(i => (i === ax ? sz[i] * BR : sz[i]) / 2 + GAP / 2);   // 숨쉬기로 가장 길어졌을 때의 반 크기
  const hit = (p, e) => B.some(q => [0, 1, 2].every(i => Math.abs(p[i] - q.p[i]) < e[i] + q.e[i]));
  for (let k = 0, tries = 0; B.length < n && tries < n * 40; tries++) {   // 상자끼리 파고들지 않게 놓아요
    const ax = Math.floor(r() * 3), sz = [0, 0, 0].map(() => .25 + r() * .55); sz[ax] = 1.4 + r() * 1.8; if (r() < .35) sz[(ax + 1) % 3] = .9 + r() * .9;
    const p = [0, 0, 0].map(() => (Math.floor(r() * 4) - 1.5) * 1.15 + (r() - .5) * .4), ph = r() * 6.28, c = Math.floor(r() * 5);
    for (let sh = 0; sh < 4; sh++, sz[ax] *= .78) { const e = ext(p, sz, ax); if (!hit(p, e)) { B.push({ p, sz: sz.slice(), ax, ph, c, e }); break; } }
  }
  const p = { B, yaw: r() * 6.28, pitch: .5 + r() * .25 };
  if (bmodCache.size > 60) bmodCache.delete(bmodCache.keys().next().value);
  bmodCache.set(seed, p); return p;
}
const BM_V = CB_V, BM_F = CB_F;
function drawBmod(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = bmodOf(seed), C = BMOD_PAL[bmodPal(seed, cv.dataset.pal)], light = bmodLight(seed, cv.dataset.pal), x = cv.getContext('2d');
  const K = h => hx3(h).map(v => v * 255), PAL = C[2].map(K), tall = H / W > 1.6, yaw = P.yaw + t / 40 * Math.PI * 2, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch), S = W / (tall ? 3.6 : 4.2);
  const view = ([a, b, c]) => { const a1 = a * cy + c * sy, c1 = -a * sy + c * cy; return [a1, b * cp - c1 * sp, b * sp + c1 * cp]; };   // [화면 x, 화면 위, 깊이(클수록 앞)]
  const lo = light ? .52 : .05, hi = light ? .98 : .62;
  const css = c => { const gr = (c[0] + c[1] + c[2]) / 3; return `rgb(${c.map(v => { v += (gr - v) * .32; return Math.round(Math.max(0, Math.min(255, (lo + Math.max(0, Math.min(1, v / 255)) * (hi - lo)) * 255))); }).join(',')})`; };   // 전체 채도 · 밝기 폭을 고르게 낮춰요
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = css(K(C[1])); x.fillRect(0, 0, W, H);
  const L = [-.45, .8, .4], ln = Math.hypot(...L), lw = Math.max(.5, W / 700);
  const D = [-sy * cp, sp, cy * cp];   // 보는 쪽 방향(세계 좌표)
  const its = P.B.map(b => { const br = t > 0 ? 1 + .14 * Math.sin(t / 10 * Math.PI * 2 + b.ph) : 1, sz = b.sz.map((v, i) => i === b.ax ? v * br : v);
    const Pp = BM_V.map(v => view(v.map((q, i) => b.p[i] + q * sz[i] / 2)));
    return { b, Pp, lo: b.p.map((v, i) => v - sz[i] / 2), hi: b.p.map((v, i) => v + sz[i] / 2), dep: view(b.p)[2],
      x0: Math.min(...Pp.map(q => q[0])), x1: Math.max(...Pp.map(q => q[0])), y0: Math.min(...Pp.map(q => q[1])), y1: Math.max(...Pp.map(q => q[1])) }; });
  // 앞뒤 순서: 화면에서 겹치는 상자 쌍만, 서로 떨어진 축으로 어느 쪽이 앞인지 정해요(가운데 깊이로 정하면 돌다가 한 번에 뒤집혀 튀어요)
  const N = its.length, after = its.map(() => []), deg = new Array(N).fill(0);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const A = its[i], Bq = its[j]; if (A.x1 <= Bq.x0 || Bq.x1 <= A.x0 || A.y1 <= Bq.y0 || Bq.y1 <= A.y0) continue;
    let best = -1, sgn = 0, gap = -Infinity;
    for (let a = 0; a < 3; a++) { const g1 = Bq.lo[a] - A.hi[a], g2 = A.lo[a] - Bq.hi[a];
      if (g1 > gap && Math.abs(D[a]) > 1e-4) { gap = g1; best = a; sgn = 1; } if (g2 > gap && Math.abs(D[a]) > 1e-4) { gap = g2; best = a; sgn = -1; } }
    const jFront = best < 0 ? Bq.dep > A.dep : (sgn * D[best] > 0);   // B가 축의 + 쪽에 있고 그 쪽이 보는 쪽이면 B가 앞
    if (jFront) { after[i].push(j); deg[j]++; } else { after[j].push(i); deg[i]++; }
  }
  const order = [], ready = its.map((_, i) => i).filter(i => !deg[i]);
  while (order.length < N) {
    if (!ready.length) { let m = -1; for (let i = 0; i < N; i++) if (deg[i] > 0 && (m < 0 || its[i].dep < its[m].dep)) m = i; deg[m] = 0; ready.push(m); }   // 고리가 생기면 가장 뒤 상자부터
    ready.sort((p, q) => its[q].dep - its[p].dep); const i = ready.pop(); if (deg[i] < 0) continue; deg[i] = -1; order.push(i);
    for (const j of after[i]) if (deg[j] > 0 && !--deg[j]) ready.push(j);
  }
  order.map(i => its[i]).forEach(it => {
    const base = PAL[it.b.c];
    for (const [ix, nr] of BM_F) {
      if (view(nr)[2] <= 0) continue;
      const k = .42 + .58 * Math.max(0, (nr[0] * L[0] + nr[1] * L[1] + nr[2] * L[2]) / ln), tone = base.map(v => v * (.35 + .85 * k));
      const pts = ix.map(i => [W / 2 + it.Pp[i][0] * S, H / 2 - it.Pp[i][1] * S]);
      const gr = x.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]); gr.addColorStop(0, css(tone.map(v => v * 1.12))); gr.addColorStop(1, css(tone.map(v => v * .62)));
      x.beginPath(); pts.forEach(([a, c], j) => j ? x.lineTo(a, c) : x.moveTo(a, c)); x.closePath(); x.fillStyle = gr; x.fill(); x.strokeStyle = gr; x.lineWidth = lw; x.stroke();   // 면 사이 틈 메우기
    }
  });
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 웨이브 인터퍼런스 (116차): 가로 물결 · 세로 물결을 겹친 간섭무늬. 레퍼런스의 원리만 · 식과 코드는 새로 작성.
// 가로 값은 x만, 세로 값은 y만의 함수라서 줄 · 칸마다 한 번씩만 계산해요(빠름). 결 4가지: 0 차분한 파도 · 1 전기장 · 2 코스모스 · 3 네온 웨이브
export const WINT_PAL = [   // [이름, 바탕, [색1, 색2, 색3]]
  ['심해', '#03080F', ['#0F3A6E', '#1E9FD0', '#7FF2E0']], ['전기 보라', '#07040F', ['#3A1C8C', '#7A4BF0', '#7FE8FF']],
  ['코스모스', '#040311', ['#141055', '#5A1F78', '#E07AC8']], ['네온 민트', '#020A07', ['#0B5A3E', '#1FE0A0', '#D2FFEA']],
  ['노을', '#0E0505', ['#5A1420', '#E05A3A', '#FFD08A']], ['금빛', '#0A0803', ['#4A3208', '#C8902A', '#FFF0C0']],
  ['체리', '#0F040A', ['#5A0F34', '#E0407E', '#FFD0E4']], ['모노', '#060606', ['#2E2E2E', '#8A8A8A', '#F2F2F2']],
  ['종이', '#F2ECE0', ['#D8C2A0', '#9A6A3E', '#3E2614']], ['하늘빛', '#E8F0F6', ['#B6CCE2', '#4A80B8', '#16345A']]];
export const wintPal = (seed, pal) => pal != null && WINT_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % WINT_PAL.length;
export const wintLight = (seed, pal) => { const [r, g, b] = hx3(WINT_PAL[wintPal(seed, pal)][1]); return .2126 * r + .7152 * g + .0722 * b > .5; };
const wintCache = new Map();
function wintOf(seed) {
  if (wintCache.has(seed)) return wintCache.get(seed);
  const r = rng(seed ^ 0x5e17), n = 5 + Math.floor(r() * 5), WV = [];
  for (let i = 0; i < n; i++) WV.push({ d: i < 2 ? i : (r() < .5 ? 0 : 1), f: 1.2 + r() * 4.5, a: .4 + r() * .6, s: (.15 + r() * .35) * (r() < .5 ? -1 : 1), ph: r() * 6.28 });
  const p = { WV, look: (Math.floor(((seed >>> 0) || 1) / 10) + Math.floor(r() * 4)) % 4 };
  if (wintCache.size > 60) wintCache.delete(wintCache.keys().next().value);
  wintCache.set(seed, p); return p;
}
let wintCv = null;
function drawWint(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = wintOf(seed), C = WINT_PAL[wintPal(seed, cv.dataset.pal)], light = wintLight(seed, cv.dataset.pal), look = P.look;
  const rw = Math.min(W, t > 0 ? 320 : 540), rh = Math.max(1, Math.round(H * rw / W));   // 빛이 매끈해서 낮은 해상도로 그리고 부드럽게 늘려요(움직일 땐 더 낮게)
  if (!wintCv) wintCv = document.createElement('canvas'); if (wintCv.width !== rw || wintCv.height !== rh) { wintCv.width = rw; wintCv.height = rh; }
  const g = wintCv.getContext('2d'), im = g.createImageData(rw, rh), D = im.data;
  const bg = hx3(C[1]), [c1, c2, c3] = C[2].map(hx3), TP = Math.PI * 2;
  const sx = P.WV.filter(w => !w.d), sy = P.WV.filter(w => w.d), ax = sx.reduce((s, w) => s + w.a, 0), ay = sy.reduce((s, w) => s + w.a, 0);
  const TR = t > 0 ? [[0, 1], [.25, .45], [.5, .22], [.75, .1]] : [[0, 1]];   // 움직일 때만 잔상(조금 전 장면을 옅게), 저장 그림은 또렷하게
  const tw = TR.reduce((s, q) => s + q[1], 0);
  const XS = TR.map(([dt]) => { const a = new Float32Array(rw); for (let i = 0; i < rw; i++) { const u = (i + .5) / rw; let v = 0; for (const w of sx) v += w.a * Math.sin(TP * w.f * u + w.ph + (t - dt) * w.s); a[i] = v / ax; } return a; });
  const YS = TR.map(([dt]) => { const a = new Float32Array(rh); for (let j = 0; j < rh; j++) { const y = (j + .5) / rw; let v = 0; for (const w of sy) v += w.a * Math.sin(TP * w.f * y + w.ph + (t - dt) * w.s); a[j] = v / ay; } return a; });
  const glow = (d, w) => Math.exp(-(d / w) * (d / w)) + .32 * Math.exp(-d / (w * 3.2));   // 가운데 진하고 둘레로 퍼지는 빛
  const lo = light ? .42 : .02, hi = light ? .97 : (look === 3 ? .5 : look === 1 ? .56 : .66);   // 카드 전체 밝기 폭을 고르게 낮춰서 글이 읽혀요
  // 값(S 또는 줄 빛 I) → 색을 표로 미리 만들어 두고, 점마다 표만 찾아요(빠름)
  const N = 1024, LR = new Float32Array(N), LG = new Float32Array(N), LB = new Float32Array(N), LA = new Float32Array(N), cc = [0, 0, 0];
  const grad = k => { const A = k < .5 ? c1 : c2, B = k < .5 ? c2 : c3, q = k < .5 ? k / .5 : (k - .5) / .5; cc[0] = A[0] + (B[0] - A[0]) * q; cc[1] = A[1] + (B[1] - A[1]) * q; cc[2] = A[2] + (B[2] - A[2]) * q; };
  const IMAX = 2.7;   // 전기장: 가로 줄 빛 + 세로 줄 빛 (최대 약 2.64)
  for (let n = 0; n < N; n++) {
    let a = 0;
    if (look === 1) { const I = n / (N - 1) * IMAX, e = Math.max(0, I - 1);   // 가로 줄 + 세로 줄의 빛이 더해져 겹친 곳이 더 밝아요
      if (light) { a = Math.min(1, I * .7); const q = Math.min(1, e); cc[0] = c2[0] + (c3[0] - c2[0]) * q; cc[1] = c2[1] + (c3[1] - c2[1]) * q; cc[2] = c2[2] + (c3[2] - c2[2]) * q; }
      else { cc[0] = c2[0] * I * .8 + c3[0] * e * .9 + c1[0] * .35; cc[1] = c2[1] * I * .8 + c3[1] * e * .9 + c1[1] * .35; cc[2] = c2[2] * I * .8 + c3[2] * e * .9 + c1[2] * .35; } }
    else { const S = n / (N - 1) * 2 - 1;
      if (look === 0) { let k = (S + 1) / 2; k = k * k * (3 - 2 * k); grad(light ? Math.pow(k, .75) : k); if (light) a = Math.min(1, .3 + .9 * k); else { const m = .35 + .65 * k, hl = Math.pow(k, 6) * .5; cc[0] = cc[0] * m + c3[0] * hl; cc[1] = cc[1] * m + c3[1] * hl; cc[2] = cc[2] * m + c3[2] * hl; } }
      else if (look === 2) { const k = Math.pow((S + 1) / 2, 2.4); grad(light ? Math.pow(k, .6) : k); if (light) a = Math.min(1, .1 + k * 1.6); else { const m = .2 + k; cc[0] *= m; cc[1] *= m; cc[2] *= m; } }
      else { const I = glow(Math.abs(S), .03), I3 = I * I * I; if (light) { a = Math.min(1, I * .55); cc[0] = c2[0] + (c3[0] - c2[0]) * I3; cc[1] = c2[1] + (c3[1] - c2[1]) * I3; cc[2] = c2[2] + (c3[2] - c2[2]) * I3; } else { cc[0] = c2[0] * I * .9 + c3[0] * I3 * .7; cc[1] = c2[1] * I * .9 + c3[1] * I3 * .7; cc[2] = c2[2] * I * .9 + c3[2] * I3 * .7; } } }
    if (!light) { cc[0] = bg[0] + 1 - Math.exp(-cc[0] * 1.6); cc[1] = bg[1] + 1 - Math.exp(-cc[1] * 1.6); cc[2] = bg[2] + 1 - Math.exp(-cc[2] * 1.6); }   // 어두운 바탕은 빛을 더하고 부드럽게 눌러요
    LR[n] = cc[0]; LG[n] = cc[1]; LB[n] = cc[2]; LA[n] = a;
  }
  // 전기장은 줄 빛을 가로 · 세로 따로 미리 계산 (값이 x만 · y만의 함수)
  const GX = look === 1 ? XS.map(A => A.map(v => glow(Math.abs(v), .045))) : null, GY = look === 1 ? YS.map(A => A.map(v => glow(Math.abs(v), .045))) : null;
  const CX = new Float32Array(rw), CY = new Float32Array(rh);   // 코스모스 가운데 은은한 빛(가로 × 세로로 나눠 계산)
  if (look === 2 && !light) { for (let i = 0; i < rw; i++) { const d = (i + .5) / rw - .5; CX[i] = Math.exp(-d * d * 8); } for (let j = 0; j < rh; j++) { const d = (j + .5) / rh - .5; CY[j] = Math.exp(-d * d * 8) * .08; } }
  const ns = TR.length, sc = (N - 1) / 2, ic = (N - 1) / IMAX, inv = 1 / tw;
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    let ar = 0, ag = 0, ab = 0, am = 0;
    for (let s = 0; s < ns; s++) {
      const wt = TR[s][1], n = look === 1 ? Math.min(N - 1, (GX[s][i] + GY[s][j]) * ic | 0) : Math.max(0, Math.min(N - 1, ((XS[s][i] + YS[s][j]) / 2 + 1) * sc | 0));
      ar += LR[n] * wt; ag += LG[n] * wt; ab += LB[n] * wt; am += LA[n] * wt;
    }
    ar *= inv; ag *= inv; ab *= inv;
    if (look === 2 && !light) { const gl = CX[i] * CY[j]; ar += gl; ag += gl; ab += gl; }
    let r, gg, b;
    if (light) { const a = Math.min(1, am * inv * .92); r = bg[0] + (ar - bg[0]) * a; gg = bg[1] + (ag - bg[1]) * a; b = bg[2] + (ab - bg[2]) * a; }   // 밝은 바탕은 물감처럼 진해져요
    else { r = ar; gg = ag; b = ab; }
    const gr = (r + gg + b) / 3; r += (gr - r) * .2; gg += (gr - gg) * .2; b += (gr - b) * .2;
    const o = (j * rw + i) * 4;
    D[o] = (lo + Math.max(0, Math.min(1, r)) * (hi - lo)) * 255; D[o + 1] = (lo + Math.max(0, Math.min(1, gg)) * (hi - lo)) * 255; D[o + 2] = (lo + Math.max(0, Math.min(1, b)) * (hi - lo)) * 255; D[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const x = cv.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(wintCv, 0, 0, W, H);
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 스펙트럼 커브 (117차): 모서리에서 활처럼 휘어 퍼지는 매끈한 색띠. 레퍼런스 첫 화면의 원리만 · 식과 코드는 새로 작성.
// 색 = 가로 위치 × 세로 위치(곱) → 모서리 둘레로 휜 띠. 매끈한 값이라 낮은 해상도로 그리고 부드럽게 늘려요(빠름)
export const SPEC_PAL = [   // [이름, 색들(돌아가며 이어짐), 무지개?]
  ['스펙트럼', ['#E0305A', '#E0B030', '#40C060', '#30A8E0', '#7040E0', '#E040C0'], 1], ['노을', ['#2B0A3D', '#A3214F', '#EE6A3C', '#F6B851']],
  ['바다', ['#041F3D', '#0C5C8C', '#22A6C8', '#7FE0D8']], ['베리', ['#2A0630', '#7A1A6E', '#D2448E', '#F49AC0']],
  ['숲', ['#06241A', '#1C6B47', '#6DBF6A', '#D8E58A']], ['네온', ['#1A0B52', '#5B2BE0', '#E032C8', '#29D3F0']],
  ['앰버', ['#2A1402', '#8A3E0A', '#E08A1E', '#F8D27A']], ['오로라', ['#061A33', '#1F6F8B', '#39D3A0', '#B48CF0']],
  ['파스텔', ['#FBD3E0', '#F9E7B5', '#C8F0DC', '#C9D8FA']], ['라벤더', ['#E6DAFA', '#FADCE6', '#D6EEF8', '#F6F0D2']]];
export const specPal = (seed, pal) => pal != null && SPEC_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % SPEC_PAL.length;
export const specLight = (seed, pal) => { const C = SPEC_PAL[specPal(seed, pal)][1].map(hx3); return C.reduce((s, c) => s + .3 * c[0] + .59 * c[1] + .11 * c[2], 0) / C.length > .6; };
const specCache = new Map();
function specOf(seed) {
  if (specCache.has(seed)) return specCache.get(seed);
  const r = rng(seed ^ 0x3c51), p = { corner: Math.floor(r() * 4), lin: r() * .55, cyc: .85 + r() * .45, wob: .02 + r() * .05, wf: 3 + r() * 5, ph: r() * 6.28, sc: 3 + r() * 4, off: r() };
  if (specCache.size > 60) specCache.delete(specCache.keys().next().value);
  specCache.set(seed, p); return p;
}
let specCv = null;
function drawSpec(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = specOf(seed), E = SPEC_PAL[specPal(seed, cv.dataset.pal)], light = specLight(seed, cv.dataset.pal), C = E[1].map(hx3), rainbow = !!E[2];
  const rw = Math.min(W, 180), rh = Math.max(1, Math.round(H * rw / W));
  if (!specCv) specCv = document.createElement('canvas'); if (specCv.width !== rw || specCv.height !== rh) { specCv.width = rw; specCv.height = rh; }
  const g = specCv.getContext('2d'), im = g.createImageData(rw, rh), D = im.data;
  const lo = light ? .5 : .03, hi = light ? .98 : .74, ds = light ? .1 : .28, n = C.length, c = [0, 0, 0];   // 카드 전체 채도 · 밝기 폭을 고르게 낮춰서 글이 읽혀요
  const hsl = (h, sa, l) => { const a = sa * Math.min(l, 1 - l); for (let z = 0; z < 3; z++) { const k = ([0, 8, 4][z] + h * 12) % 12; c[z] = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); } };
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    let u = (i + .5) / rw, v = (j + .5) / rh;
    if (P.corner & 1) u = 1 - u; if (P.corner & 2) v = 1 - v;
    const u2 = u + Math.sin(v * P.wf + P.ph + t * .35) * P.wob, v2 = v + Math.sin(u2 * P.wf * .8 + P.ph * 1.3 + t * .3) * P.wob;   // 살짝 일렁여요
    const h = u2 * v2 * (1 - P.lin) + (u2 + v2) / 2 * P.lin;   // 곱 = 모서리 둘레로 활처럼 휜 띠
    let q = h * P.cyc + P.off + t * .02; q -= Math.floor(q);   // 시간이 지나면 색이 띠를 따라 흘러요
    if (rainbow) hsl(q, .78, .52); else { const x = q * n, k = Math.floor(x), f = x - k, sm = f * f * (3 - 2 * f), A = C[k % n], B = C[(k + 1) % n]; c[0] = A[0] + (B[0] - A[0]) * sm; c[1] = A[1] + (B[1] - A[1]) * sm; c[2] = A[2] + (B[2] - A[2]) * sm; }
    const L0 = .86 + .14 * (Math.sin(u2 * P.sc + t * .4) + Math.cos(v2 * P.sc - t * .3)) / 2, L = light ? .94 + .06 * L0 : L0;   // 은은한 밝기 물결
    const gr = (c[0] + c[1] + c[2]) / 3 * L, o = (j * rw + i) * 4;
    for (let z = 0; z < 3; z++) { const w = c[z] * L; D[o + z] = (lo + Math.max(0, Math.min(1, w + (gr - w) * ds)) * (hi - lo)) * 255; }
    D[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const x = cv.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(specCv, 0, 0, W, H);
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 3D 시티 (118차): 높낮이가 다른 네모 빌딩 숲을 위에서 비스듬히 내려다봐요. 레퍼런스의 원리만 · 3D 라이브러리 없이 꼭짓점 투영으로 새로 작성.
// 윗면은 가장 밝고 아래로 갈수록 안개(바탕색)에 묻혀요. 셔플마다 가까이 크게 / 넓게가 섞여요. 앞뒤는 겹치는 쌍만 떨어진 축 평면으로 정해요(튐 없음)
export const CITY_PAL = [   // [이름, 먼 안개(위), 아래 안개(보색), 빌딩 어두운 색, 빌딩 밝은 색] (119차: 빌딩 아래가 묻히는 안개는 빌딩 색의 보색)
  ['노랑 · 남보라', '#2A2470', '#4A24A0', '#3A2A08', '#FFD640'], ['네온 시안 · 마젠타', '#1A1240', '#B0208A', '#04202A', '#40F0FF'], ['네온 핑크 · 청록', '#0E2030', '#0E7A7A', '#3A0828', '#FF4AB0'], ['라임 · 보라', '#1E1038', '#5A1E9A', '#142A06', '#C8FF40'],
  ['보라 네온', '#2A3AB8', '#1A50C0', '#3A1060', '#E048E8'], ['노을 · 청보라', '#3A1840', '#2A3A9A', '#3A0C1E', '#FFB060'], ['오렌지 · 딥블루', '#0A1A3A', '#0A3A8A', '#3A1404', '#FF8A30'], ['모노 · 레드', '#1A1A1E', '#8A1A2A', '#0E0E10', '#E8E8EC'],
  ['흰 도시 · 하늘', '#DDE2E8', '#9CC4E8', '#9098A0', '#FFFFFF'], ['크림 · 라벤더', '#EFE8DC', '#C8B4E8', '#A89A88', '#FFF8EC']];
const cityHue = (c, deg) => { const a = deg * Math.PI / 180, co = Math.cos(a), si = Math.sin(a), k = 1 / 3, s3 = Math.sqrt(k), m0 = co + (1 - co) * k, m1 = k * (1 - co) - s3 * si, m2 = k * (1 - co) + s3 * si;
  return [c[0] * m0 + c[1] * m1 + c[2] * m2, c[0] * m2 + c[1] * m0 + c[2] * m1, c[0] * m1 + c[1] * m2 + c[2] * m0]; };   // 색상 돌리기(밝기 거의 그대로)
export const cityPal = (seed, pal) => pal != null && CITY_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % CITY_PAL.length;
export const cityLight = (seed, pal) => { const [r, g, b] = hx3(CITY_PAL[cityPal(seed, pal)][1]); return .3 * r + .59 * g + .11 * b > .6; };
const cityCache = new Map();
function cityOf(seed) {
  if (cityCache.has(seed)) return cityCache.get(seed);
  const r = rng(seed ^ 0x71c3), N = 11, B = [];
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) { if (r() < .14) continue;
    const s = .5 + r() * .38, x = i - (N - 1) / 2 + (r() - .5) * (1 - s) * .8, z = k - (N - 1) / 2 + (r() - .5) * (1 - s) * .8, h = .25 + Math.pow(r(), 2.2) * 4.2, d = r();
    B.push({ x, z, sx: s, sz: s * (.8 + r() * .4), h, ph: r() * 6.28 });
    if (d < .2 && h > 1) B.push({ x: x + (r() - .5) * s * .3, z: z + (r() - .5) * s * .3, sx: s * .35, sz: s * .2, h: .12, top: B.length - 1 });   // 옥상 상자
    else if (d < .28 && h > 1.5) B.push({ x, z, sx: .05, sz: .05, h: .6 + r() * .8, top: B.length - 1 }); }   // 안테나
  const p = { B, yaw: r() * 6.28, pitch: .62 + r() * .32, zoom: r() < .5 ? 1 : 0 };
  if (cityCache.size > 60) cityCache.delete(cityCache.keys().next().value);
  cityCache.set(seed, p); return p;
}
const CITY_F = [[[0, 2, 6, 4], [-1, 0, 0]], [[1, 3, 7, 5], [1, 0, 0]], [[0, 1, 5, 4], [0, -1, 0]], [[2, 3, 7, 6], [0, 1, 0]], [[0, 1, 3, 2], [0, 0, -1]], [[4, 5, 7, 6], [0, 0, 1]]];   // 꼭짓점 번호: 1=x, 2=y, 4=z
function drawCity(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = cityOf(seed), E = CITY_PAL[cityPal(seed, cv.dataset.pal)], light = cityLight(seed, cv.dataset.pal), x = cv.getContext('2d');
  const bl = t > 0 ? (1 - Math.cos(t / 20 * Math.PI * 2)) / 2 : 0, hr = c => bl ? cityHue(c, bl * 50) : c;   // 색 블렌딩: 20초에 한 번 이웃 색 쪽으로 섞였다 돌아와요
  const fog = hr(hx3(E[1])), low = hr(hx3(E[2])), A = hr(hx3(E[3])), Bc = hr(hx3(E[4])), tall = H / W > 1.6;
  const lo = light ? .42 : .02, hi = light ? .98 : .76, ds = light ? .1 : .22;   // 카드 전체 채도 · 밝기 폭을 고르게 낮춰서 글이 읽혀요
  const css = (c, a) => { const g = (c[0] + c[1] + c[2]) / 3, v = c.map(q => Math.round((lo + Math.max(0, Math.min(1, q + (g - q) * ds)) * (hi - lo)) * 255)); return a == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${a})`; };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const yaw = P.yaw + t / 60 * Math.PI * 2, pit = P.pitch, D = P.zoom ? 6.2 : 10, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);   // 카메라가 60초에 한 바퀴
  const F = W * (tall ? 1.9 : 1.6) * (P.zoom ? .95 : 1), Y0 = P.zoom ? 1.6 : 1.0, cam = [sy * cp * D, Y0 + sp * D, cy * cp * D];
  const proj = (px, py, pz) => { const X = px * cy - pz * sy, Z0 = px * sy + pz * cy, Yr = py - Y0, yc = Yr * cp - Z0 * sp, zc = Yr * sp + Z0 * cp, dz = D - zc; return [W / 2 + X / dz * F, H / 2 - yc / dz * F, dz]; };
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; { const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, css(mix(fog, low, .35))); bg.addColorStop(1, css(low)); x.fillStyle = bg; x.fillRect(0, 0, W, H); }   // 땅 = 아래 안개(보색)
  const pul = () => 1;   // 119차: 빌딩 높이 숨쉬기 뺌(회전만)
  const its = [];
  for (const b of P.B) {
    const base = b.top != null ? P.B[b.top].h * pul(P.B[b.top]) : 0, h = b.top != null ? b.h : b.h * pul(b);
    const lo3 = [b.x - b.sx / 2, base, b.z - b.sz / 2], hi3 = [b.x + b.sx / 2, base + h, b.z + b.sz / 2], V = [];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, ok = true;
    for (let q = 0; q < 8; q++) { const v = proj(q & 1 ? hi3[0] : lo3[0], q & 2 ? hi3[1] : lo3[1], q & 4 ? hi3[2] : lo3[2]); if (v[2] <= .5) ok = false; V.push(v); x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }
    if (!ok || x1 < -W * .05 || x0 > W * 1.05 || y1 < -H * .05 || y0 > H * 1.05) continue;
    its.push({ lo3, hi3, V, x0, x1, y0, y1, dist: Math.hypot(b.x - cam[0], base + h / 2 - cam[1], b.z - cam[2]) });
  }
  const N = its.length, aft = its.map(() => []), deg = new Array(N).fill(0);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const Pq = its[i], Q = its[j]; if (Pq.x1 <= Q.x0 || Q.x1 <= Pq.x0 || Pq.y1 <= Q.y0 || Q.y1 <= Pq.y0) continue;
    let best = -1, gap = -1e9, pl = 0, qHi = false;
    for (let a = 0; a < 3; a++) { const g1 = Q.lo3[a] - Pq.hi3[a], g2 = Pq.lo3[a] - Q.hi3[a]; if (g1 > gap) { gap = g1; best = a; pl = (Q.lo3[a] + Pq.hi3[a]) / 2; qHi = true; } if (g2 > gap) { gap = g2; best = a; pl = (Pq.lo3[a] + Q.hi3[a]) / 2; qHi = false; } }
    const qFront = gap > -1e-6 ? (cam[best] > pl) === qHi : Q.dist < Pq.dist;   // 떨어진 축 평면에서 카메라 쪽 상자가 앞
    if (qFront) { aft[i].push(j); deg[j]++; } else { aft[j].push(i); deg[i]++; }
  }
  const ord = [], ready = its.map((_, i) => i).filter(i => !deg[i]);
  while (ord.length < N) {
    if (!ready.length) { let m = -1; for (let i = 0; i < N; i++) if (deg[i] > 0 && (m < 0 || its[i].dist > its[m].dist)) m = i; deg[m] = 0; ready.push(m); }
    ready.sort((p, q) => its[p].dist - its[q].dist); const i = ready.pop(); if (deg[i] < 0) continue; deg[i] = -1; ord.push(i); for (const j of aft[i]) if (deg[j] > 0 && !--deg[j]) ready.push(j);
  }
  const L = [-.5, .8, .35], near = P.zoom ? 4 : 6, far = P.zoom ? 14 : 18, lw = Math.max(.5, W / 660);
  for (const i of ord) {
    const it = its[i], fd = Math.max(0, Math.min(1, (it.dist - near) / (far - near))) * .5;
    for (const [ix, nr] of CITY_F) {
      const fx = nr[0] > 0 ? it.hi3[0] : it.lo3[0], fy = nr[1] > 0 ? it.hi3[1] : it.lo3[1], fz = nr[2] > 0 ? it.hi3[2] : it.lo3[2];
      if ((cam[0] - fx) * nr[0] + (cam[1] - fy) * nr[1] + (cam[2] - fz) * nr[2] <= 0) continue;
      const k = Math.max(0, nr[0] * L[0] + nr[1] * L[1] + nr[2] * L[2]), topC = nr[1] > 0 ? mix(Bc, [1, 1, 1], .08) : mix(A, Bc, .1 + .8 * Math.pow(k, 1.3));   // 윗면은 가장 밝게
      if (nr[1] > 0) x.fillStyle = css(mix(topC, fog, fd));
      else { const mx = (it.lo3[0] + it.hi3[0]) / 2, mz = (it.lo3[2] + it.hi3[2]) / 2, pT = proj(mx, it.hi3[1], mz), pB = proj(mx, it.lo3[1], mz), g = x.createLinearGradient(pT[0], pT[1], pB[0], pB[1]);
        g.addColorStop(0, css(mix(topC, fog, fd))); g.addColorStop(1, css(mix(mix(topC, fog, Math.min(1, fd + .42 + .2 * (1 - Math.min(1, it.lo3[1] / 2)))), low, .75))); x.fillStyle = g; }   // 아래로 갈수록 안개에 묻혀요
      x.beginPath(); for (let q = 0; q < 4; q++) { const v = it.V[ix[q]]; q ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1]); } x.closePath(); x.fill(); x.strokeStyle = x.fillStyle; x.lineWidth = lw; x.stroke();
    }
  }
  const dg = x.createRadialGradient(0, H, 0, 0, H, W * .55); dg.addColorStop(0, css(fog, .55)); dg.addColorStop(1, css(fog, 0)); x.fillStyle = dg; x.fillRect(0, 0, W, H);   // 날짜 자리는 안개 조금 더
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 컬러 블롭 (120차): 격자 위 무작위 값을 부드럽게 이은 얼룩이 색 바퀴를 돌며 색띠가 생겨요(열화상 느낌). 레퍼런스의 원리만 · 식과 코드는 새로 작성.
// 모션: 아주 느린 흐름(30초에 한 칸) + 덩어리마다 다른 때에 부풀었다 가라앉는 펌핑(7초). 매끈해서 낮은 해상도로 그리고 부드럽게 늘려요
export const BLOB_PAL = [   // [이름, 색들(돌아가며 이어짐), 무지개?]
  ['열화상', ['#E04848', '#E0C040', '#40C080', '#3070E0', '#A040D0'], 1], ['노을', ['#2B0A3D', '#A3214F', '#EE6A3C', '#F6B851']], ['바다', ['#041F3D', '#0C5C8C', '#22A6C8', '#7FE0D8']], ['네온', ['#1A0B52', '#5B2BE0', '#E032C8', '#29D3F0']],
  ['숲', ['#06241A', '#1C6B47', '#6DBF6A', '#D8E58A']], ['베리', ['#2A0630', '#7A1A6E', '#D2448E', '#F49AC0']], ['앰버', ['#2A1402', '#8A3E0A', '#E08A1E', '#F8D27A']], ['모노', ['#0E0E10', '#4A4A50', '#9A9AA0', '#E8E8EC']],
  ['파스텔', ['#F6B8CC', '#F4DC94', '#A8E4C4', '#A8C0F4']], ['라벤더', ['#CDB8F4', '#F4B8D0', '#B0DCF0', '#F0E2A8']]];
export const blobPal = (seed, pal) => pal != null && BLOB_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % BLOB_PAL.length;
export const blobLight = (seed, pal) => { const C = BLOB_PAL[blobPal(seed, pal)][1].map(hx3); return C.reduce((s, c) => s + .3 * c[0] + .59 * c[1] + .11 * c[2], 0) / C.length > .6; };
const blobCache = new Map();
function blobOf(seed) {
  if (blobCache.has(seed)) return blobCache.get(seed);
  const r = rng(seed ^ 0x6b10), p = { n: 4 + Math.floor(r() * 6), cyc: .8 + r() * .7, off: r(), s: Math.floor(r() * 1e6), dx: .7 + r() * .3, dy: .4 + r() * .4 };
  if (blobCache.size > 60) blobCache.delete(blobCache.keys().next().value);
  blobCache.set(seed, p); return p;
}
const blobH = (x, y, s) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
const blobN = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = blobH(xi, yi, s), b = blobH(xi + 1, yi, s), c = blobH(xi, yi + 1, s), d = blobH(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
let blobCv = null;
function drawBlob(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = blobOf(seed), E = BLOB_PAL[blobPal(seed, cv.dataset.pal)], light = blobLight(seed, cv.dataset.pal), C = E[1].map(hx3), rainbow = !!E[2], n = C.length;
  const rw = Math.min(W, t > 0 ? 200 : 360), rh = Math.max(1, Math.round(H * rw / W));   // 저장 그림은 더 촘촘히
  if (!blobCv) blobCv = document.createElement('canvas'); if (blobCv.width !== rw || blobCv.height !== rh) { blobCv.width = rw; blobCv.height = rh; }
  const g = blobCv.getContext('2d'), im = g.createImageData(rw, rh), D = im.data;
  const lo = light ? .45 : .03, hi = light ? .98 : .72, ds = light ? .05 : .3, fl = t / 30, c = [0, 0, 0];   // 카드 전체 채도 · 밝기 폭을 고르게 낮춰서 글이 읽혀요
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    const x = i / rw * P.n + fl * P.dx, y = j / rw * P.n + fl * P.dy;
    let v = blobN(x, y, P.s) * .78 + blobN(x * 2.1 + 5, y * 2.1 + 9, P.s + 7) * .22;
    if (t > 0) v += .07 * Math.sin(t / 7 * Math.PI * 2 + blobN(x * .5, y * .5, P.s + 3) * Math.PI * 2);   // 덩어리마다 다른 때에 부풀었다 가라앉아요
    let q = v * P.cyc + P.off; q -= Math.floor(q);
    if (rainbow) { c[0] = .5 + .5 * Math.cos(q * 6.283); c[1] = .5 + .5 * Math.cos(q * 6.283 + 2); c[2] = .5 + .5 * Math.cos(q * 6.283 + 4); }
    else { const xq = q * n, k = Math.floor(xq), f = xq - k, sm = f * f * (3 - 2 * f), A = C[k % n], B = C[(k + 1) % n]; c[0] = A[0] + (B[0] - A[0]) * sm; c[1] = A[1] + (B[1] - A[1]) * sm; c[2] = A[2] + (B[2] - A[2]) * sm; }
    const gr = (c[0] + c[1] + c[2]) / 3, o = (j * rw + i) * 4;
    for (let z = 0; z < 3; z++) D[o + z] = (lo + Math.max(0, Math.min(1, c[z] + (gr - c[z]) * ds)) * (hi - lo)) * 255;
    D[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const x = cv.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low'; x.drawImage(blobCv, 0, 0, W, H);
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 웨이브 렌즈 (122차): 가로줄들이 원 밖에서는 물결로 흐르고, 원 안에 들어오면 팽팽한 직선으로 펴져요(밖은 변화 · 안은 질서). 레퍼런스의 원리만 · 식과 코드는 새로 작성.
// 셔플 = 물결 스타일 6(잔잔 · 큰 물결 · 거친 노이즈 · 리플 · 소용돌이 · 촘촘) × 선 종류 4(실선 · 대시 · 점선 · 글로우) × 줄 개수 · 원 크기(지름 = 카드 폭 74~90%).
// 원은 글 자리 뒤, 원 안 직선은 옅게 해서 글이 읽혀요. 모션 = 물결 흐름 + 출렁임 6초 · 원 숨쉬기 10초 · 소용돌이 감김 12초
export const LENS_PAL = [   // [이름, 바탕, 줄 색(위 → 아래), 원 색, 밝은 바탕?]
  ['스펙트럼', '#050507', ['#3FE0C0', '#4A9BF0', '#8A5CF0', '#E050C8', '#F05A5A', '#F0A040', '#E8E060'], '#8CF08C'],
  ['오로라', '#03080A', ['#7CF0A0', '#30D0B0', '#2A9CE0', '#3A5CD8', '#6A40C8'], '#C8F8E0'],
  ['노을', '#0A0508', ['#F8D860', '#F89A40', '#F05A70', '#C040A0', '#6A3AC0'], '#FFE8B0'],
  ['아이스', '#04070C', ['#F0F8FF', '#A8E4F8', '#58B8F0', '#3A78E0', '#2A48A8'], '#FFFFFF'],
  ['네온', '#06040C', ['#30F0F0', '#6A8CFF', '#B050FF', '#FF40C0', '#FF4080'], '#30F0F0'],
  ['앰버', '#0A0603', ['#FFE0A0', '#F8B848', '#F08030', '#D84A28', '#A02A30'], '#FFD070'],
  ['라임 · 보라', '#06060A', ['#D8F860', '#80E070', '#40B8A0', '#6A68D8', '#A848E0'], '#D8F860'],
  ['모노 · 레드', '#060606', ['#F0F0F0', '#B8B8B8', '#808080', '#B8B8B8', '#F0F0F0'], '#FF4A3A'],
  ['크림', '#F4EEE2', ['#2A3A7A', '#4A62B0', '#D0566A', '#E08848', '#3A9A8A'], '#D0566A', 1],
  ['라벤더', '#EEEAF6', ['#5A3AA0', '#8A58C8', '#D05AA0', '#4A80C8', '#3A5AA0'], '#5A3AA0', 1]];
export const lensPal = (seed, pal) => pal != null && LENS_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % LENS_PAL.length;
export const lensLight = (seed, pal) => !!LENS_PAL[lensPal(seed, pal)][4];
const lensCache = new Map();
function lensOf(seed) {
  if (lensCache.has(seed)) return lensCache.get(seed);
  const r = rng(seed ^ 0x1e45), p = { n: 34 + Math.floor(r() * 30), R: .74 + r() * .16, ph: r() * 6.283, nz: r() * 1e3, st: Math.floor(r() * 6), lt: Math.floor(r() * 4) };
  if (lensCache.size > 60) lensCache.delete(lensCache.keys().next().value);
  lensCache.set(seed, p); return p;
}
const LENS_ST = [[4, .03, 1.5], [14, .022, 2], [6, .05, 11], [9, .06, 1.5], [7, .035, 2], [3.5, .1, 1]];   // [물결 높이, 촘촘함, 노이즈] (520px 기준)
function drawLens(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = lensOf(seed), E = LENS_PAL[lensPal(seed, cv.dataset.pal)], light = !!E[4], x = cv.getContext('2d'), s = W / 520, st = P.st, LT = P.lt;
  const CX = W / 2, CY = H / 2 - (H / W > 1.6 ? .04 * H : 0), R = P.R * W / 2 * (t > 0 ? 1 + .04 * Math.sin(t / 10 * 6.283) : 1), br = t > 0 ? 1 + .3 * Math.sin(t / 6 * 6.283) : 1;
  const SP = LENS_ST[st], A = SP[0] * br * s, f = SP[1] / s, NA = SP[2] * s, n = Math.round(P.n * H / W / 1.25);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.shadowBlur = 0; x.setLineDash([]);
  x.fillStyle = E[1]; x.fillRect(0, 0, W, H);
  const C = E[2].map(h => hx3(h).map(v => v * 255)), col = q => { const m = C.length - 1, k = Math.min(m - 1, Math.floor(q * m)), ff = q * m - k, a = C[k], b = C[k + 1]; return a.map((v, z) => Math.round(v + (b[z] - v) * ff)); };
  const [cr, cg, cb] = hx3(E[3]).map(v => Math.round(v * 255)), g = x.createRadialGradient(CX, CY, 0, CX, CY, R); g.addColorStop(0, `rgba(${cr},${cg},${cb},${light ? .1 : .12})`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  x.fillStyle = g; x.beginPath(); x.arc(CX, CY, R, 0, 6.283); x.fill();
  const nz = (a, b) => Math.sin(a * 1.7 + b * 2.3 + P.nz) * .5 + Math.sin(a * .73 - b * 1.1 + P.nz * 2) * .3 + Math.sin(a * 3.9 + b * 4.1 + P.nz * 3) * .2;
  const rot = st === 4 ? 1.1 + (t > 0 ? .35 * Math.sin(t / 12 * 6.283) : 0) : 0, nzs = (st === 2 ? .025 : .01) / s, nzy = (st === 2 ? .03 : .01) / s, R2 = R * R;
  const dash = LT === 1 ? [7 * s, 5 * s] : LT === 2 ? [.1 * s, 4.2 * s] : [];
  x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash(dash);
  const lw = (light ? 1.5 : 1.3) * s * (LT === 2 ? 2.2 : LT === 3 ? 1.4 : 1), step = 3 * s, outs = [], chs = [];
  for (let i = 0; i < n; i++) {
    const y0 = (i + .5) * H / n, ph = i * .2 + P.ph;
    let out = null, inside = false, last = null; const segs = [], chords = [];
    for (let px = -W * .3; px <= W * 1.3; px += step) {
      let qx = px, qy;
      if (st === 3) { const d = Math.hypot(px - CX, y0 - CY); qy = y0 + A * Math.sin(d * f - t * 1.5 + P.ph) * Math.min(1, d / R * .9); }
      else qy = y0 + A * Math.sin(px * f - t * 1.2 + ph);
      qy += NA * nz(px * nzs + t * .05, y0 * nzy);
      if (rot) { const dx = qx - CX, dy = qy - CY, d = Math.hypot(dx, dy), k = rot * Math.max(0, 1 - d / (W * .85)) ** 1.5, a = Math.atan2(dy, dx) + k; qx = CX + Math.cos(a) * d; qy = CY + Math.sin(a) * d; }
      const inn = (qx - CX) * (qx - CX) + (qy - CY) * (qy - CY) < R2;
      if (inn && !inside) { if (out) { out.push(qx, qy); segs.push(out); out = null; } last = [qx, qy]; inside = true; }
      else if (!inn && inside) { chords.push(last[0], last[1], qx, qy); out = [qx, qy]; inside = false; }
      else if (!inn) { if (!out) out = []; out.push(qx, qy); }
    }
    if (out) segs.push(out);
    const c = col(n > 1 ? i / (n - 1) : 0), cs = `rgb(${c.join(',')})`;
    x.strokeStyle = cs; x.lineWidth = lw;
    if (LT === 3 && !light) { x.shadowColor = cs; x.shadowBlur = 10 * s; }
    x.globalAlpha = light ? .75 : .85; x.beginPath();
    for (const sg of segs) { x.moveTo(sg[0], sg[1]); for (let k = 2; k < sg.length; k += 2) x.lineTo(sg[k], sg[k + 1]); }
    x.stroke(); x.shadowBlur = 0;
    x.globalAlpha = light ? .4 : .42; x.beginPath();   // 원 안 직선은 옅게 (글 자리)
    for (let k = 0; k < chords.length; k += 4) { x.moveTo(chords[k], chords[k + 1]); x.lineTo(chords[k + 2], chords[k + 3]); }
    x.stroke();
  }
  x.setLineDash([]); x.globalAlpha = .9; x.strokeStyle = E[3]; x.lineWidth = 1.6 * s;
  if (!light) { x.shadowColor = E[3]; x.shadowBlur = 10 * s; }
  x.beginPath(); x.arc(CX, CY, R, 0, 6.283); x.stroke(); x.shadowBlur = 0; x.globalAlpha = 1;
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 컬러 필드 (123차): 크고 작은 직사각형(1~4칸)이 빈틈없이 맞물려 카드를 채우고, 블록마다 두 색이 다른 방향으로 그라데이션(가끔 스트라이프 · 방사형). 레퍼런스의 원리만 · 식과 코드는 새로 작성.
// 앤드류(시안 v4): 글 뒤를 가리거나 따로 칠하는 것 없이 카드 전체가 한 규칙 · 채도는 쨍하게, 너무 밝은 색만 한 단계 진하게(밝은 묶음은 어두운 색만 옅게) · 글자엔 아주 옅은 그림자(app.css .fsh)
// 모션 = 블록은 그대로, 블록마다 그라데이션 방향이 다른 때에 천천히 돌고 흔들려요(10초)
export const FIELD_PAL = [   // [이름, 색 5, 밝은 바탕?]
  ['코발트 · 라임', ['#1430E0', '#B8F020', '#20C0F0', '#6A20D0', '#F0F0F0']], ['마젠타 · 오렌지', ['#E0108A', '#FF7A10', '#FFD020', '#7A10C0', '#FF3A3A']],
  ['비비드 원색', ['#E82020', '#1A40E0', '#FFD010', '#10A050', '#F0F0F0']], ['네온', ['#FF2AD0', '#2AF0F0', '#7A2AFF', '#F0FF2A', '#2A50FF']],
  ['에메랄드 · 핑크', ['#00A880', '#FF5AA0', '#10D0C0', '#C02070', '#F8C0D0']], ['선셋', ['#FF4A1A', '#FFB01A', '#E0105A', '#7A1AA0', '#2A1A80']],
  ['딥 블루 · 골드', ['#0A1A80', '#2A60F0', '#F0B020', '#FFE070', '#10308A']], ['레드 · 블랙', ['#E01A1A', '#1A1A1A', '#FF6A3A', '#5A0A0A', '#F0F0F0']],
  ['색종이', ['#FFD23A', '#FF7AA8', '#4AC8F0', '#7AE07A', '#FFFFFF'], 1], ['시트러스', ['#FFE04A', '#B8F04A', '#FF9A3A', '#FFF4C0', '#6AE0C0'], 1]];
export const fieldPal = (seed, pal) => pal != null && FIELD_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % FIELD_PAL.length;
export const fieldLight = (seed, pal) => !!FIELD_PAL[fieldPal(seed, pal)][2];
const fieldCache = new Map();
function fieldOf(seed, asp) {   // 블록 배치는 격자 단위라 카드 비율마다 한 번만
  const key = seed + ':' + asp.toFixed(2);
  if (fieldCache.has(key)) return fieldCache.get(key);
  const r = rng(seed ^ 0x3f1e), N = 5 + Math.floor(r() * 4), mix = r() < .5 ? 0 : .15 + r() * .15, M = Math.ceil(asp * N), occ = Array.from({ length: M }, () => Array(N).fill(0)), B = [];
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    if (occ[j][i]) continue;
    let w = 1 + Math.floor(r() ** 1.4 * 4), h = 1 + Math.floor(r() ** 1.4 * 4);
    while (w > 1 && (i + w > N || occ[j].slice(i, i + w).some(Boolean))) w--;
    h = Math.min(h, M - j);
    for (let y = j; y < j + h; y++) for (let k = i; k < i + w; k++) occ[y][k] = 1;
    const a = Math.floor(r() * 5); let b = Math.floor(r() * 4); if (b >= a) b++;
    B.push({ i, j, w, h, a, b, ang: r() * 6.283, ph: r() * 6.283, dir: r() < .5 ? -1 : 1, kind: r() < mix ? (r() < .5 ? 1 : 2) : 0, sw: 6 + Math.floor(r() * 8), rx: r(), ry: r() });
  }
  const p = { N, M, B };
  if (fieldCache.size > 60) fieldCache.delete(fieldCache.keys().next().value);
  fieldCache.set(key, p); return p;
}
function drawField(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = fieldOf(seed, H / W), E = FIELD_PAL[fieldPal(seed, cv.dataset.pal)], light = !!E[2], x = cv.getContext('2d'), u = W / P.N;
  const C = E[1].map(h => { const c = hx3(h), L = .3 * c[0] + .59 * c[1] + .11 * c[2], k = light ? Math.min(1, .28 / Math.max(.01, 1 - L)) : Math.min(1, .5 / Math.max(.01, L)); return 'rgb(' + c.map(v => Math.round((light ? 1 - (1 - v) * k : v * k) * 255)).join(',') + ')'; });   // 채도는 그대로, 밝기만
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  const T = t > 0 ? t / 10 * 6.283 : 0;
  for (const q of P.B) {
    const bx = q.i * u, by = q.j * u, bw = q.w * u, bh = q.h * u, cx = bx + bw / 2, cy = by + bh / 2, CA = C[q.a], CB = C[q.b];
    const ang = q.ang + (t > 0 ? q.dir * T * .25 + .5 * Math.sin(T + q.ph) : 0), L = Math.hypot(bw, bh) / 2, dx = Math.cos(ang) * L, dy = Math.sin(ang) * L;
    let g;
    if (q.kind === 2) { const px = bx + bw * q.rx, py = by + bh * q.ry; g = x.createRadialGradient(px, py, 0, px, py, Math.hypot(bw, bh) * (.8 + (t > 0 ? .15 * Math.sin(T + q.ph) : 0))); }
    else g = x.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    if (q.kind === 1) for (let k = 0; k <= q.sw; k++) { const ca = k % 2 ? CA : CB; g.addColorStop(Math.min(1, k / q.sw), ca); g.addColorStop(Math.min(1, (k + .999) / q.sw), ca); }
    else { g.addColorStop(0, CA); g.addColorStop(1, CB); }
    x.fillStyle = g; x.fillRect(bx, by, bw + 1, bh + 1);
  }
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 리퀴드 (124차): 그라데이션 원(일부 길쭉하게)을 흩뿌린 그림을 노이즈로 크게 휘게 해서 녹아 엉긴 광택 액체 덩어리로. 레퍼런스의 원리만 · p5 · 셰이더 없이 새로 작성.
// 글 뒤를 가리지 않고 너무 밝은 색만 한 단계 진하게 + 글자에 옅은 그림자(컬러 필드와 같은 .fsh). 모션 = 휘는 흐름이 아주 천천히(20초) · 원들도 조금씩 떠다녀요
export const LIQUID_PAL = [   // [이름, 바탕, 색 3, 밝은 바탕?]
  ['레드 · 바이올렛', '#141016', ['#D8282A', '#8A50F0', '#F07070']], ['코발트 · 오렌지', '#0A0C18', ['#2040D8', '#FF7A20', '#60A0FF']],
  ['마젠타 · 라임', '#100A10', ['#E02AA0', '#B8E030', '#FF80C8']], ['틸 · 코랄', '#071414', ['#10A0A0', '#FF6A5A', '#7AE0D0']],
  ['골드 · 네이비', '#080C1C', ['#F0B020', '#1A3A9A', '#FFE080']], ['바이올렛 · 시안', '#0C0818', ['#7A30F0', '#20D0F0', '#C090FF']],
  ['에메랄드 · 핑크', '#06120E', ['#10A070', '#FF5A9A', '#80E0B0']], ['모노 · 레드', '#0E0E0E', ['#D8D8D8', '#D82020', '#808080']],
  ['피치', '#FFF4EC', ['#FF8A6A', '#FFC86A', '#FF6A9A'], 1], ['스카이', '#EEF6FF', ['#5AA0FF', '#9AE0F0', '#B08AFF'], 1]];
export const liquidPal = (seed, pal) => pal != null && LIQUID_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % LIQUID_PAL.length;
export const liquidLight = (seed, pal) => !!LIQUID_PAL[liquidPal(seed, pal)][3];
const liquidCache = new Map();
function liquidOf(seed) {
  if (liquidCache.has(seed)) return liquidCache.get(seed);
  const r = rng(seed ^ 0x51d7), n = 26 + Math.floor(r() * 26), big = .9 + r() * .6, p = { wp: .1 + r() * .1, fs: 1.6 + r() * 1.4, s: Math.floor(r() * 1e5), O: [] };
  for (let i = 0; i < n; i++) p.O.push({ x: r(), y: r(), dx: (r() - .5) * .3, dy: (r() - .5) * .3, R: (.08 + r() ** 1.6 * .3) * big, ci: Math.floor(r() * 3), hi: r() < .5, cj: Math.floor(r() * 2), rad: r() < .6, ex: .7 + r() * .6, rot: r() * 3.14 });
  if (liquidCache.size > 60) liquidCache.delete(liquidCache.keys().next().value);
  liquidCache.set(seed, p); return p;
}
const lqH = (x, y, s) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
const lqN = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = lqH(xi, yi, s), b = lqH(xi + 1, yi, s), c = lqH(xi, yi + 1, s), d = lqH(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const lqF = (x, y, s) => lqN(x, y, s) * .6 + lqN(x * 2.03 + 3, y * 2.03 + 7, s + 1) * .28 + lqN(x * 4.1 + 11, y * 4.1 + 5, s + 2) * .12;
let lqSrc = null, lqOut = null;
function drawLiquid(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = liquidOf(seed), E = LIQUID_PAL[liquidPal(seed, cv.dataset.pal)], light = !!E[3];
  const cap = c => { const L = .3 * c[0] + .59 * c[1] + .11 * c[2], k = light ? Math.min(1, .3 / Math.max(.01, 1 - L)) : Math.min(1, .52 / Math.max(.01, L)); return c.map(v => light ? 1 - (1 - v) * k : v * k); };   // 채도는 그대로, 너무 밝은 색만 한 단계 진하게
  const C = E[2].map(h => cap(hx3(h))), rgb = c => `rgb(${c.map(v => Math.round(v * 255)).join(',')})`, mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  // 1) 그라데이션 원을 흩뿌린 바탕 그림
  const sw = 240, sh = Math.max(1, Math.round(sw * H / W));
  if (!lqSrc) lqSrc = document.createElement('canvas'); if (lqSrc.width !== sw || lqSrc.height !== sh) { lqSrc.width = sw; lqSrc.height = sh; }
  const g = lqSrc.getContext('2d', { willReadFrequently: true }), fl = t > 0 ? t / 30 : 0;
  g.globalCompositeOperation = 'source-over'; g.fillStyle = E[1]; g.fillRect(0, 0, sw, sh);
  for (const o of P.O) {
    const cx = (o.x + fl * o.dx) * sw, cy = (o.y + fl * o.dy) * sh, R = o.R * sw, c0 = C[o.ci], c1 = o.hi ? mixc(c0, [1, 1, 1], .35) : C[(o.ci + 1 + o.cj) % 3];
    const gr = o.rad ? g.createRadialGradient(cx - R * .3, cy - R * .3, 0, cx, cy, R) : g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    gr.addColorStop(0, rgb(c1)); gr.addColorStop(.55, rgb(c0)); gr.addColorStop(1, rgb(c0));
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, R * o.ex, R, o.rot, 0, 6.283); g.fill();
  }
  const S = g.getImageData(0, 0, sw, sh).data;
  // 2) 노이즈로 좌표를 크게 휘게 해서 녹인 액체처럼 (모션 중엔 낮은 해상도 · 저장은 촘촘히)
  const ow = Math.min(W, t > 0 ? 160 : 360), oh = Math.max(1, Math.round(ow * H / W));
  if (!lqOut) lqOut = document.createElement('canvas'); if (lqOut.width !== ow || lqOut.height !== oh) { lqOut.width = ow; lqOut.height = oh; }
  const og = lqOut.getContext('2d'), im = og.createImageData(ow, oh), D = im.data, tt = t > 0 ? t / 20 : 0, A = P.wp * ow, kx = sw / ow, ky = sh / oh;
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) {
    const nx = i / ow * P.fs, ny = j / ow * P.fs;
    const qx = lqF(nx + tt * .6, ny - tt * .4, P.s), qy = lqF(nx + 5.2 - tt * .5, ny + 1.3 + tt * .3, P.s + 9);
    let sx = (i + (lqF(nx + 3 * qx + tt * .3, ny + 3 * qy, P.s + 20) - .5) * 2 * A) * kx, sy = (j + (lqF(nx + 3 * qx + 8, ny + 3 * qy + 2 - tt * .3, P.s + 31) - .5) * 2 * A) * ky;
    sx = sx < 0 ? 0 : sx > sw - 1.001 ? sw - 1.001 : sx; sy = sy < 0 ? 0 : sy > sh - 1.001 ? sh - 1.001 : sy;
    const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0, o4 = (j * ow + i) * 4, p0 = (y0 * sw + x0) * 4, p1 = p0 + sw * 4;
    for (let z = 0; z < 3; z++) { const a = S[p0 + z], b = S[p0 + 4 + z], c = S[p1 + z], d = S[p1 + 4 + z]; D[o4 + z] = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }
    D[o4 + 3] = 255;
  }
  og.putImageData(im, 0, 0);
  const x = cv.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low'; x.drawImage(lqOut, 0, 0, W, H);
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 플로팅 셰이프 (125차): 3D 도형 8종(각진 6종은 면마다 다른 색 · 구 · 도넛은 광택)이 공간에 떠 있어요. 레퍼런스의 원리만 · 3D 라이브러리 없이 꼭짓점 투영으로 새로 작성.
// 셔플 = 배치 4(무작위 구름 · 구 · 스파이럴 · 고리) · 도형 비율 · 개수 · 색. 모션 = 무리 전체가 40초에 한 바퀴(위아래로 살짝 기울며) + 도형마다 자전 + 제자리 둘레를 작게 맴돌기
// + 배치별(구: 숨쉬기 · 스파이럴: 제자리에서 빙글 + 출렁 · 고리: 물결). 글 뒤를 가리지 않고 글자에 옅은 그림자(.fsh)
export const FLOAT_PAL = [   // [이름, 바탕, 색 6, 밝은 바탕?]
  ['민트 · 핑크', '#141416', ['#8EE0D0', '#F08AB8', '#9A7AE8', '#5AA8E8', '#E8E0D8', '#F0B07A']], ['네온', '#0C0A14', ['#20E0E0', '#F030C0', '#7A40F0', '#2060F0', '#C0F040', '#F0F0F0']],
  ['선셋', '#140C10', ['#F07A4A', '#F0C050', '#E04A80', '#8A3AB0', '#F0E0C0', '#4A6AD0']], ['오션', '#081018', ['#30B0D0', '#80E0E0', '#2A60C0', '#E0F0F0', '#F0A080', '#4A3A9A']],
  ['캔디', '#120E16', ['#F06AA0', '#6AD0F0', '#F0E06A', '#A06AF0', '#6AF0A0', '#F0F0F0']], ['포레스트', '#0C120E', ['#5AB07A', '#C0D86A', '#2A7A6A', '#E0C08A', '#8AD0B0', '#E07A5A']],
  ['모노 · 레드', '#111111', ['#E8E8E8', '#A0A0A0', '#606060', '#E02A2A', '#C8C8C8', '#404040']], ['오로라', '#060A14', ['#40F0B0', '#40A0F0', '#A060F0', '#F060C0', '#E0F0FF', '#20C0A0']],
  ['파스텔', '#F2EEF6', ['#F0A8C8', '#A8D8F0', '#C8B0F0', '#A8F0D0', '#F8E0A8', '#FFFFFF'], 1], ['크림', '#F6F0E6', ['#E08A6A', '#6AA0C8', '#E8C060', '#8AC09A', '#C88AB8', '#FFFFFF'], 1]];
export const floatPal = (seed, pal) => pal != null && FLOAT_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % FLOAT_PAL.length;
export const floatLight = (seed, pal) => !!FLOAT_PAL[floatPal(seed, pal)][3];
const fv = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm: v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; } };
let FLOAT_GEO = null;
function floatGeo() {
  if (FLOAT_GEO) return FLOAT_GEO;
  const { sub, dot, cross, norm } = fv, PHI = (1 + Math.sqrt(5)) / 2, G = {};
  const orient = (V, F) => F.map(f => { const c = f.reduce((s, i) => s.map((v, k) => v + V[i][k] / f.length), [0, 0, 0]), n = cross(sub(V[f[1]], V[f[0]]), sub(V[f[2]], V[f[0]])); return dot(n, c) < 0 ? f.slice().reverse() : f; });
  const tri = (V, L) => { const F = [], d = (i, j) => Math.hypot(...sub(V[i], V[j])); for (let a = 0; a < V.length; a++) for (let b = a + 1; b < V.length; b++) for (let c = b + 1; c < V.length; c++) if (Math.abs(d(a, b) - L) < 1e-3 && Math.abs(d(b, c) - L) < 1e-3 && Math.abs(d(a, c) - L) < 1e-3) F.push([a, b, c]); return F; };
  { const V = [[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]].map(v => v.map(a => a * .62)); G.cube = { V, F: orient(V, [[0, 2, 6, 4], [1, 3, 7, 5], [0, 1, 5, 4], [2, 3, 7, 6], [0, 1, 3, 2], [4, 5, 7, 6]]) }; }
  { const V = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => v.map(a => a * .7)); G.tetra = { V, F: orient(V, [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]) }; }
  { const V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; G.octa = { V, F: orient(V, tri(V, Math.SQRT2)) }; }
  { const V0 = []; for (const a of [-1, 1]) for (const b of [-PHI, PHI]) { V0.push([0, a, b]); V0.push([a, b, 0]); V0.push([b, 0, a]); } const F = orient(V0, tri(V0, 2)), V = V0.map(v => v.map(x => x / Math.hypot(1, PHI)));
    G.icosa = { V, F };
    const DV = F.map(f => norm(f.reduce((s, i) => s.map((v, k) => v + V[i][k]), [0, 0, 0]))), DF = V.map(v => { const fs = F.map((f, fi) => f.includes(V.indexOf(v)) ? fi : -1).filter(i => i >= 0), u = norm(cross(v, Math.abs(v[0]) < .9 ? [1, 0, 0] : [0, 1, 0])), w = cross(v, u); return fs.sort((a, b) => Math.atan2(dot(DV[a], w), dot(DV[a], u)) - Math.atan2(dot(DV[b], w), dot(DV[b], u))); });
    G.dodeca = { V: DV, F: orient(DV, DF) }; }
  { const n = 18, V = [[0, .75, 0]]; for (let i = 0; i < n; i++) { const a = i / n * 6.283; V.push([Math.cos(a) * .7, -.7, Math.sin(a) * .7]); } const F = []; for (let i = 0; i < n; i++) F.push([0, 1 + i, 1 + (i + 1) % n]); F.push(Array.from({ length: n }, (_, i) => 1 + i)); G.cone = { V, F: orient(V, F) }; }
  { const U = 24, Vn = 12, R = .72, r = .28, V = [], F = []; for (let i = 0; i < U; i++) for (let j = 0; j < Vn; j++) { const a = i / U * 6.283, b = j / Vn * 6.283; V.push([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]); }
    for (let i = 0; i < U; i++) for (let j = 0; j < Vn; j++) F.push([i * Vn + j, ((i + 1) % U) * Vn + j, ((i + 1) % U) * Vn + (j + 1) % Vn, i * Vn + (j + 1) % Vn]); G.torus = { V, F, smooth: 1, U, Vn }; }
  return FLOAT_GEO = G;
}
const FLOAT_KINDS = ['cube', 'tetra', 'octa', 'icosa', 'dodeca', 'cone'];
const floatCache = new Map();
function floatOf(seed, asp) {
  const key = seed + ':' + asp.toFixed(2);
  if (floatCache.has(key)) return floatCache.get(key);
  const r = rng(seed ^ 0x2f10), lay = Math.floor(r() * 4), n0 = 16 + Math.floor(r() * 12), smooth = .15 + r() * .3, n = lay === 0 ? n0 : lay === 3 ? n0 + 10 : n0 + 20, ys = Math.min(1.5, asp * .95), O = [];
  for (let i = 0; i < n; i++) {
    const kind = r() < smooth ? (r() < .5 ? 'sphere' : 'torus') : FLOAT_KINDS[Math.floor(r() * 6)]; let p, size;
    if (lay === 0) { size = .16 + r() ** 1.5 * .34; for (let k = 0; k < 30; k++) { p = [(r() * 2 - 1) * 1.35, (r() * 2 - 1) * 1.35 * ys, (r() * 2 - 1) * 1.1]; if (O.every(q => Math.hypot(q.p[0] - p[0], q.p[1] - p[1], q.p[2] - p[2]) > (q.size + size) * .95)) break; } }
    else if (lay === 1) { const y = 1 - 2 * (i + .5) / n, rr = Math.sqrt(1 - y * y), a = i * 2.39996; p = [Math.cos(a) * rr * .9, y * .9, Math.sin(a) * rr * .9]; size = .1 + r() * .08; }
    else if (lay === 2) { const a = i * .5, y = (i / (n - 1) * 2 - 1) * 1.3 * ys; p = [Math.cos(a) * .8, y, Math.sin(a) * .8]; size = .1 + r() * .08; }
    else { const a = i / n * 6.283, rr = 1.25 + (r() - .5) * .25; p = [Math.cos(a) * rr, (r() - .5) * .3, Math.sin(a) * rr]; size = .13 + r() * .13; }
    O.push({ kind, p, size, ax: r() * 6.28, ay: r() * 6.28, az: r() * 6.28, sx: (r() - .5) * .5, sy: (r() - .5) * .5, ph: r() * 6.28, cols: [0, 1, 2, 3, 4, 5].map(() => Math.floor(r() * 6)), i });
  }
  const p = { lay, O, yaw0: r() * 6.283 };
  if (floatCache.size > 60) floatCache.delete(floatCache.keys().next().value);
  floatCache.set(key, p); return p;
}
function drawFloat(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = floatOf(seed, H / W), E = FLOAT_PAL[floatPal(seed, cv.dataset.pal)], light = !!E[3], x = cv.getContext('2d'), G = floatGeo(), { sub, dot, cross, norm } = fv;
  const cap = c => { const L = .3 * c[0] + .59 * c[1] + .11 * c[2], k = light ? Math.min(1, .3 / Math.max(.01, 1 - L)) : Math.min(1, .78 / Math.max(.01, L)); return c.map(v => light ? 1 - (1 - v) * k : v * k); };
  const C = E[2].map(h => cap(hx3(h))), BG = hx3(E[1]), rgb = c => `rgb(${Math.round(Math.max(0, Math.min(1, c[0])) * 255)},${Math.round(Math.max(0, Math.min(1, c[1])) * 255)},${Math.round(Math.max(0, Math.min(1, c[2])) * 255)})`, mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = E[1]; x.fillRect(0, 0, W, H);
  const L = norm([-.5, .7, -.6]), CAM = 3.4, F = 2.9, sc = W * .5, cx0 = W / 2, cy0 = H / 2, lay = P.lay;
  const yaw = P.yaw0 + (t > 0 ? t / 40 * 6.283 : 0), pit = .15 + (t > 0 ? Math.sin(t / 10 * 6.283) * .1 : 0) + (lay === 3 ? .5 : 0), cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
  const S = v => { const X = v[0] * cy + v[2] * sy, Z0 = -v[0] * sy + v[2] * cy; return [X, v[1] * cp - Z0 * sp, v[1] * sp + Z0 * cp]; };
  const faces = [];
  for (const ob of P.O) {
    let wp = ob.p; const ph = t > 0 ? t / 8 * 6.283 + ob.ph : ob.ph;
    if (t > 0) {
      if (lay === 1) wp = wp.map(v => v * (1 + .07 * Math.sin(t / 8 * 6.283)));   // 구: 숨 쉬듯
      if (lay === 2) { const a = t / 20 * 6.283, c = Math.cos(a), s2 = Math.sin(a); wp = [wp[0] * c - wp[2] * s2, wp[1] + Math.sin(t / 6 * 6.283 + ob.i * .3) * .06, wp[0] * s2 + wp[2] * c]; }   // 스파이럴: 제자리에서 빙글 + 출렁
      if (lay === 3) wp = [wp[0], wp[1] + Math.sin(t / 6 * 6.283 + Math.atan2(wp[2], wp[0]) * 2) * .08, wp[2]];   // 고리: 물결
      wp = [wp[0] + Math.sin(ph) * .04, wp[1] + Math.cos(ph) * .04, wp[2] + Math.sin(ph * .7) * .04];   // 제자리 둘레를 작게 맴돌아요
    }
    const c3 = S(wp), cz = c3[2] + CAM, fog = Math.max(0, Math.min(1, (c3[2] + 1.4) / 2.8)) * .35;
    const proj = q => { const zz = q[2] + CAM; return [cx0 + q[0] / zz * F * sc, cy0 - q[1] / zz * F * sc]; };
    if (ob.kind === 'sphere') { const p = proj(c3), rad = ob.size * .8 / cz * F * sc, c0 = C[ob.cols[0]], c1 = C[ob.cols[1]]; faces.push({ d: cz + ob.size * .3, sph: 1, p, rad, c0: mix(mix(c0, [1, 1, 1], .45), BG, fog), c1: mix(c0, BG, fog), c2: mix(mix(c1, [0, 0, 0], .25), BG, fog) }); continue; }
    const g = G[ob.kind], ax = ob.ax + ob.sx * t, ay = ob.ay + ob.sy * t, az = ob.az, [ca, sa, cb, sb, cc, s3] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay), Math.cos(az), Math.sin(az)];
    const VW = g.V.map(v => { let X = v[0], Y = v[1], Z = v[2]; [Y, Z] = [Y * ca - Z * sa, Y * sa + Z * ca]; [X, Z] = [X * cb + Z * sb, -X * sb + Z * cb]; [X, Y] = [X * cc - Y * s3, X * s3 + Y * cc]; return S([wp[0] + X * ob.size, wp[1] + Y * ob.size, wp[2] + Z * ob.size]); }), VP = VW.map(proj);
    g.F.forEach((f, fi) => {
      const n2 = norm(cross(sub(VW[f[1]], VW[f[0]]), sub(VW[f[2]], VW[f[0]]))); let c0 = 0, c1 = 0, c2 = 0; for (const i of f) { c0 += VW[i][0]; c1 += VW[i][1]; c2 += VW[i][2]; }
      const view = [c0 / f.length, c1 / f.length, c2 / f.length + CAM]; if (dot(n2, view) > 0) return;
      const lam = Math.max(0, -dot(n2, L)), base = g.smooth ? mix(C[ob.cols[0]], C[ob.cols[1]], .5 + .5 * Math.sin(Math.floor(fi / g.Vn) / g.U * 6.283 * 2)) : C[ob.cols[fi % 6]];
      let col = [base[0] * (.72 + .38 * lam), base[1] * (.72 + .38 * lam), base[2] * (.72 + .38 * lam)]; if (g.smooth) { const h = Math.pow(Math.max(0, dot(n2, norm(sub([-L[0], -L[1], -L[2]], norm(view))))), 18); col = mix(col, [1, 1, 1], h * .7); }
      faces.push({ d: view[2], pts: f.map(i => VP[i]), col: mix(col, BG, fog) });
    });
  }
  faces.sort((a, b) => b.d - a.d);
  x.lineWidth = .8 * W / 520; x.lineJoin = 'round';
  for (const f of faces) {
    if (f.sph) { const g = x.createRadialGradient(f.p[0] - f.rad * .35, f.p[1] - f.rad * .4, f.rad * .05, f.p[0], f.p[1], f.rad); g.addColorStop(0, rgb(f.c0)); g.addColorStop(.55, rgb(f.c1)); g.addColorStop(1, rgb(f.c2)); x.fillStyle = g; x.beginPath(); x.arc(f.p[0], f.p[1], f.rad, 0, 6.283); x.fill(); continue; }
    const cs = rgb(f.col); x.fillStyle = cs; x.strokeStyle = cs; x.beginPath(); for (let k = 0; k < f.pts.length; k++) k ? x.lineTo(f.pts[k][0], f.pts[k][1]) : x.moveTo(f.pts[k][0], f.pts[k][1]); x.closePath(); x.fill(); x.stroke();
  }
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 클라우드 텍스처 (126차): 여러 크기의 노이즈를 겹친 구름 질감 · 큰 얼룩 가장자리에 잔결이 살아 있어요. 레퍼런스의 원리만 · 식과 코드는 새로 작성.
// 셔플 = 얼룩 크기 · 결 거칠기 · 대비 · 휘는 정도 · 색. 비슷한 색 4단계(깊음 → 밝음)로만 칠해요. 노이즈 두 겹은 셔플할 때 한 번만 만들고(여백 포함),
// 모션은 두 겹을 서로 다른 방향으로 천천히 밀고 섞기만 해서 가벼워요(구름이 피어나고 스러지듯). 글 뒤를 가리지 않고 너무 밝은 색만 누르고 글자에 옅은 그림자(.fsh)
export const CLOUD_PAL = [   // [이름, 색 4(깊음 → 밝음), 밝은 바탕?]
  ['오션', ['#06104A', '#0A2AE0', '#1868F0', '#30E0E0']], ['퍼플 미스트', ['#12062E', '#4A16C0', '#9A50F0', '#F0A0F0']],
  ['에메랄드', ['#03201A', '#087A52', '#20C090', '#C8F0A0']], ['선셋', ['#2A0620', '#B81E4A', '#F06A3A', '#F8D070']],
  ['로즈', ['#26061A', '#A01E5A', '#F05A8A', '#F8C8D8']], ['앰버', ['#1C0E04', '#904008', '#E09020', '#F8E8A0']],
  ['모노', ['#080808', '#2E2E2E', '#7A7A7A', '#E8E8E8']], ['네온', ['#0A0420', '#2410C8', '#D820C0', '#20F0F0']],
  ['하늘 안개', ['#6A90E0', '#A8C4F0', '#DCE8F8', '#FFFFFF'], 1], ['피치 안개', ['#E8907A', '#F4C0AC', '#FBE4D8', '#FFFFFF'], 1]];
export const cloudPal = (seed, pal) => pal != null && CLOUD_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % CLOUD_PAL.length;
export const cloudLight = (seed, pal) => !!CLOUD_PAL[cloudPal(seed, pal)][2];
const CL_FW = 320, CL_M = 40, cloudCache = new Map();
const clF = (x, y, s, oct, gain) => { let v = 0, a = .5, sum = 0; for (let k = 0; k < oct; k++) { v += a * lqN(x, y, s + k * 7); sum += a; x = x * 2.03 + 1.7; y = y * 2.03 + 3.1; a *= gain; } return v / sum; };
function cloudOf(seed, asp) {
  const key = seed + ':' + asp.toFixed(2);
  if (cloudCache.has(key)) return cloudCache.get(key);
  const r = rng(seed ^ 0x6c0d), P = { sc: 2.2 + r() * 2.6, gain: .5 + r() * .12, con: 1.5 + r() * .8, warp: .3 + r() * .6, s: Math.floor(r() * 1e5) };
  const fw = CL_FW + CL_M * 2, fh = Math.round(CL_FW * asp) + CL_M * 2, A = new Float32Array(fw * fh), B = new Float32Array(fw * fh);
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
    const nx = (i - CL_M) / CL_FW * P.sc, ny = (j - CL_M) / CL_FW * P.sc;
    const qx = clF(nx * .6, ny * .6, P.s + 50, 3, .5), qy = clF(nx * .6 + 4.1, ny * .6, P.s + 80, 3, .5);   // 큰 흐름으로 살짝 휘게 (구불구불한 얼룩)
    A[j * fw + i] = clF(nx + qx * P.warp * 2, ny + qy * P.warp * 2, P.s, 6, P.gain); B[j * fw + i] = clF(nx * 1.3 + 9, ny * 1.3, P.s + 30, 6, P.gain);
  }
  P.A = A; P.B = B; P.fw = fw; P.fh = fh;
  if (cloudCache.size > 12) cloudCache.delete(cloudCache.keys().next().value);
  cloudCache.set(key, P); return P;
}
let clOut = null;
function drawCloud(cv, seed, t, grain) {
  const W = cv.width, H = cv.height, P = cloudOf(seed, H / W), E = CLOUD_PAL[cloudPal(seed, cv.dataset.pal)], light = !!E[2];
  const cap = c => { const L = .3 * c[0] + .59 * c[1] + .11 * c[2], k = light ? Math.min(1, .34 / Math.max(.01, 1 - L)) : Math.min(1, .6 / Math.max(.01, L)); return c.map(v => light ? 1 - (1 - v) * k : v * k); };   // 너무 밝은(밝은 바탕은 너무 진한) 색만 눌러요
  const C = E[1].map(h => cap(hx3(h))), LUT = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) { const v = i / 255 * 3, k = Math.min(2, Math.floor(v)), f = v - k, e = f * f * (3 - 2 * f); for (let z = 0; z < 3; z++) LUT[i * 3 + z] = (C[k][z] + (C[k + 1][z] - C[k][z]) * e) * 255; }
  const ow = Math.min(W, t > 0 ? 200 : CL_FW), oh = Math.max(1, Math.round(ow * H / W)), ks = CL_FW / ow, fw = P.fw, fh = P.fh, FA = P.A, FB = P.B, m = CL_M - 2, T = 6.283;
  const ax = CL_M + (t > 0 ? Math.sin(t / 23 * T) * m : 0), ay = CL_M + (t > 0 ? Math.sin(t / 29 * T + 1) * m : 0), bx = CL_M - (t > 0 ? Math.sin(t / 19 * T + 2) * m : 0), by = CL_M - (t > 0 ? Math.sin(t / 27 * T + 3) * m : 0);
  const wa = .65 + (t > 0 ? Math.sin(t / 17 * T) * .12 : 0), con = P.con;
  if (!clOut) clOut = document.createElement('canvas'); if (clOut.width !== ow || clOut.height !== oh) { clOut.width = ow; clOut.height = oh; }
  const og = clOut.getContext('2d'), im = og.createImageData(ow, oh), D = im.data;
  const smp = (F, x, y) => { x = x < 0 ? 0 : x > fw - 1.001 ? fw - 1.001 : x; y = y < 0 ? 0 : y > fh - 1.001 ? fh - 1.001 : y; const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, p = y0 * fw + x0, a = F[p], b = F[p + 1], c = F[p + fw], d = F[p + fw + 1]; return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) {
    const u = i * ks, w = j * ks; let v = (smp(FA, u + ax, w + ay) * wa + smp(FB, u + bx, w + by) * (1 - wa) - .5) * con + .5;
    const li = (v < 0 ? 0 : v > 1 ? 255 : v * 255 | 0) * 3, o4 = (j * ow + i) * 4; D[o4] = LUT[li]; D[o4 + 1] = LUT[li + 1]; D[o4 + 2] = LUT[li + 2]; D[o4 + 3] = 255;
  }
  og.putImageData(im, 0, 0);
  const x = cv.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low'; x.drawImage(clOut, 0, 0, W, H);
  if (grain) { x.globalCompositeOperation = 'soft-light'; x.globalAlpha = grain; x.fillStyle = x.createPattern(gbNoise(), 'repeat'); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
}
// 도트 웨이브 (127차): 촘촘한 점 격자 전체가 물결로 휘고, 색은 5~6색 띠로 이어져요(점 사이로 바탕이 비쳐 질감). 레퍼런스의 원리만 · 식과 코드는 새로 작성.
// 셔플 = 점 크기 · 촘촘함 · 휘는 방식 4(세로 물결 · 가로 물결 · 흐름 · 동심원) · 색 방향 4(가로 · 세로 · 대각 · 방사) · 가끔 사각 · 육각 점 · 세 번에 한 번쯤 큰 도트(가로 12~16칸 · 틈 얇게 · 네모 위주 · 물결 얕게)
// 모션 = 물결이 천천히 흐르고 색 띠도 아주 느리게 밀려요. 색을 64단계로 묶어 한 번에 칠해서 가벼워요. 글 뒤를 가리지 않고 너무 밝은 색만 누르고 글자에 옅은 그림자(.fsh)
export const DOTW_PAL = [   // [이름, 바탕, 색 띠, 밝은 바탕?]
  ['무지개', '#141414', ['#20E070', '#20A0F0', '#3A50F0', '#F0D020', '#F07A30', '#F03090']], ['선셋', '#140C12', ['#F0D040', '#F09030', '#F05050', '#C03080', '#6A30A0']],
  ['오션', '#08101A', ['#40F0D0', '#20B0E0', '#2060E0', '#5030C0', '#A0F0F0']], ['캔디', '#141018', ['#F070B0', '#F0A0D0', '#A080F0', '#70D0F0', '#F0E070']],
  ['네온', '#08060E', ['#20F0F0', '#F020D0', '#7030F0', '#C0F030']], ['포레스트', '#0A120C', ['#C0E050', '#50C070', '#209080', '#E0B040']],
  ['모노 · 레드', '#0C0C0C', ['#F0F0F0', '#909090', '#E02020', '#505050']], ['오로라', '#060A14', ['#40F0A0', '#30C0E0', '#8060F0', '#E060C0']],
  ['파스텔', '#F6F2EE', ['#F0A0B8', '#A0C8F0', '#B8E0A0', '#F0D890', '#C8A8F0'], 1], ['종이 · 원색', '#F4EEE4', ['#E04A3A', '#2A5AC0', '#F0B020', '#3AA070'], 1]];
export const dotwPal = (seed, pal) => pal != null && DOTW_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % DOTW_PAL.length;
export const dotwLight = (seed, pal) => !!DOTW_PAL[dotwPal(seed, pal)][3];
const dotwCache = new Map();
function dotwOf(seed) {
  if (dotwCache.has(seed)) return dotwCache.get(seed);
  const r = rng(seed ^ 0x4d07), P = { cell: 9 + r() * 7, fill: .72 + r() * .22, kind: Math.floor(r() * 4), dir: Math.floor(r() * 4), shape: r() < .7 ? 0 : r() < .5 ? 1 : 2, amp: .6 + r() * 1.1, lam: .16 + r() * .2, ph: r() * 6.283, big: r() < .33, bn: 12 + r() * 4, bf: .9 + r() * .06, bsq: r() < .75 };
  if (P.big) { P.cell = 520 / P.bn; P.fill = P.bf; P.shape = P.bsq ? 1 : 0; P.amp = .1 + (P.amp - .6) * .09; P.lam = .45 + P.lam * .5; if (P.kind === 2) P.kind = 0; }
  else if (P.kind === 2) P.amp = .35 + (P.amp - .6) * .3;
  if (dotwCache.size > 60) dotwCache.delete(dotwCache.keys().next().value);
  dotwCache.set(seed, P); return P;
}
function drawDotw(cv, seed, t) {
  const W = cv.width, H = cv.height, P = dotwOf(seed), E = DOTW_PAL[dotwPal(seed, cv.dataset.pal)], light = !!E[3], x = cv.getContext('2d');
  const cap = c => { const L = .3 * c[0] + .59 * c[1] + .11 * c[2], k = light ? Math.min(1, .45 / Math.max(.01, 1 - L)) : Math.min(1, .62 / Math.max(.01, L)); return c.map(v => light ? 1 - (1 - v) * k : v * k); };
  const C = E[2].map(h => cap(hx3(h))), n = C.length, NB = 64, BC = [];
  for (let b = 0; b < NB; b++) { const v = b / (NB - 1) * (n - 1), k = Math.min(n - 2, Math.floor(v)), f = v - k; BC.push(`rgb(${C[k].map((a, z) => Math.round((a + (C[k + 1][z] - a) * f) * 255)).join(',')})`); }
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = E[1]; x.fillRect(0, 0, W, H);
  const u = W / 520, c = P.cell * u, A = c * P.amp, L = W * P.lam, T = 6.283, tw = t > 0 ? t * T / 8 : 0, sh = t > 0 ? t / 40 : 0, rad = c * P.fill / 2, cx = W / 2, cy = H / 2, dm = Math.hypot(cx, cy), paths = new Array(NB).fill(null);
  for (let j = -3; j * c < H + 3 * c; j++) for (let i = -3; i * c < W + 3 * c; i++) {
    const bx = i * c + c / 2, by = j * c + c / 2; let dx = 0, dy = 0;
    if (P.kind === 0) dx = A * Math.sin(by / L * T + P.ph - tw);
    else if (P.kind === 1) dy = A * Math.sin(bx / L * T + P.ph - tw);
    else if (P.kind === 2) { dx = A * Math.sin(by / L * T + P.ph - tw); dy = A * Math.cos(bx / L * T + P.ph - tw); }
    else { const rr = Math.hypot(bx - cx, by - cy) || 1, w = A * Math.sin(rr / L * T - tw); dx = (bx - cx) / rr * w; dy = (by - cy) / rr * w; }
    let g = (P.dir === 0 ? bx / W : P.dir === 1 ? by / H : P.dir === 2 ? (bx + by) / (W + H) : Math.hypot(bx - cx, by - cy) / dm) + sh; g = ((g % 2) + 2) % 2; if (g > 1) g = 2 - g;
    const bi = Math.round(g * (NB - 1)), pa = paths[bi] || (paths[bi] = new Path2D()), px = bx + dx, py = by + dy;
    if (P.shape === 0) { pa.moveTo(px + rad, py); pa.arc(px, py, rad, 0, T); }
    else if (P.shape === 1) { const q = P.big ? rad : rad * .9, an = P.big ? (dx + dy) / c * .18 : 0, ca = Math.cos(an) * q, sa = Math.sin(an) * q; pa.moveTo(px - ca + sa, py - sa - ca); pa.lineTo(px + ca + sa, py + sa - ca); pa.lineTo(px + ca - sa, py + sa + ca); pa.lineTo(px - ca - sa, py - sa + ca); pa.closePath(); }
    else for (let k = 0; k < 6; k++) { const an = k * T / 6 + .52, qx = px + Math.cos(an) * rad * 1.05, qy = py + Math.sin(an) * rad * 1.05; k ? pa.lineTo(qx, qy) : pa.moveTo(qx, qy); if (k === 5) pa.closePath(); }
  }
  for (let b = 0; b < NB; b++) if (paths[b]) { x.fillStyle = BC[b]; x.fill(paths[b]); }
}
// 스웜 (128차): 빛나는 작은 입자 1~2천 개가 3D 공간에서 물고기 떼 · 플랑크톤처럼 무리 지어 헤엄쳐요(가까운 건 크고 또렷, 먼 건 작고 흐리게). 레퍼런스의 원리만 · 3D 라이브러리 없이 새로 작성.
// 셔플 = 무리 모양 4(흐르는 띠 · 소용돌이 기둥 · 두 무리 · 플랑크톤) · 입자 수 · 크기 · 색. 모션 = 무리 전체가 50초에 한 바퀴 돌고 입자마다 흐름을 따라 흘러요.
// 빛 번짐 점은 색마다 한 번만 그려 두고 찍기만 해요. 글 뒤를 가리지 않고 글자에 옅은 그림자(.fsh)
export const SWARM_PAL = [   // [이름, 바탕 위, 바탕 아래, 입자 색 4, 밝은 바탕?]
  ['바닷속', '#041622', '#0A3A4A', ['#40F0D0', '#80F0E0', '#20B0C0', '#E0FFF8']], ['산호', '#160A12', '#3A1626', ['#FF7A6A', '#FFB08A', '#F04A7A', '#FFE0D0']],
  ['심해', '#02061A', '#0A1A44', ['#30C0FF', '#60E0FF', '#4060F0', '#D0F4FF']], ['반딧불', '#060A06', '#14200E', ['#E0F050', '#A0F060', '#F0C040', '#FFFFD0']],
  ['네온', '#08041A', '#1A0A34', ['#F040E0', '#40E0F0', '#8040F0', '#FFFFFF']], ['오로라', '#020A12', '#0A2430', ['#40F0A0', '#40A0F0', '#C060F0', '#E0FFF0']],
  ['선셋', '#14060A', '#341420', ['#FFB040', '#FF6A4A', '#F04A9A', '#FFE8C0']], ['모노', '#080808', '#1C1C1C', ['#FFFFFF', '#B0B0B0', '#808080', '#E8E8E8']],
  ['라군', '#D8F0F0', '#F4FBFA', ['#108A9A', '#20B0A0', '#2A6AC0', '#0A4A6A'], 1], ['노을 종이', '#F8E8E0', '#FFF6F0', ['#E0503A', '#F08A3A', '#C03A6A', '#7A2A4A'], 1]];
export const swarmPal = (seed, pal) => pal != null && SWARM_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % SWARM_PAL.length;
export const swarmLight = (seed, pal) => !!SWARM_PAL[swarmPal(seed, pal)][4];
const swarmCache = new Map(), swSpr = new Map();
function swarmSprite(h) {
  if (swSpr.has(h)) return swSpr.get(h);
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32), [R, G, B] = hx3(h).map(v => Math.round(v * 255));
  gr.addColorStop(0, `rgba(${R},${G},${B},1)`); gr.addColorStop(.18, `rgba(${R},${G},${B},.9)`); gr.addColorStop(.4, `rgba(${R},${G},${B},.25)`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  swSpr.set(h, c); return c;
}
function swarmOf(seed, asp) {
  const key = seed + ':' + asp.toFixed(2);
  if (swarmCache.has(key)) return swarmCache.get(key);
  const r = rng(seed ^ 0x5a17), gs = () => { let u = 0; for (let i = 0; i < 4; i++) u += r(); return (u - 2) / 1.15; };
  const P = { form: Math.floor(r() * 4), n: 1200 + Math.floor(r() * 1000), sz: .8 + r() * .8, ph: r() * 6.283, yaw: r() * 6.283, Q: [] };
  for (let i = 0; i < P.n; i++) P.Q.push({ sp: .6 + r() * .8, ci: Math.floor(r() * 4), base: r() * 6.283, g1: gs(), g2: gs(), g3: gs(), w: r() * 6.283, hy: r() * 2 - 1, bx: r() * 2 - 1, by: r() * 2 - 1, bz: r() * 2 - 1, s: .6 + r() * .9 });
  if (swarmCache.size > 30) swarmCache.delete(swarmCache.keys().next().value);
  swarmCache.set(key, P); return P;
}
function drawSwarm(cv, seed, t) {
  const W = cv.width, H = cv.height, asp = H / W, P = swarmOf(seed, asp), E = SWARM_PAL[swarmPal(seed, cv.dataset.pal)], light = !!E[4], x = cv.getContext('2d');
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, E[1]); bg.addColorStop(1, E[2]); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const T = 6.283, yaw = P.yaw + (t > 0 ? t / 50 * T : 0), cyw = Math.cos(yaw), syw = Math.sin(yaw), CAM = 3.2, F = 2.4, sc = W * .5, SP = E[3].map(swarmSprite), pts = [], ph = P.ph, f = P.form, hh = 1.3 * asp;
  for (const q of P.Q) {
    let px, py, pz;
    if (f === 0 || f === 2) { const two = f === 2 && (q.ci & 1), u = q.base + t / 14 * q.sp * .5, uu = two ? -u : u, p2 = ph + (two ? 2.4 : 0), spread = .13 + .1 * Math.sin(u * 2 + q.w);
      px = Math.sin(uu) * 1.2 + q.g1 * spread + Math.sin(t / 3 + q.w) * .02; py = Math.sin(2 * uu + p2) * .55 * asp + q.g2 * spread * .8; pz = Math.cos(uu) * .9 + Math.sin(3 * uu + p2) * .2 + q.g3 * spread; }
    else if (f === 1) { const rr = .55 + Math.abs(q.g1) * .4, a = q.base + t / 10 * q.sp / (rr + .3), hy = q.hy * .9 * asp, tw = hy * 1.6, k = rr * (1 - Math.abs(hy) * .25); px = Math.cos(a + tw) * k; py = hy + Math.sin(a * 2 + q.w) * .06; pz = Math.sin(a + tw) * k; }
    else { const bx = q.bx * 1.5; let by = q.by * hh + t * .01 * q.sp; by = ((by + hh) % (2 * hh) + 2 * hh) % (2 * hh) - hh; px = bx + Math.sin(by * 1.7 + t / 9 * T * .3 + q.w) * .12; py = by + Math.sin(bx * 1.3 + t / 11 * T * .3) * .1; pz = q.bz * 1.2; }
    const X = px * cyw + pz * syw, zz = -px * syw + pz * cyw + CAM; if (zz < .5) continue;
    pts.push([W / 2 + X / zz * F * sc, H / 2 - py / zz * F * sc, zz, q.ci, q.s]);
  }
  if (light) pts.sort((a, b) => b[2] - a[2]);
  x.globalCompositeOperation = light ? 'source-over' : 'lighter'; const k0 = P.sz * 9 * (W / 520) * 2.2, a0 = light ? .75 : .45;
  for (const q of pts) { const d = Math.max(0, Math.min(1, (q[2] - 2) / 2.4)), R = q[4] * k0 / q[2]; x.globalAlpha = a0 * (1 - d * .7); x.drawImage(SP[q[3]], q[0] - R, q[1] - R, R * 2, R * 2); }
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
}
// 크롬 폴드 (129차): 대각선 띠가 겹겹이 접힌 광택 금속(크롬) 리본 · 한 색 계열 안에서 밝은 반사와 깊은 그림자 · 띠 경계는 날카롭게 꺾여요.
// 레퍼런스의 원리만(한쪽 방향으로만 계단지는 노이즈를 노이즈로 두 번 휘게 → 접힌 면) · 식과 코드는 새로 작성. 셔플 = 띠 기울기 · 폭 · 반사 무늬 · 색.
// 모션 = 반사 무늬가 흐르며 띠가 조금씩 다시 접혀요. GPU 쉐이더로 그리고, 안 되면 작은 캔버스 CPU로 대신. 글 뒤를 가리지 않고 전체 밝기만 눌러 주고 글자에 옅은 그림자(.fsh)
export const FOLD_PAL = [   // [이름, 밝은 색, 깊은 색, 밝은 바탕?]
  ['라임', '#8EE040', '#063A2A'], ['코발트', '#3A80F8', '#0A1450'], ['로즈 골드', '#F0A090', '#4A1A20'], ['바이올렛', '#B080F8', '#200A48'],
  ['실버', '#D8E0E8', '#1A2028'], ['앰버', '#F8B040', '#3A1800'], ['아쿠아', '#40E0D0', '#06302E'], ['마젠타', '#F050B0', '#3A0628'],
  ['펄', '#FFFFFF', '#A8B0C8', 1], ['샴페인', '#FFF8E8', '#C8A880', 1]];
export const foldPal = (seed, pal) => pal != null && FOLD_PAL[+pal] ? +pal : ((seed >>> 0) || 1) % FOLD_PAL.length;
export const foldLight = (seed, pal) => !!FOLD_PAL[foldPal(seed, pal)][3];
const foldCache = new Map();
function foldOf(seed) {
  if (foldCache.has(seed)) return foldCache.get(seed);
  const r = rng(seed ^ 0x0f01), p = { sc: .2 + r() * .18, rot: (r() < .6 ? -.7 : .95) + (r() - .5) * .3, wi: 1.4 + r() * 1.8, t0: r() * 60 };
  if (foldCache.size > 60) foldCache.delete(foldCache.keys().next().value);
  foldCache.set(seed, p); return p;
}
const FO_GLSL = `precision highp float;
uniform vec2 uRes; uniform float uT, uSc, uRot, uWi, uBr, uLight; uniform vec3 uC1, uC2;
float rn(vec2 p) { return fract(sin(dot(p, vec2(-.82, -.84))) * 4757.153); }
float nz(vec2 p) { vec2 b = floor(p), f = p - b; f = vec2(smoothstep(0., .07, f.x), smoothstep(0., .99, f.y));   // 가로로만 계단 → 접힌 면
  return mix(mix(rn(b), rn(b + vec2(1., 0.)), f.x), mix(rn(b + vec2(0., 1.)), rn(b + vec2(1., 1.)), f.x), f.y); }
float fb(vec2 p, float t) { float v = sin(t * .1) * .2, a = .25; mat2 m = mat2(.8776, .3195, -.7782, .9004);
  for (int i = 0; i < 3; i++) { v += a * nz(p); p = m * p * 2. + 100.; a *= 2.; } return v; }
void main() {
  vec2 u0 = (gl_FragCoord.xy * 2. - uRes) / min(uRes.x, uRes.y) * uSc; float cr = cos(uRot), sr = sin(uRot), t = uT;
  vec2 p = vec2(u0.x * cr - u0.y * sr, u0.x * sr + u0.y * cr), c = p * .2; float ln = 0.;
  for (int k = 0; k < 3; k++) { ln = length(c); c.x += sin(c.y + t * .1) * uWi; c.y += cos(c.x + t * .3 + cos(ln)); } ln -= 3.;
  vec2 q = vec2(fb(p, t), fb(p + vec2(-.45, .65), t)), r = vec2(fb(p + q + vec2(.57 + .07 * t, .52), t), fb(p + q + vec2(.34, -.57 + .05 * t), t));
  float f = fb(p + r, t), sh = (f * f * f + .6 * f * f + .5 * f) * uBr;
  vec3 base = mix(uC2, uC1, .5 + .5 * cos(ln + vec3(.5, 0., .1)));
  vec3 col = uLight > .5 ? .35 + base * sh * .8 : base * sh;
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;
let FOG = null;
function foGl() {
  if (FOG !== null) return FOG;
  FOG = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!g) return FOG;
    const sh = (type, src) => { const o = g.createShader(type); g.shaderSource(o, src); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, FO_GLSL)); g.linkProgram(pr); g.useProgram(pr);
    const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['uRes', 'uT', 'uSc', 'uRot', 'uWi', 'uBr', 'uLight', 'uC1', 'uC2'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    FOG = { cv, g, u };
  } catch (e) { console.warn('fold gl', e); FOG = false; }
  return FOG;
}
// WebGL이 없을 때: 작은 캔버스에 같은 식을 계산하고 키워요
function foldCpu(cv, P, E, t) {
  const W = cv.width, H = cv.height, w = t > 0 ? 160 : 300, h = Math.max(1, Math.round(w * H / W)), sc = document.createElement('canvas'); sc.width = w; sc.height = h;
  const x = sc.getContext('2d'), im = x.createImageData(w, h), D = im.data, C1 = hx3(E[1]), C2 = hx3(E[2]), light = !!E[3], br = light ? .55 : .62;
  const rn = (a, b) => { const v = Math.sin(a * -.82 + b * -.84) * 4757.153; return v - Math.floor(v); };
  const nz = (px, py) => { const bx = Math.floor(px), by = Math.floor(py); let fx = Math.min(1, (px - bx) / .07), fy = Math.min(1, (py - by) / .99); fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = rn(bx, by), b = rn(bx + 1, by), c = rn(bx, by + 1), d = rn(bx + 1, by + 1); return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy; };
  const fb = (px, py) => { let v = Math.sin(t2 * .1) * .2, a = .25; for (let i = 0; i < 3; i++) { v += a * nz(px, py); const nx = (.8776 * px - .7782 * py) * 2 + 100, ny = (.3195 * px + .9004 * py) * 2 + 100; px = nx; py = ny; a *= 2; } return v; };
  const t2 = P.t0 + t * .6, cr = Math.cos(P.rot), sr = Math.sin(P.rot), m = Math.min(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u0 = ((i + .5) * 2 - w) / m * P.sc, v0 = ((h - j - .5) * 2 - h) / m * P.sc, X = u0 * cr - v0 * sr, Y = u0 * sr + v0 * cr;
    let cx = X * .2, cy = Y * .2, ln = 0; for (let k = 0; k < 3; k++) { ln = Math.hypot(cx, cy); cx += Math.sin(cy + t2 * .1) * P.wi; cy += Math.cos(cx + t2 * .3 + Math.cos(ln)); } ln -= 3;
    const qx = fb(X, Y), qy = fb(X - .45, Y + .65), rx = fb(X + qx + .57 + .07 * t2, Y + qy + .52), ry = fb(X + qx + .34, Y + qy - .57 + .05 * t2), f = fb(X + rx, Y + ry);
    const shd = (f * f * f + .6 * f * f + .5 * f) * br, o = (j * w + i) * 4, cs = [Math.cos(ln + .5), Math.cos(ln), Math.cos(ln + .1)];
    for (let z = 0; z < 3; z++) { const base = C2[z] + (C1[z] - C2[z]) * (.5 + .5 * cs[z]); D[o + z] = 255 * Math.min(1, Math.max(0, light ? .35 + base * shd * .8 : base * shd)); }
    D[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); const g = cv.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low'; g.drawImage(sc, 0, 0, W, H);
}
function drawFold(cv, seed, t) {
  const W = cv.width, H = cv.height, P = foldOf(seed), E = FOLD_PAL[foldPal(seed, cv.dataset.pal)], R = foGl();
  if (!R) return foldCpu(cv, P, E, t);
  const { cv: gc, g, u } = R, k = t > 0 ? Math.min(1, 480 / W) : 1, w = Math.round(W * k), h = Math.round(H * k);   // 움직일 땐 폭 480까지만
  if (gc.width !== w || gc.height !== h) { gc.width = w; gc.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h); g.uniform1f(u.uT, P.t0 + t * .6); g.uniform1f(u.uSc, P.sc); g.uniform1f(u.uRot, P.rot); g.uniform1f(u.uWi, P.wi);
  g.uniform1f(u.uBr, E[3] ? .55 : .62); g.uniform1f(u.uLight, E[3] ? 1 : 0); g.uniform3fv(u.uC1, hx3(E[1])); g.uniform3fv(u.uC2, hx3(E[2]));
  g.drawArrays(g.TRIANGLES, 0, 3);
  const x = cv.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = true; x.drawImage(gc, 0, 0, W, H);
}
function fractalTile(o, seed) {
  if (o.tile) return o.tile;
  const G = 300, cnt = frDensity(o.P, G, 22000, 34, seed), vals = Float32Array.from(cnt.filter(v => v > 0)).sort(), L = vals.length || 1;
  const cv = document.createElement('canvas'); cv.width = cv.height = G;
  const x = cv.getContext('2d'), im = x.createImageData(G, G), C = FRACTAL_PAL[o.pal].slice(1).map(h => hx3(h).map(v => v * 255)), r = rng(seed * 3 + 1);
  if (o.inv) C.reverse();
  const rank = v => { let lo = 0, hi = vals.length; while (lo < hi) { const m = (lo + hi) >> 1; if (vals[m] < v) lo = m + 1; else hi = m; } return lo / L; };
  for (let i = 0; i < G * G; i++) {
    const t = cnt[i] > 0 ? .12 + .88 * Math.pow(rank(cnt[i]), 1.25) : 0, k = t * 4, j = Math.min(3, Math.floor(k)), fr = k - j, gr = (r() - .5) * 8;
    for (let q = 0; q < 3; q++) im.data[i * 4 + q] = C[j][q] + (C[j + 1][q] - C[j][q]) * fr + gr;
    im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0); o.tile = cv; o.bg = C[0].map(Math.round); return cv;
}
function drawFractal(cv, seed, t) {
  const W = cv.width, H = cv.height, o = fractalOf(seed), T = fractalTile(o, seed), ts = W / o.n, x = cv.getContext('2d');
  const ox = ((t * .006 * ts) % ts + ts) % ts, oy = ((t * .004 * ts) % ts + ts) % ts;   // 아주 천천히 비스듬히 흘러요
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  for (let yy = -oy; yy < H; yy += ts) for (let xx = -ox; xx < W; xx += ts) x.drawImage(T, xx, yy, ts + .5, ts + .5);
  if (t > 0) { x.globalCompositeOperation = 'screen'; x.globalAlpha = .07 * (.5 + .5 * Math.sin(t * .5)); for (let yy = -oy; yy < H; yy += ts) for (let xx = -ox; xx < W; xx += ts) x.drawImage(T, xx, yy, ts + .5, ts + .5); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }   // 실의 빛이 숨 쉬어요
  const cy = H / 2 - (H / W > 1.6 ? .08 * W : 0), g = x.createRadialGradient(W / 2, cy, 0, W / 2, cy, W * .55), c = `rgba(${o.bg.join(',')},`;   // 글 둘레: 박스 없이 바탕색으로 넓고 옅게
  g.addColorStop(0, c + '.8)'); g.addColorStop(.55, c + '.56)'); g.addColorStop(1, c + '0)');
  x.save(); x.translate(W / 2, cy); x.scale(1, .62); x.translate(-W / 2, -cy); x.fillStyle = g; x.fillRect(0, -H, W, H * 4); x.restore();
}
export function drawCode(cv, seed, shift = 0, t = 0, grainAmt = cv.dataset.gr === '0' ? .01 : .09) {   // 노이즈 끄면 맑게(.01은 색 줄 생김만 막는 정도)
  const W = cv.width, H = cv.height; if (!W || !H) return;
  if (cv.dataset.code === 'slit') return drawSlit(cv, seed, shift, t, cv.dataset.gr === '0' ? 0 : .035);
  if (cv.dataset.code === 'swirl') return drawSwirl(cv, seed, t, cv.dataset.gr === '0' ? 0 : .05);
  if (cv.dataset.code === 'neon') return drawNeon(cv, seed, t, cv.dataset.gr === '0' ? 0 : .05);
  if (cv.dataset.code === 'fractal') return drawFractal(cv, seed, t);
  if (cv.dataset.code === 'plasma') return drawPlasma(cv, seed, t, cv.dataset.gr === '0' ? 0 : .025);
  if (cv.dataset.code === 'fold') return drawFold(cv, seed, t);
  if (cv.dataset.code === 'swarm') return drawSwarm(cv, seed, t);
  if (cv.dataset.code === 'dotw') return drawDotw(cv, seed, t);
  if (cv.dataset.code === 'cloud') return drawCloud(cv, seed, t, cv.dataset.gr === '0' ? 0 : .12);
  if (cv.dataset.code === 'float') return drawFloat(cv, seed, t, cv.dataset.gr === '0' ? 0 : .1);
  if (cv.dataset.code === 'liquid') return drawLiquid(cv, seed, t, cv.dataset.gr === '0' ? 0 : .14);
  if (cv.dataset.code === 'field') return drawField(cv, seed, t, cv.dataset.gr === '0' ? 0 : .1);
  if (cv.dataset.code === 'lens') return drawLens(cv, seed, t, cv.dataset.gr === '0' ? 0 : .1);
  if (cv.dataset.code === 'blob') return drawBlob(cv, seed, t, cv.dataset.gr === '0' ? 0 : .1);
  if (cv.dataset.code === 'city') return drawCity(cv, seed, t, cv.dataset.gr === '0' ? 0 : .1);
  if (cv.dataset.code === 'spec') return drawSpec(cv, seed, t, cv.dataset.gr === '0' ? 0 : .1);
  if (cv.dataset.code === 'wint') return drawWint(cv, seed, t, cv.dataset.gr === '0' ? 0 : .1);
  if (cv.dataset.code === 'bmod') return drawBmod(cv, seed, t, cv.dataset.gr === '0' ? 0 : .42);
  if (cv.dataset.code === 'ccomp') return drawCcomp(cv, seed, t, cv.dataset.gr === '0' ? 0 : .25);
  if (cv.dataset.code === 'cube') return drawCube(cv, seed, t, cv.dataset.gr === '0' ? 0 : .3);
  if (cv.dataset.code === 'gband') return drawGband(cv, seed, t, cv.dataset.gr === '0' ? 0 : .35);
  if (cv.dataset.code === 'retro') return drawRetro(cv, seed, t, cv.dataset.gr === '0' ? 0 : .03);
  if (cv.dataset.code === 'pixel') return drawPixel(cv, seed, t, cv.dataset.gr === '0' ? 0 : .03);
  if (cv.dataset.code === 'mesh') return drawMesh(cv, seed, t, cv.dataset.gr === '0' ? 0 : .04);
  if (cv.dataset.code === 'eclipse') return drawEclipse(cv, seed, t, cv.dataset.gr === '0' ? 0 : .05);
  if (cv.dataset.code === 'tunnel') return drawTunnel(cv, seed, t, cv.dataset.gr === '0' ? 0 : .05);
  const P = auroraOf(seed), full = W * 16 / 9, off = Math.max(0, full - H) * shift;
  const R = gl();
  if (!R) return cpu(cv, P, off, full, t);
  const { cv: gc, g, u } = R;
  if (gc.width !== W || gc.height !== H) { gc.width = W; gc.height = H; }
  g.viewport(0, 0, W, H);
  const arr = new Float32Array(MAXR * 8); P.R.forEach((r, i) => arr.set(r, i * 8));
  g.uniform2f(u.uRes, W, H); g.uniform1f(u.uFull, full); g.uniform1f(u.uOff, off); g.uniform1f(u.uT, t); g.uniform1f(u.uBase, P.base); g.uniform1i(u.uN, P.n); g.uniform1fv(u.uR, arr); g.uniform1f(u.uGrain, grainAmt);
  g.drawArrays(g.TRIANGLES, 0, 3);
  const c = cv.getContext('2d'); c.drawImage(gc, 0, 0);
}
