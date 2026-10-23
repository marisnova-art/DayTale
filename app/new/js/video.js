// 포토 포맷 영상: 소리 없이 고른 10초가 계속 돌아요. 카드에는 영상 번호(vd)와 커버 사진(ph)을 적어요.
// 커버는 보통 사진과 똑같이 그려져서(필터 · 위치 · 저장 이미지), 영상은 그 위 캔버스(.bgv)에 장면마다 필터를 걸어 그려요.
// 한 번에 하나만 재생해요: 쓰기 화면은 보고 있는 장, 피드는 가운데 카드
import * as P from './photos.js';
import { apply, filterOf, levels } from './filters.js';

export const MAX = 10;   // 한 영상에서 쓰는 길이(초)
export const lenOf = b => Math.min(MAX, b.dur || MAX);

// 영상 요소는 영상마다 하나만 만들어 두고 다시 써요 (다시 그려도 재생 위치가 그대로). 화면 밖 숨은 칸에 붙여 둬야 아이폰이 장면을 줘요
const els = new Map();
let shelf = null;
const shelfEl = () => { if (!shelf) { shelf = document.createElement('div'); shelf.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;overflow:hidden;'; document.body.appendChild(shelf); } return shelf; };
function videoOf(vd) {
  if (els.has(vd)) return els.get(vd);
  const v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto';
  v.src = P.url(vd); shelfEl().appendChild(v); els.set(vd, v);
  return v;
}
const ready = v => v.readyState >= 2 ? Promise.resolve() : new Promise(ok => { const ev = ['loadeddata', 'canplay', 'seeked'], f = () => { ev.forEach(k => v.removeEventListener(k, f)); ok(); }; ev.forEach(k => v.addEventListener(k, f)); setTimeout(f, 4000); });   // 옮기는 중(seeking)에도 장면이 오면 바로
const seekTo = (v, t) => new Promise(ok => {
  if (Math.abs(v.currentTime - t) < .02 && v.readyState >= 2) return ok();
  const f = () => { v.removeEventListener('seeked', f); ok(); }; v.addEventListener('seeked', f); v.currentTime = t; setTimeout(ok, 1500);
});

// 영상 파일 → 카드 배경 값. 앞 10초 · 커버는 첫 장면 (아무것도 안 만져도 끝)
export async function add(file) {
  const vd = await P.addFile(file), v = videoOf(vd);
  await new Promise((ok, no) => { if (v.readyState >= 1) return ok(); v.addEventListener('loadedmetadata', ok, { once: true }); v.addEventListener('error', () => no(new Error('video')), { once: true }); });
  if (!v.videoWidth) throw new Error('video size');
  const dur = isFinite(v.duration) ? v.duration : MAX;
  await ready(v); await seekTo(v, 0);
  const cover = await P.addCanvas(v, v.videoWidth, v.videoHeight);
  return { ...cover, w: v.videoWidth, h: v.videoHeight, vd, dur, t0: 0 };
}
// 지금 장면(또는 t초 장면)을 커버 사진으로
export async function capture(b, t) {
  const v = videoOf(b.vd); await ready(v);
  if (t != null) await seekTo(v, t);
  return { ...(await P.addCanvas(v, v.videoWidth, v.videoHeight)), w: v.videoWidth, h: v.videoHeight };
}

// 타임라인 띠: 영상 전체를 작은 장면 n개로 (한 번 만들면 기억해요). 따로 된 영상 요소로 만들어 재생을 방해하지 않아요
const strips = new Map();
export function strip(b, n, fw, fh) {
  const k = `${b.vd}|${n}|${fw}|${fh}`;
  if (!strips.has(k)) strips.set(k, (async () => {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.src = P.url(b.vd);
    shelfEl().appendChild(v); await ready(v);
    const cv = document.createElement('canvas'); cv.width = n * fw; cv.height = fh; const c = cv.getContext('2d');
    for (let i = 0; i < n; i++) {
      await seekTo(v, Math.min(b.dur - .05, (i + .5) * b.dur / n));
      const s = Math.max(fw / v.videoWidth, fh / v.videoHeight);
      c.drawImage(v, i * fw + (fw - v.videoWidth * s) / 2, (fh - v.videoHeight * s) / 2, v.videoWidth * s, v.videoHeight * s);
    }
    v.remove();
    return cv.toDataURL('image/jpeg', .7);
  })().catch(() => ''));
  return strips.get(k);
}

// ── 재생 (하나만) ─────────────────────────────────────
// cur = { cv, v, b, fid, paused, lv, raf, onTick }
let cur = null;
const work = document.createElement('canvas'), wc = work.getContext('2d');
export const playing = () => cur;
export function stop() {
  if (!cur) return;
  cancelAnimationFrame(cur.raf); cur.v.pause();
  const c = cur.cv.getContext('2d'); c.clearRect(0, 0, cur.cv.width, cur.cv.height);   // 멈춘 카드는 커버 사진이 보여요
  cur = null;
}
// cv = 카드 안 영상 캔버스, b = 그 장 배경 값, fid = 카드 필터
export function start(cv, b, fid, { paused = false, onTick } = {}) {
  if (cur && cur.cv === cv && cur.b === b && cur.fid === fid) { cur.onTick = onTick; setPaused(paused); return cur; }
  const keep = cur && cur.b.vd === b.vd ? cur.v.currentTime : null;
  stop();
  const v = videoOf(b.vd), me = { cv, v, b, fid, paused, lv: { lo: 0, hi: 1 }, raf: 0, onTick, key: '' };
  cur = me;
  levels(b).then(l => { me.lv = l; me.key = ''; });
  const t0 = b.t0 || 0, len = lenOf(b);
  if (keep == null || keep < t0 - .05 || keep > t0 + len) v.currentTime = t0;
  if (!paused) v.play().catch(() => {});
  const loop = () => {
    if (cur !== me) return;
    me.raf = requestAnimationFrame(loop);
    if (!cv.isConnected) return stop();
    const s = me.b.t0 || 0, l = lenOf(me.b);
    if (!me.paused && !me.scrub && (v.currentTime >= s + l - .04 || v.currentTime < s - .3)) { v.currentTime = s; v.play().catch(() => {}); }
    if (!me.paused && !me.scrub && v.paused && v.readyState >= 2) v.play().catch(() => {});
    paint(me);
    me.onTick?.(Math.max(0, Math.min(l, v.currentTime - s)), l);
  };
  loop();
  return me;
}
export function setPaused(p) {
  if (!cur) return; cur.paused = p;
  if (p) cur.v.pause(); else { const s = cur.b.t0 || 0; if (cur.v.currentTime >= s + lenOf(cur.b) - .05) cur.v.currentTime = s; cur.v.play().catch(() => {}); }
}
// 타임라인을 미는 동안: 멈추고 그 장면만 보여 줘요. 손을 떼면 end()가 그 구간 처음부터 재생
let seekBusy = false, seekWant = null;
export function scrub(t) {
  if (!cur) return; cur.scrub = true; cur.v.pause();
  seekWant = t; if (seekBusy) return;
  const go = () => { const x = seekWant; seekWant = null; seekBusy = true; seekTo(cur?.v || { currentTime: 0 }, x).then(() => { seekBusy = false; if (seekWant != null && cur) go(); }); };
  go();
}
export function scrubEnd(play = true) {
  if (!cur) return; cur.scrub = false; cur.v.currentTime = cur.b.t0 || 0;
  if (play) { cur.paused = false; cur.v.play().catch(() => {}); }
}

// 장면 하나 그리기: 카드 4:5 칸을 고른 위치(x · y)로 꽉 채워 자르고, 필터 · 노이즈를 걸어요
function paint(me) {
  const { cv, v, b } = me; if (v.readyState < 2 || !v.videoWidth) return;
  const W = Math.round(cv.clientWidth * Math.min(2, devicePixelRatio || 1)); if (!W) return;
  const H = Math.round(W * 1.25);
  const key = [v.currentTime, W, b.x, b.y, me.fid, b.grain, me.lv.lo].join();
  if (me.paused && key === me.key) return;   // 멈춰 있고 바뀐 게 없으면 다시 안 그려요
  me.key = key;
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  if (work.width !== W || work.height !== H) { work.width = W; work.height = H; }
  const s = Math.max(W / v.videoWidth, H / v.videoHeight), dw = v.videoWidth * s, dh = v.videoHeight * s;
  wc.drawImage(v, (W - dw) * (b.x ?? 50) / 100, (H - dh) * (b.y ?? 50) / 100, dw, dh);
  const f = filterOf(me.fid), out = (f.m || b.grain) ? apply(work, f, !!b.grain, me.lv.lo, me.lv.hi) : null;
  cv.getContext('2d').drawImage(out || work, 0, 0);
}
