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
