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
  { id: 'slit', code: 'slit', tone: '#F07F3C', ink: '#fff', dim: ['all', '10,8,14', 0] },   // 노을 띠: 딤 · 글자색은 띠 밝기로 (formats.js slitLayer)
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

// 노을 띠 (11-20, 앤드류 레퍼런스: 슬릿스캔 가로 띠 풍경 → 코드). 가는 띠 많이 + 굵은 띠 가끔, 띠마다 가로로 살짝 번진 색.
// 색 묶음 5개(노을 · 새벽 바다 · 숲 · 밤 도시 · 겨울 들판) = 씨앗 % 5. 같은 씨앗이면 늘 같은 그림.
// 9:16 원본을 한 번 그려 두고(그레인까지) 카드만큼 잘라 보여 줘요. 모션 = 원본을 아주 조금 당겼다 놓는 숨 (t=0이면 정확히 멈춘 그림)
export const SLIT_PAL = [
  ['노을', ['#7FB4DA', '#A9C9DE', '#E9C9A0', '#F2A65A', '#F07F3C', '#C9532E', '#6E4A2E', '#3B3A26', '#24251A']],
  ['새벽 바다', ['#1F2F4F', '#36507A', '#6E86B0', '#B9B7CF', '#E8C3B9', '#9DB3C6', '#4F7290', '#284763', '#14263B']],
  ['숲', ['#C9D9C2', '#9DB98F', '#6E9466', '#4C7550', '#E2C46A', '#3D5C3C', '#2B4430', '#1D2F22', '#142018']],
  ['밤 도시', ['#0D1026', '#1C1F4A', '#3A2E6E', '#7A3F86', '#E2557A', '#F59E5B', '#2A2F5A', '#14183A', '#080A1C']],
  ['겨울 들판', ['#E9EEF3', '#D7E1EA', '#C6D3DF', '#F2E6DA', '#E7D2C2', '#BFCAD3', '#A7B4BE', '#D9DDE0', '#8E9AA3']],
];
export const slitPal = seed => ((seed >>> 0) || 1) % SLIT_PAL.length;
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mx = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const palAt = (p, t) => { const x = Math.max(0, Math.min(.9999, t)) * (p.length - 1), i = Math.floor(x); return mx(p[i], p[i + 1], x - i); };
const cl = c => c.map(v => Math.round(Math.max(0, Math.min(255, v))));
const lumOf = c => (.2126 * c[0] + .7152 * c[1] + .0722 * c[2]) / 255;
const bandCache = new Map();
// 띠 목록 (0~1, 원본 9:16 세로 기준): [위, 높이, 왼쪽 색, 밝은 자리, 가운데 색, 오른쪽 색, 빛 줄]
function slitBands(seed) {
  if (bandCache.has(seed)) return bandCache.get(seed);
  const r = rng(seed ^ 0x2c1b3c6d), p = SLIT_PAL[slitPal(seed)][1].map(hx), warp = r() * .25 - .12, out = [];
  let y = 0;
  while (y < 1) {
    const k = r(), h = k < .55 ? .004 + r() * .012 : k < .9 ? .02 + r() * .035 : .06 + r() * .07;
    const t = y + h / 2, j = (r() - .5) * .07, d = (r() - .5) * 26;
    const L = palAt(p, t + warp * Math.sin(t * 3.1) + j).map(v => v + d), R = mx(L, palAt(p, t + j + (r() - .5) * .12), .5 + r() * .4);
    out.push([y, h, cl(mx(L, [0, 0, 0], .08)), .25 + r() * .5, cl(R.map(v => v + 14)), cl(mx(L, R, .5)), r() < .18 ? .06 + r() * .08 : 0]);
    y += h;
  }
  if (bandCache.size > 40) bandCache.delete(bandCache.keys().next().value);
  bandCache.set(seed, out); return out;
}
// 원본 세로 a~b(0~1) 사이의 평균 밝기 → 글자색 고르기에 써요 (그리기 전에도 알 수 있게 띠 목록으로 계산)
export function slitLum(seed, a, b) {
  let s = 0, n = 0;
  for (const [y, h, L, , M, R] of slitBands(seed)) {
    const o = Math.min(b, y + h) - Math.max(a, y); if (o <= 0) continue;
    s += o * (lumOf(L) * .3 + lumOf(M) * .4 + lumOf(R) * .3); n += o;
  }
  return n ? s / n : .5;
}
const slitImgs = new Map();
function slitImg(seed, W, gr) {
  const key = seed + '|' + W + '|' + gr;
  if (slitImgs.has(key)) { const v = slitImgs.get(key); slitImgs.delete(key); slitImgs.set(key, v); return v; }
  const H = Math.round(W * 16 / 9), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (const [y, h, L, at, M, R, sh] of slitBands(seed)) {
    const gr2 = g.createLinearGradient(0, 0, W, 0);
    gr2.addColorStop(0, `rgb(${L})`); gr2.addColorStop(at, `rgb(${M})`); gr2.addColorStop(1, `rgb(${R})`);
    g.fillStyle = gr2; g.fillRect(0, Math.floor(y * H), W, Math.ceil(h * H) + 1);
    if (sh) { g.fillStyle = `rgba(255,255,255,${sh})`; g.fillRect(0, (y + h * .3) * H, W, Math.max(1, h * .15 * H)); }
  }
  // 띠 사이를 살짝 번지게 (가로 사진이 흐른 느낌). filter가 없는 기기는 그대로
  try { const t = document.createElement('canvas'); t.width = W; t.height = H; t.getContext('2d').drawImage(cv, 0, 0); g.filter = `blur(${Math.max(.5, W / 1100).toFixed(2)}px)`; g.drawImage(t, 0, 0); g.filter = 'none'; } catch {}
  if (gr > 0) {   // 필름 그레인: 밝기만 흔들어요
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
    out.push([y, h, (.05 + r() * .13) * (r() < .5 ? -1 : 1), r() * 1.6, .18 + r() * .3, .16 + r() * .26]);   // 위, 높이, 속도(폭/초), 시작, 빛 폭, 세기
  }
  if (sweepCache.size > 40) sweepCache.delete(sweepCache.keys().next().value);
  sweepCache.set(seed, out); return out;
}
function drawSlit(cv, seed, shift, t, grainAmt) {
  const W = cv.width, H = cv.height, src = slitImg(seed, W, grainAmt), full = src.height, g = cv.getContext('2d');
  const off = Math.max(0, full - H) * shift;
  const e = t > 0 ? (x => x * x * (3 - 2 * x))(Math.min(1, t / 2.5)) : 0;   // 처음 2.5초에 천천히 시작 (t=0이면 정확히 멈춘 그림)
  const vis = Math.min(full, H), sh = vis * (1 - .14 * e);   // 14% 당겨 두고 그 안에서 위아래로 흘러요
  const room = full - sh, mid = Math.min(room, Math.max(0, off + (vis - sh) / 2));
  const sy = Math.max(0, Math.min(room, mid + Math.min(mid, room - mid, vis * .1) * Math.sin(t * .32) * e));
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
export function drawCode(cv, seed, shift = 0, t = 0, grainAmt = cv.dataset.gr === '0' ? .01 : .09) {   // 노이즈 끄면 맑게(.01은 색 줄 생김만 막는 정도)
  const W = cv.width, H = cv.height; if (!W || !H) return;
  if (cv.dataset.code === 'slit') return drawSlit(cv, seed, shift, t, cv.dataset.gr === '0' ? 0 : .09);
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
