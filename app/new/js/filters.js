// 사진 필터 (기본 포맷의 내 사진 · 영상 장): 그래픽 칩(WebGL)으로 사진에 걸어요. 결과는 사진 한 장(JPEG)으로 만들어 두고 배경 그림으로 써요
// (그래서 끌어서 위치 맞추기 · 긴 장 · 저장 이미지가 내 사진 배경과 똑같이 움직여요). 영상에도 같은 셰이더를 쓸 거예요
import { url as photoUrl } from './photos.js';

// 사진 톤 7 · 흑백 3 · 그래픽 5 · 흐름 2 (10-30: 톤을 진하게, 서로 겹치지 않게). m = 셰이더 안 번호
export const FILTERS = [
  ['none', '원본', 0], ['film', '필름', 1], ['faded', '바랜', 2], ['cine', '영화', 4], ['vivid', '선명', 3], ['dusk', '노을', 8], ['dawn', '새벽', 9], ['leak', '빛 샘', 6],
  ['mono', '흑백', 10], ['mono2', '진한 흑백', 11], ['mono3', '거친 흑백', 12],
  ['dot', '도트', 13], ['pixel', '픽셀', 14], ['halftone', '하프톤', 15], ['duo', '듀오톤', 16], ['sketch', '스케치', 17],
  ['motion', '모션 블러', 18], ['zoom', '줌 블러', 19],
].map(([id, name, m]) => ({ id, name, m, d: 0 }));
// 빛 샘은 네 모서리 중 한 곳에서 (카드에 c.leak 0~3: 왼쪽 위 · 오른쪽 위 · 오른쪽 아래 · 왼쪽 아래). 필터 이름에 붙여 다녀요 ('leak2')
export const filterOf = id => { const m = /^leak([0-3])$/.exec(id || ''); if (m) return { ...FILTERS.find(f => f.id === 'leak'), d: +m[1] }; return FILTERS.find(f => f.id === id) || FILTERS[0]; };
export const fidOf = c => c?.filter === 'leak' ? 'leak' + ((c.leak | 0) % 4) : c?.filter;
// 노이즈: 끔 · 약 · 중 · 강 (b.grain 0~3, 예전 true = 약)
export const grainLv = b => b?.grain === true ? 1 : Math.max(0, Math.min(3, b?.grain | 0));
const GRS = [0, .14, .21, .28];
export const GRAPHIC = new Set(['dot', 'pixel', 'halftone', 'duo', 'sketch']);   // 점이 굵어 글 뒤를 조금 더 받쳐 줘요

const FS = `precision highp float;
uniform sampler2D T; uniform vec2 R; uniform int M, LD; uniform float K, LO, HI, GR; varying vec2 v;
float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
float h12(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
vec3 tex(vec2 u){ return texture2D(T, clamp(u, 0., 1.)).rgb; }
vec3 sc(vec3 c, float k){ return mix(c, smoothstep(0., 1., c), k); }
vec3 sat(vec3 c, float s){ return mix(vec3(lum(c)), c, s); }
vec3 split(vec3 c, vec3 sh, vec3 hi, float k){ float l = lum(c); return c + k * (mix(sh, hi, smoothstep(.2, .8, l)) - .5) * .5; }
float lev(float l){ return clamp((l - LO) / max(HI - LO, .05), 0., 1.); }   // 사진의 밝기 범위를 0~1로 (안개 사진도 또렷하게)
vec3 curve(vec3 c, float k){ return mix(c, c * c * (3. - 2. * c), k); }
float gr2(vec2 p){ vec2 q = floor(p / 2.); return h12(q) + h12(q + 17.) - 1.; }   // 굵은 입자 (노이즈)
vec3 blur(vec2 u, float r){ vec3 a = vec3(0.); float w = 0.; for (int i = -4; i <= 4; i++) for (int j = -4; j <= 4; j++) { vec2 o = vec2(float(i), float(j)); float k = exp(-dot(o,o)/10.); a += tex(u + o * r / R) * k; w += k; } return a / w; }
void main(){
  vec2 u = v, px = u * R; vec3 c = tex(u); float l = lum(c), g = h12(px) - .5;
  if (M == 1) { c = curve(c, .55); c = sat(c, .85); c = c * vec3(1.08, 1.0, .86) + vec3(.0, .02, .0) * (1. - l); c = .10 + c * .86; vec2 q = u - .5; c *= 1. - .35 * dot(q, q) * 2.; c += gr2(px) * .05; }
  else if (M == 2) { c = sat(c, .38); c = .24 + c * .66; c *= vec3(1.06, 1.02, .92); }
  else if (M == 3) { c = curve(c, .75); c = sat(c, 1.55); c = c * 1.04 - .02; }
  else if (M == 4) { c = curve(c, .7); float t = smoothstep(.15, .85, lum(c)); c = mix(c * vec3(.62, .95, 1.05) + vec3(0., .05, .08), c * vec3(1.18, .98, .78), t); c = sat(c, 1.05); }
  else if (M == 6) { vec2 w = vec2(LD == 1 || LD == 2 ? 1. - u.x : u.x, LD >= 2 ? 1. - u.y : u.y); float d = 1. - smoothstep(0., .9, w.x * .8 + w.y * .35); vec3 lk = vec3(1., .45, .18) * d * .95 + vec3(1., .82, .6) * pow(d, 3.) * .5; c = 1. - (1. - c) * (1. - clamp(lk, 0., 1.)); c = curve(c, .3); }
  else if (M == 8) { c = curve(c, .35); c = sat(c, 1.15); c = c * vec3(1.22, .98, .72) + vec3(.06, .0, .03); }
  else if (M == 9) { c = sat(c, .7); c = c * vec3(.78, .92, 1.22) + vec3(0., .02, .06); c = .04 + c * .94; }
  else if (M == 10) { c = vec3(.04 + l * .92); }
  else if (M == 11) { c = vec3(smoothstep(.08, .92, lev(l))); c = sc(c, .45); }
  else if (M == 12) { c = vec3(sc(vec3(lev(l)), .3).r * .9 + .05 + (h12(floor(px / (1.5 * K))) - .5) * .28); }
  else if (M == 13) { float s = 7. * K; vec2 ctr = (floor(px / s) + .5) * s; vec3 k = tex(ctr / R); float d = length(px - ctr) / s; c = k * 1.15 * smoothstep(.45, .3, d); }
  else if (M == 14) { float s = 9. * K; c = tex((floor(px / s) + .5) * s / R); c = sat(c, 1.1); }
  else if (M == 15) { float s = 6. * K, a = .785; mat2 r = mat2(cos(a), sin(a), -sin(a), cos(a)), ri = mat2(cos(a), -sin(a), sin(a), cos(a)); vec2 q = r * px, ctr = (floor(q / s) + .5) * s; float k = 1. - lev(lum(tex((ri * ctr) / R))); float d = length(q - ctr) / s; c = mix(vec3(.96, .94, .88), vec3(.12, .14, .22), smoothstep(.05, -.05, d - sqrt(k) * .62)); }
  else if (M == 16) { c = mix(vec3(.1,.12,.35), vec3(1., .55, .7), smoothstep(.02, .98, lev(l))); }
  else if (M == 17) { vec2 e = 1.2 * K / R;
    float tl = lev(lum(tex(u + e * vec2(-1., -1.)))), t = lev(lum(tex(u + e * vec2(0., -1.)))), tr = lev(lum(tex(u + e * vec2(1., -1.)))), le = lev(lum(tex(u + e * vec2(-1., 0.)))), ri = lev(lum(tex(u + e * vec2(1., 0.)))), bl = lev(lum(tex(u + e * vec2(-1., 1.)))), b = lev(lum(tex(u + e * vec2(0., 1.)))), br = lev(lum(tex(u + e * vec2(1., 1.))));
    float ed = length(vec2(tr + 2. * ri + br - tl - 2. * le - bl, bl + 2. * b + br - tl - 2. * t - tr)); c = vec3(.96, .94, .9) * (1. - smoothstep(.08, .4, ed) * .85) - (1. - lev(l)) * .14; c += g * .03; }
  else if (M == 18) { vec3 a = vec3(0.); for (int i = -12; i <= 12; i++) a += tex(u + vec2(float(i) * 2.2 * K / R.x, 0.)); c = a / 25.; }
  else if (M == 19) { vec3 a = vec3(0.); vec2 q = u - .5; for (int i = 0; i < 24; i++) a += tex(.5 + q * (1. - float(i) * .009)); c = a / 24.; }
  if (GR > 0.) c += gr2(px) * GR * (1. - .4 * smoothstep(.15, .9, lum(c)));   // 노이즈 (팔레트 탭, 3단계)
  gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
}`;

let G = null;
function gl() {
  if (G !== null) return G;
  G = false;
  try {
    const cv = document.createElement('canvas'), g = cv.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
    if (!g) return G;
    const sh = (t, s) => { const o = g.createShader(t); g.shaderSource(o, s); g.compileShader(o); if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 a; varying vec2 v; void main(){ v = vec2(a.x * .5 + .5, .5 - a.y * .5); gl_Position = vec4(a, 0., 1.); }'));
    g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr); g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const a = g.getAttribLocation(pr, 'a'); g.enableVertexAttribArray(a); g.vertexAttribPointer(a, 2, g.FLOAT, false, 0, 0);
    const u = {}; ['T', 'R', 'M', 'LD', 'K', 'LO', 'HI', 'GR'].forEach(k => { u[k] = g.getUniformLocation(pr, k); });
    const tx = g.createTexture(); g.bindTexture(g.TEXTURE_2D, tx);
    [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach(k => g.texParameteri(g.TEXTURE_2D, k, g.CLAMP_TO_EDGE));
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    G = { cv, g, u };
  } catch (e) { console.warn('filters gl', e); G = false; }
  return G;
}

// 사진 읽기 + 밝기 범위(어두운 쪽 2% · 밝은 쪽 98%)
const imgs = new Map();
function image(src) {
  if (!imgs.has(src)) imgs.set(src, new Promise((ok, no) => {
    const i = new Image(); i.onload = () => {
      const s = document.createElement('canvas'); s.width = s.height = 48; const c = s.getContext('2d'); c.drawImage(i, 0, 0, 48, 48);
      const d = c.getImageData(0, 0, 48, 48).data, L = [];
      for (let k = 0; k < d.length; k += 4) L.push((d[k] * .299 + d[k + 1] * .587 + d[k + 2] * .114) / 255);
      L.sort((a, b) => a - b);
      ok({ i, lo: L[Math.floor(L.length * .02)], hi: L[Math.floor(L.length * .98)] });
    }; i.onerror = no; i.src = src;
  }));
  return imgs.get(src);
}

// 사진 하나(src)를 w×h로(넘치는 쪽은 가운데 잘라) 필터를 걸어 그 캔버스를 돌려줘요. GL이 없으면 원본 그대로
function run(im, f, w, h, grain, crop) {
  const R = gl(), out = document.createElement('canvas'); out.width = w; out.height = h;
  const src = document.createElement('canvas'); src.width = w; src.height = h; const sc = src.getContext('2d');
  const { i } = im, s = crop ? Math.max(w / i.naturalWidth, h / i.naturalHeight) : w / i.naturalWidth;
  sc.drawImage(i, (w - i.naturalWidth * s) / 2, (h - i.naturalHeight * s) / 2, i.naturalWidth * s, i.naturalHeight * s);
  if (!R || (f.m === 0 && !grain)) { out.getContext('2d').drawImage(src, 0, 0); return out; }
  out.getContext('2d').drawImage(apply(src, f, grain, im.lo, im.hi), 0, 0); return out;
}
// 그려 둔 캔버스(src)에 필터를 걸어 그래픽 칩 캔버스를 돌려줘요 (영상은 장면마다 이걸 불러요). GL이 없으면 null
export function apply(src, f, grain, lo = 0, hi = 1) {
  const R = gl(); if (!R) return null;
  const { cv, g, u } = R, w = src.width, h = src.height;
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  g.viewport(0, 0, w, h);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
  g.uniform1i(u.T, 0); g.uniform2f(u.R, w, h); g.uniform1i(u.M, f.m); g.uniform1i(u.LD, f.d | 0); g.uniform1f(u.K, Math.max(1, Math.min(w, h) / 400)); g.uniform1f(u.LO, lo); g.uniform1f(u.HI, hi); g.uniform1f(u.GR, GRS[grain === true ? 1 : grain | 0] || 0);
  g.drawArrays(g.TRIANGLES, 0, 3);
  return cv;
}
// 사진(영상은 커버)의 밝기 범위
export const levels = async b => { try { const im = await image(srcOf(b)); return { lo: im.lo, hi: im.hi }; } catch { return { lo: 0, hi: 1 }; } };

// 배경에 쓸 주소. 아직 없으면 원본 주소를 주고 뒤에서 만들어, 다 되면 그 사진을 쓰는 칸을 모두 바꿔요
const done = new Map(), work = new Map();
export const srcOf = b => b?.ph ? photoUrl(b.ph) : b?.src || '';
export const keyOf = (b, fid) => `${b?.ph || b?.src}|${fid || 'none'}|${grainLv(b)}`;
export function bgUrl(b, fid) {
  const src = srcOf(b); if (!src) return '';
  if ((!fid || fid === 'none') && !grainLv(b)) return src;
  const k = keyOf(b, fid);
  if (done.has(k)) return done.get(k);
  make(b, fid);
  return src;
}
function make(b, fid) {
  const k = keyOf(b, fid);
  if (!work.has(k)) work.set(k, (async () => {
    const im = await image(srcOf(b)), w = im.i.naturalWidth, h = im.i.naturalHeight;
    const cv = run(im, filterOf(fid), w, h, grainLv(b), false);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .9)), url = URL.createObjectURL(blob);
    done.set(k, url);
    document.querySelectorAll('.bgi.ph').forEach(e => { if (e.dataset.fk === k) e.style.backgroundImage = `url(${url})`; });
    return url;
  })().catch(e => { console.warn('filter', e); work.delete(k); }));
  return work.get(k);
}
// 저장 전에: 카드가 쓰는 필터 사진을 모두 만들어 둬요
export async function prep(c) {
  if (c.fmt === 'rebus') return;
  const bs = [c.bg, ...(c.pst || []).map(p => p.bg)].filter(b => b && srcOf(b) && ((c.filter && c.filter !== 'none') || grainLv(b)));
  await Promise.all(bs.map(b => make(b, fidOf(c))));
}
// 필터 줄 미리보기 (작은 정사각형)
const th = new Map();
export async function thumb(b, fid) {
  const src = srcOf(b); if (!src) return '';
  const k = src + '|' + fid; if (th.has(k)) return th.get(k);
  const u = run(await image(src), filterOf(fid), 120, 120, false, true).toDataURL('image/jpeg', .8);
  th.set(k, u); return u;
}
