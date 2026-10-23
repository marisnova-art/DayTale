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
export function drawCode(cv, seed, shift = 0, t = 0, grainAmt = cv.dataset.gr === '0' ? .01 : .09) {   // 노이즈 끄면 맑게(.01은 색 줄 생김만 막는 정도)
  const W = cv.width, H = cv.height; if (!W || !H) return;
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
