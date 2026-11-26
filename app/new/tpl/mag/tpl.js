// 템플릿 틀: 잡지 표지 (포스터, 11-27 141차). 앤드류가 만든 잡지 틀(벽 위 잡지 · 그림자) 위에 — 제목 2단어 · 내 사진/영상(영화 룩) · 본문 3줄.
// 사진과 글은 종이의 기울기 · 휘어짐(격자 면)과 종이 빛(곱하기)을 따라가요. 4:5만.
// 그리기: 한 장의 캔버스 = 종이 빛을 뺀 틀 + (사진 · 글을 그래픽 칩으로 격자에 휘어 붙임) + 종이 빛 곱하기 → 피드 · 저장 이미지가 같아요.
// 쓰기(키보드 쓰기)에선 글 칸(제목 · 본문)이 같은 자리에 같은 기울기로 보이고, 키보드를 내리면 캔버스 글로.
// 영상: 커버 장면은 캔버스에 · 재생은 사진 자리에 같은 기울기로 얹은 칸(video.js, 룩은 필터로 등록)
// 룩 = c.filter 'mag-<id>' (영상 필터 이름과 같아요). 셔플 = 배치(A 60% · B · C) · 제목 색 · 룩
import { esc, htmlOf, soft, shape, rng } from '../../js/formats.js';
import { addFilter, srcOf } from '../../js/filters.js';
import { ic } from '../../js/icons.js';

const W = 1080, H = 1350;
const U = f => new URL(f, import.meta.url).href;
const SAMPLE_PH = 'tpl/mag/sample.webp';   // 기본 사진 (앤드류 11-27, 미드저니 유료 플랜) — 앱 주소(/new/) 기준

// 영화 룩 12 (11-27 시안). 모두 할레이션 · 필름 입자 · 비네팅
export const LOOKS = [
  { id: 'cred', name: '시네마 레드', sat: .85, con: .6, gain: [1.3, .55, .5], lift: [.03, .07, .05], sh: [-.06, .09, .05], hi: [.16, -.08, -.08], hal: 1, halc: [1, .18, .1], grain: .1, vig: .55 },
  { id: 'teal', name: '틸 & 오렌지', sat: 1.15, con: .5, gain: [1.08, 1, .9], lift: [0, .02, .04], sh: [-.06, .03, .09], hi: [.11, .03, -.09], hal: .35, halc: [1, .55, .2], grain: .05, vig: .38 },
  { id: 'bleach', name: '블리치 바이패스', sat: .32, con: .95, gain: [1.04, 1.03, 1], lift: [0, 0, .01], sh: [0, .01, .02], hi: [.02, .01, 0], hal: .2, halc: [1, .9, .8], grain: .08, vig: .45 },
  { id: 'neon', name: '나이트 네온', sat: 1.4, con: .6, gain: [1.05, .9, 1.12], lift: [.01, .03, .06], sh: [-.05, .07, .11], hi: [.13, -.04, .11], hal: .75, halc: [1, .2, .7], grain: .07, vig: .55 },
  { id: 'vint', name: '빈티지 필름', sat: .72, con: .25, gain: [1.05, .98, .84], lift: [.07, .05, .02], sh: [.01, .01, -.01], hi: [.05, .02, -.04], fade: .09, hal: .3, halc: [1, .5, .2], grain: .17, vig: .38 },
  { id: 'noir', name: '흑백 느와르', bw: 1, sat: 0, con: 1.05, gain: [1, 1, 1], lift: [0, 0, 0], sh: [0, 0, 0], hi: [0, 0, 0], hal: .25, halc: [1, 1, 1], grain: .13, vig: .62 },
  { id: 'vhs', name: '90년대 캠코더', mode: 1, sat: 1.18, con: .2, gain: [1.02, .97, 1.03], lift: [.03, .03, .05], sh: [0, .02, .04], hi: [.04, 0, -.02], fade: .05, hal: .25, halc: [1, .6, .6], grain: .11, vig: .22 },
  { id: 'disp', name: '일회용 카메라', mode: 3, sat: 1.15, con: .45, gain: [1.07, 1, .9], lift: [.02, .01, 0], sh: [0, .02, 0], hi: [.05, .02, -.03], hal: .3, halc: [1, .6, .3], grain: .13, vig: .6 },
  { id: 'pola', name: '폴라로이드', sat: .8, con: .18, gain: [1, 1, .95], lift: [.03, .08, .08], sh: [-.03, .04, .04], hi: [.04, .02, -.02], fade: .1, hal: .15, halc: [1, .8, .6], grain: .08, vig: .3 },
  { id: 'warm70', name: '70년대 웜 필름', mode: 2, sat: .9, con: .3, gain: [1.12, 1, .74], lift: [.09, .05, 0], sh: [.02, 0, -.03], hi: [.06, .02, -.06], fade: .06, hal: .35, halc: [1, .5, .15], grain: .15, vig: .42 },
  { id: 'y2k', name: 'Y2K 디지카', mode: 3, sat: 1.25, con: .35, gain: [.94, 1, 1.13], lift: [0, .01, .04], sh: [-.02, 0, .06], hi: [0, .02, .06], hal: 0, halc: [1, 1, 1], grain: .035, vig: .12 },
  { id: 'xpro', name: '크로스 프로세스', mode: 4, sat: 1.3, con: .6, gain: [1.02, 1.06, .85], lift: [0, .02, .08], sh: [-.02, .05, .06], hi: [.06, .08, -.08], hal: .2, halc: [1, .9, .4], grain: .07, vig: .42 },
];
// 예시 카드(룩을 안 고른 카드)는 씨앗으로: 예시 7 · 21 · 35 = 시네마 레드 · 틸 & 오렌지 · 나이트 네온 (A · B · C 배치)
const EXL = { 7: 'cred', 21: 'teal', 35: 'neon' };
export const lookOf = c => (!c?.sample && LOOKS.find(l => 'mag-' + l.id === c?.filter)) || LOOKS.find(l => l.id === EXL[c?.seed]) || LOOKS[(c?.seed | 0) % LOOKS.length];

// 종이 면: 틀 그림에서 읽은 가장자리(직선 맞춤) + 아래는 살짝 처짐 + 책등 쪽 눌림 (Coons 면). 종이 좌표 (u, v ∈ 0..1) → 카드 좌표(1080 기준)
const TOP = [0.010148, 97.919], LEF = [-0.011673, 138.395], RIG = [-0.002857, 1024.590], X0 = 137, X1 = 1023, Y0 = 100, Y1 = 1234;
const eT = u => { const x = X0 + u * (X1 - X0); return [x, TOP[0] * x + TOP[1]]; };
const eB = u => { const x = X0 + u * (X1 - X0); return [x, Y1 + (eT(u)[1] - eT(0)[1]) + Math.sin(u * Math.PI) * 4]; };
const eL = v => { const y = Y0 + v * (Y1 - Y0); return [LEF[0] * y + LEF[1], y]; };
const eR = v => { const y = Y0 + v * (Y1 - Y0); return [RIG[0] * y + RIG[1], y]; };
const C00 = eT(0), C10 = eT(1), C01 = eB(0), C11 = eB(1);
function P(u0, v) {
  const u = u0 + .012 * Math.sin(u0 * Math.PI) * (1 - u0), t = eT(u), b = eB(u), l = eL(v), r = eR(v);
  return [0, 1].map(i => (1 - v) * t[i] + v * b[i] + (1 - u) * l[i] + u * r[i] - ((1 - u) * (1 - v) * C00[i] + u * (1 - v) * C10[i] + (1 - u) * v * C01[i] + u * v * C11[i]));
}
const quad = r => [P(r.u, r.v), P(r.u + r.w, r.v), P(r.u + r.w, r.v + r.h), P(r.u, r.v + r.h)];
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const flat = r => { const q = quad(r); return [dist(q[0], q[1]), dist(q[0], q[3])]; };   // 자리를 펴 놓은 크기 (카드 px)

// 배치 (종이 좌표): A 레퍼런스(제목 위 · 사진 · 본문) · B 사진 위 · 제목 아래 · C 제목이 사진 아래쪽에 겹침
const LAYOUTS = {
  A: { title: { u: .06, v: .03, w: .88, h: .13 }, photo: { u: .06, v: .185, w: .88, h: .64 }, body: { u: .06, v: .855, w: .88, h: .11 } },
  B: { photo: { u: .06, v: .04, w: .88, h: .66 }, title: { u: .06, v: .72, w: .88, h: .13 }, body: { u: .06, v: .87, w: .88, h: .1 } },
  C: { photo: { u: .06, v: .04, w: .88, h: .72 }, title: { u: .06, v: .69, w: .88, h: .13 }, body: { u: .06, v: .86, w: .88, h: .11 } },
};
const INKS = ['#d0452f', '#1f3fbf', '#141414', '#e8641b', '#0f7a55', '#ffffff'];   // 흰색은 제목이 사진에 겹치는 C에서만
export const layoutOf = c => { const x = rng(((c?.seed || 1) ^ 0x5bd10028) >>> 0)(); return x < .6 ? 'A' : x < .8 ? 'B' : 'C'; };
export const inkOf = c => { const x = rng(((c?.seed || 1) ^ 0x27d40033) >>> 0)(), n = layoutOf(c) === 'C' ? INKS.length : INKS.length - 1; return INKS[Math.floor(x * n)]; };
// 처음 카드 = A 배치 · 빨간 제목 (레퍼런스처럼)
const firstSeed = () => { for (;;) { const s = Math.floor(Math.random() * 1e9); if (layoutOf({ seed: s }) === 'A' && inkOf({ seed: s }) === INKS[0]) return s; } };

// ── 그래픽 칩: 룩 보정 + 격자 면 (한 번에) ────────────────────────────
const VS = 'attribute vec2 p, t, q; uniform vec2 S; varying vec2 vt, vq; void main(){ vt = t; vq = q; gl_Position = vec4(p.x / S.x * 2. - 1., 1. - p.y / S.y * 2., 0., 1.); }';
const FS = `precision highp float;
uniform sampler2D T; uniform vec2 R, K; uniform float pass, sat, con, hal, grain, vig, fade, bw, mode, seed;
uniform vec3 gain, lift, sh, hi, halc; varying vec2 vt, vq;
float L(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
vec3 tx(vec2 u){ return texture2D(T, clamp(u, 0., 1.)).rgb; }
void main(){
  if (pass > .5) { gl_FragColor = texture2D(T, vt); return; }
  vec2 u = vt; vec3 c;
  if (mode == 1.) { float o = 3. / R.x * K.x; c = vec3(tx(u + vec2(o, 0)).r, (tx(u).g + tx(u + vec2(o * .5, 0)).g) * .5, tx(u - vec2(o, 0)).b); }   // VHS 색 번짐
  else c = tx(u);
  vec3 g = vec3(0.);   // 할레이션: 밝은 곳 둘레 번짐
  for (int i = 0; i < 16; i++) { float a = float(i) * .3927; for (int k = 1; k < 3; k++) { vec2 d = vec2(cos(a), sin(a)) * float(k) * .014 * vec2(R.y / R.x, 1.) * K; g += max(tx(u + d) - .72, 0.); } }
  g /= 32.;
  float l;
  if (mode == 4.) c = vec3(smoothstep(.06, .94, c.r), pow(c.g, .86), c.b * .72 + .14);   // 크로스 프로세스
  c = mix(c, c * c * (3. - 2. * c), con); c = mix(c, c * c * (3. - 2. * c), con * .5);
  l = L(c); c = mix(vec3(l), c, sat);
  if (bw > .5) { c = vec3(l); c = mix(c, c * c * (3. - 2. * c), .6); }
  c += sh * (1. - l) * (1. - l) * 1.6 + hi * l * l * 1.3;
  c = c * gain + lift * (1. - c);
  c = max(c, vec3(fade));
  c += g * halc * hal * 3.2;
  vec2 q = vq - .5; float r = length(q * vec2(R.x / R.y, 1.)) / .75;
  if (mode == 3.) { c *= 1. + .28 * (1. - smoothstep(0., .9, r)); c = mix(c, c * c * (3. - 2. * c), .25); }   // 정면 플래시
  if (mode == 2.) c = 1. - (1. - c) * (1. - vec3(1., .42, .12) * .55 * smoothstep(.55, 0., vq.x + (vq.y - .35) * .35));   // 빛 샘
  if (mode == 1.) c *= .9 + .1 * sin(vq.y * R.y * 1.6);   // 주사선
  c *= 1. - vig * pow(r, 2.2);
  c += (h(floor(vq * R)) - .5) * grain * (1.2 - abs(l - .5));
  float e = min(min(vq.x, 1. - vq.x) * R.x, min(vq.y, 1. - vq.y) * R.y), al = clamp(e / 1.4, 0., 1.);   // 가장자리 부드럽게 (계단 없이)
  gl_FragColor = vec4(clamp(c, 0., 1.) * al, al);
}`;
let G = null;
function gpu() {
  if (G !== null) return G;
  G = false;
  try {
    const cv = document.createElement('canvas'), gl = cv.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true });
    if (!gl) return G;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const u = {}; ['T', 'R', 'K', 'S', 'pass', 'sat', 'con', 'hal', 'grain', 'vig', 'fade', 'bw', 'mode', 'seed', 'gain', 'lift', 'sh', 'hi', 'halc'].forEach(k => { u[k] = gl.getUniformLocation(pr, k); });
    const a = ['p', 't', 'q'].map(k => gl.getAttribLocation(pr, k)), buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    a.forEach((l, i) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 24, i * 8); });
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(u.T, 0);
    G = { cv, gl, u };
  } catch (e) { console.warn('mag gl', e); G = false; }
  return G;
}
function setLook(lk, seed) {
  const { gl, u } = G, f = (k, v) => gl.uniform1f(u[k], v), v3 = (k, v) => gl.uniform3f(u[k], ...v);
  f('pass', lk ? 0 : 1); if (!lk) return;
  f('sat', lk.sat); f('con', lk.con); f('hal', lk.hal); f('grain', lk.grain); f('vig', lk.vig); f('fade', lk.fade || 0); f('bw', lk.bw || 0); f('mode', lk.mode || 0); f('seed', seed % 1000);
  v3('gain', lk.gain); v3('lift', lk.lift); v3('sh', lk.sh); v3('hi', lk.hi); v3('halc', lk.halc);
}
const upload = (src, pre) => { const { gl } = G; gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, pre); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); };
// 자리(r)에 그림(src)을 격자로 휘어 그려요. crop = [x0, y0, w, h] (그림 안 쓸 부분, 0..1). lk 없으면 그대로(글)
function mesh(src, r, crop, lk, seed, n = 24) {
  const { gl, u } = G, [fw, fh] = flat(r), d = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const v = (a, e) => { const qx = a / n, qy = e / n, [x, y] = P(r.u + r.w * qx, r.v + r.h * qy); d.push(x, y, crop[0] + qx * crop[2], crop[1] + qy * crop[3], qx, qy); };
    v(i, j); v(i + 1, j); v(i + 1, j + 1); v(i, j); v(i + 1, j + 1); v(i, j + 1);
  }
  upload(src, !lk); setLook(lk, seed);
  gl.uniform2f(u.S, W, H); gl.uniform2f(u.R, fw, fh); gl.uniform2f(u.K, crop[2], crop[3]);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.STREAM_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, d.length / 6);
}
// 영상 장면 하나에 룩만 (video.js가 장면마다 불러요). 돌려준 캔버스는 바로 그려 써야 해요
function gradeFlat(src, lk) {
  if (!gpu()) return null;
  const { cv, gl, u } = G, w = src.width, h = src.height;
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  upload(src, false); setLook(lk, Math.floor(Math.random() * 997));
  gl.uniform2f(u.S, 1, 1); gl.uniform2f(u.R, w, h); gl.uniform2f(u.K, 1, 1);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1]), gl.STREAM_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return cv;
}
LOOKS.forEach(lk => addFilter('mag-' + lk.id, { name: lk.name, run: src => gradeFlat(src, lk) }));

// ── 그림 불러오기 ────────────────────────────────────────────
const IM = new Map();
const load = src => { if (!IM.has(src)) { const o = { img: new Image(), ok: false, p: null }; o.p = new Promise(r => { o.img.onload = () => { o.ok = true; r(o); }; o.img.onerror = () => r(o); }); o.img.src = src; IM.set(src, o); } return IM.get(src); };
const FR = () => load(U('./frame.webp')), SH = () => load(U('./shade.webp'));
const photoSrc = c => c?.bg?.id === 'photo' ? srcOf(c.bg) : '';
const FONT_T = '"DT Black Han Sans", "Pretendard Variable", sans-serif', FONT_B = '"Pretendard Variable", Pretendard, sans-serif';
const fontsOk = () => !document.fonts || (document.fonts.check(`40px ${FONT_T}`, 'A가') && document.fonts.check(`500 40px ${FONT_B}`, 'A가'));
async function need(c) {
  const s = photoSrc(c);
  await Promise.all([FR().p, SH().p, s ? load(s).p : null, document.fonts?.load(`40px ${FONT_T}`, (c?.title || 'Film Vibes') + '가').catch(() => {}), document.fonts?.load(`500 40px ${FONT_B}`, '가A').catch(() => {})]);
}
const ready = c => FR().ok && SH().ok && (!photoSrc(c) || load(photoSrc(c)).ok || load(photoSrc(c)).img.complete) && fontsOk();

// 사진이 없을 때: 회색 필름 질감 (한 번 만들어 둬요)
let EMPTY = null;
const empty = () => {
  if (EMPTY) return EMPTY;
  const c = document.createElement('canvas'); c.width = 360; c.height = 360; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 360, 360); g.addColorStop(0, '#b9b2ab'); g.addColorStop(1, '#8e8984'); x.fillStyle = g; x.fillRect(0, 0, 360, 360);
  const id = x.getImageData(0, 0, 360, 360), r = rng(1127);
  for (let i = 0; i < id.data.length; i += 4) { const n = (r() - .5) * 34; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
  x.putImageData(id, 0, 0); return (EMPTY = c);
};

// ── 글 ─────────────────────────────────────────────────────
const mx = document.createElement('canvas').getContext('2d');
const plain = h => { const d = document.createElement('div'); d.innerHTML = (h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/(div|p)>/gi, ' '); return d.textContent.replace(/\s+/g, ' ').trim(); };
// 줄 나누기: 낱말 단위, 한 낱말이 폭보다 길면 글자 단위
function wrap(t, w) {
  const out = []; let ln = '';
  for (const wd of t.split(' ')) {
    const tt = ln ? ln + ' ' + wd : wd;
    if (mx.measureText(tt).width <= w) { ln = tt; continue; }
    if (ln) out.push(ln);
    if (mx.measureText(wd).width <= w) { ln = wd; continue; }
    ln = ''; for (const ch of wd) { if (mx.measureText(ln + ch).width > w && ln) { out.push(ln); ln = ch; } else ln += ch; }
  }
  if (ln) out.push(ln);
  return out;
}
// 본문 크기: 3줄 안에 들어가게 (자리 높이의 25%에서 시작, 넘치면 줄여요 · 너무 길면 3줄에서 … )
function bodyFit(t, fw, fh) {
  let fs = fh * .25, lines;
  for (let k = 0; k < 8; k++) { mx.font = `500 ${fs}px ${FONT_B}`; lines = wrap(t, fw); if (lines.length <= 3 || fs < fh * .17) break; fs *= .93; }
  if (lines.length > 3) { lines = lines.slice(0, 3); let l = lines[2]; while (l && mx.measureText(l + '…').width > fw) l = l.slice(0, -1); lines[2] = l + '…'; }
  return { fs, lines };
}
const titleFs = (t, fw, fh) => { let fs = fh * .92; mx.font = `${fs}px ${FONT_T}`; const m = mx.measureText(t || 'A').width; return Math.min(fs, fs * fw / Math.max(1, m)); };
function textCv(r, k, drawFn) {
  const [fw, fh] = flat(r), c = document.createElement('canvas'); c.width = Math.max(2, Math.round(fw * k)); c.height = Math.max(2, Math.round(fh * k));
  const x = c.getContext('2d'); x.scale(k, k); drawFn(x, fw, fh); return c;
}
const titleOf = c => (c?.title ?? 'Film Vibes').replace(/\s+/g, ' ').trim();

// ── 카드 캔버스 그리기 ────────────────────────────────────────
// o = { title, body, text: 글도 그릴지 }
function paint(cv, c, o) {
  const k = cv.width / W, ctx = cv.getContext('2d'), L = LAYOUTS[layoutOf(c)], lk = lookOf(c), s = photoSrc(c), pim = s && load(s).img;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(FR().img, 0, 0, cv.width, cv.height);
  const R = gpu();
  // 사진 자리 (자리 비율로 꽉 채워 자르기 · 사진 위치 x · y)
  let src = empty(), crop = [0, 0, 1, 1], look = null;
  if (pim && pim.naturalWidth) {
    const [fw, fh] = flat(L.photo), iw = pim.naturalWidth, ih = pim.naturalHeight, sc = Math.max(fw / iw, fh / ih), cw = fw / (iw * sc), ch = fh / (ih * sc);
    src = pim; crop = [(1 - cw) * (c.bg.x ?? 50) / 100, (1 - ch) * (c.bg.y ?? 50) / 100, cw, ch]; look = lk;
  }
  const tcv = o.text && textCv(L.title, k * 1.5, (x, w, h) => {
    const t = o.title, fs = titleFs(t, w, h); x.font = `${fs}px ${FONT_T}`; x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillText(t, w / 2 + fs * .03, h / 2 + fs * .04);
    x.fillStyle = inkOf(c); x.fillText(t, w / 2, h / 2);
  });
  const bcv = o.text && o.body && textCv(L.body, k * 1.5, (x, w, h) => {
    const { fs, lines } = bodyFit(o.body, w, h); x.font = `500 ${fs}px ${FONT_B}`; x.fillStyle = '#1d1d1f'; x.textBaseline = 'top';
    lines.forEach((l, i) => x.fillText(l, 0, h * .06 + i * fs * 1.45));
  });
  if (R) {
    const { cv: g, gl } = R;
    if (g.width !== cv.width || g.height !== cv.height) { g.width = cv.width; g.height = cv.height; }
    gl.viewport(0, 0, g.width, g.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    mesh(src, L.photo, crop, look, (c.seed || 1) % 1000);
    if (tcv) mesh(tcv, L.title, [0, 0, 1, 1], null, 0, 10);
    if (bcv) mesh(bcv, L.body, [0, 0, 1, 1], null, 0, 10);
    ctx.drawImage(g, 0, 0);
  } else {   // 그래픽 칩이 없으면: 휘어짐 · 보정 없이 자리에 그대로
    [[src, L.photo, crop], [tcv, L.title], [bcv, L.body]].forEach(([im, r, cr]) => {
      if (!im) return; const q = quad(r), [fw, fh] = flat(r), iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, cc = cr || [0, 0, 1, 1];
      ctx.drawImage(im, cc[0] * iw, cc[1] * ih, cc[2] * iw, cc[3] * ih, q[0][0] * k, q[0][1] * k, fw * k, fh * k);
    });
  }
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(SH().img, 0, 0, cv.width, cv.height); ctx.globalCompositeOperation = 'source-over';   // 종이 빛 (사진 · 글 모두)
}

// 화면 좌표의 사각형(0,0 ~ w,h)을 네 점(q)으로 보내는 CSS 변환 (글 칸 · 영상 칸이 종이 기울기를 따라가요)
function m3d(q, w, h) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, hh = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
  return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1].map(v => +v.toFixed(8)).join(',')})`;
}
const place = (n, r, s) => { if (!n) return; const [fw, fh] = flat(r), q = quad(r).map(([x, y]) => [x * s, y * s]); n.style.width = fw * s + 'px'; n.style.height = fh * s + 'px'; n.style.transform = m3d(q, fw * s, fh * s); };

function mag(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd cmag' + (edit ? ' edit' : '');
  shape(el, 1.25); el._c = c;
  const L = LAYOUTS[layoutOf(c)], b = c.bg, has = !!photoSrc(c), html = soft(htmlOf(c), edit), [pw, ph] = flat(L.photo);
  el.style.setProperty('--ink', inkOf(c));
  el.innerHTML = `<canvas class="mcv" width="720" height="900"></canvas>
    ${b?.vd ? `<div class="mvb" data-ar="${(ph / pw).toFixed(4)}"><canvas class="bgv"></canvas></div><img class="msh" src="${U('./shade.webp')}" alt="">` : ''}
    ${edit ? `<div class="mf mb body" contenteditable="true" spellcheck="false" data-ph="오늘 하루를 짧게 써 보세요">${html}</div>
    <div class="mf mt body" data-f="title" contenteditable="true" spellcheck="false" autocapitalize="off" enterkeyhint="done" data-ph="제목 두 단어">${esc(c.title ?? '')}</div>
    ${has ? '' : `<button class="phadd mpa" aria-label="사진 · 영상">${ic('plus')}<span>사진 · 영상</span></button>`}` : ''}`;
  if (edit) el.querySelector('.mt').addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });   // 제목은 한 줄
  const cv = el.querySelector('.mcv');
  const go = () => { if (el._k == null) { el._k = key(el); paint(cv, c, txt(el)); } };
  if (ready(c)) go(); else need(c).then(() => { el._k = key(el); paint(cv, el._c, txt(el)); });
  return el;
}
// 지금 그릴 글: 쓰는 중이면 글 칸에서 (키보드 쓰기에선 글 칸이 보이고 캔버스 글은 빼요)
const typing = el => !!el.closest('.wr.typ');
function txt(el) {
  const c = el._c, t = el.querySelector('.mt'), bd = el.querySelector('.mb');
  return { text: !typing(el), title: t ? t.textContent.replace(/\s+/g, ' ').trim() : titleOf(c), body: bd ? plain(bd.innerHTML) : plain(htmlOf(c)) };
}
const key = el => { const c = el._c, o = txt(el), cv = el.querySelector('.mcv'); return JSON.stringify([cv.width, o.text && o.title, o.text && o.body, o.text, c.filter, c.seed, photoSrc(c), c.bg?.x, c.bg?.y]); };

function fit(el, c0) {
  if (c0) el._c = c0;   // ↶ · ↷ 뒤엔 카드가 새 값이라 늘 지금 카드로
  const Wd = el.clientWidth; if (!Wd) return;
  el.style.height = Wd * 1.25 + 'px';
  const s = Wd / W, c = el._c, L = LAYOUTS[layoutOf(c)], cv = el.querySelector('.mcv');
  // 캔버스 해상도: 보이는 크기 × 화면 배율 (최대 1080). 많이 다르면 다시
  const want = Math.min(W, Math.round(Wd * Math.min(2, devicePixelRatio || 1)));
  if (Math.abs(cv.width - want) / want > .15) { cv.width = want; cv.height = Math.round(want * 1.25); el._k = null; }
  place(el.querySelector('.mt'), L.title, s); place(el.querySelector('.mb'), L.body, s); place(el.querySelector('.mvb'), L.photo, s);
  const t = el.querySelector('.mt'), bd = el.querySelector('.mb');
  if (t) { const [fw, fh] = flat(L.title); t.style.fontSize = titleFs(t.textContent.trim() || '제목 두 단어', fw, fh) * s + 'px'; t.style.lineHeight = fh * s + 'px'; }
  if (bd) { const [fw, fh] = flat(L.body), { fs } = bodyFit(plain(bd.innerHTML) || '가', fw, fh); bd.style.fontSize = fs * s + 'px'; bd.style.paddingTop = fh * .06 * s + 'px'; }
  const sh = el.querySelector('.msh'); if (sh) sh.style.clipPath = `polygon(${quad(L.photo).map(([x, y]) => `${(x * s).toFixed(1)}px ${(y * s).toFixed(1)}px`).join(',')})`;
  const pa = el.querySelector('.mpa'); if (pa) { const q = quad(L.photo); pa.style.left = (q[0][0] + q[2][0]) / 2 * s + 'px'; pa.style.top = (q[0][1] + q[2][1]) / 2 * s + 'px'; }
  const k = key(el);
  if (k !== el._k && ready(c)) { el._k = k; paint(cv, c, txt(el)); }
}

// 룩 줄 미리보기: 내 사진(없으면 기본 사진)을 그 룩으로 (작은 정사각형)
const TH = new Map();
export async function lookThumb(c, id) {
  const s = photoSrc(c) || SAMPLE_PH, kk = s + '|' + id + '|' + (c.bg?.x ?? 50);
  if (TH.has(kk)) return TH.get(kk);
  const o = await load(s).p; if (!o.ok || !gpu()) return '';
  const im = o.img, m = Math.min(im.naturalWidth, im.naturalHeight), cv = document.createElement('canvas'); cv.width = cv.height = 120;
  cv.getContext('2d').drawImage(im, (im.naturalWidth - m) / 2, (im.naturalHeight - m) / 2, m, m, 0, 0, 120, 120);
  const g = gradeFlat(cv, LOOKS.find(l => l.id === id)); if (!g) return '';
  const out = document.createElement('canvas'); out.width = out.height = 120; out.getContext('2d').drawImage(g, 0, 0);
  const u = out.toDataURL('image/jpeg', .8); TH.set(kk, u); return u;
}

const SAMPLE = { html: '잎 사이로 들어온 빛이 얼굴에 내려앉았다. 오늘은 이 장면 하나면 충분했다.', title: 'Film Vibes', seed: 7, bg: { id: 'photo', src: SAMPLE_PH, w: 900, h: 900, x: 50, y: 50 }, showDate: false };

export default {
  id: 'mag', name: '잡지 표지', info: '내 사진 · 영상 + 영화 룩 · 제목 두 단어 · 짧은 글', paid: true, css: true,
  tools: { photo: 'tab', video: true, look: true, ratio: false, emo: false, page: false, shuf: true, style: false, font: false, bg: false, dp: false },
  fonts: [['extra.css', 'DT Black Han Sans']],
  sample: SAMPLE,
  datePos: 'none',
  blank: () => ({ html: '', title: 'Film Vibes', seed: firstSeed(), filter: 'mag-cred', bg: { id: 'photo', src: SAMPLE_PH, w: 900, h: 900, x: 50, y: 50 }, datePos: 'none', showDate: false }),
  render: (c, o) => mag(c, o),
  fit,
  prep: need,   // 저장 전에 틀 · 사진 · 글꼴을 먼저
  // 셔플: 배치 · 제목 색은 seed로, 룩은 다른 것으로 (main.js가 seed를 바꾼 뒤 불러요)
  shuffle: c => { const cur = lookOf(c).id, l = LOOKS.filter(x => x.id !== cur); c.filter = 'mag-' + l[Math.floor(Math.random() * l.length)].id; },
  looks: LOOKS, lookOf, lookThumb,
  tone: c => ({ cred: '#5a1712', teal: '#1d3a40', bleach: '#3a3a38', neon: '#2a1040', vint: '#4a3a28', noir: '#202020', vhs: '#2b2840', disp: '#3a3020', pola: '#36423f', warm70: '#4d3216', y2k: '#1d2a48', xpro: '#2a4020' })[lookOf(c).id] || '#3a2a26',
};
