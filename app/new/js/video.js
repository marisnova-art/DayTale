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
// 아이폰(WebKit)은 안 보이는(opacity 0 · 0px) 영상은 읽지도 재생하지도 않아요. 그래서 1px 크기로 화면 안에 두고, 재생할 땐 카드 안(캔버스 밑)으로 옮겨요
const shelfEl = () => { if (!shelf) { shelf = document.createElement('div'); shelf.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:.01;pointer-events:none;overflow:hidden;z-index:-1;'; document.body.appendChild(shelf); } return shelf; };
const mk = src => {
  const v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto';
  v.style.cssText = 'width:1px;height:1px;'; v.src = src; shelfEl().appendChild(v); v.load();   // 아이폰은 load()를 불러야 읽기 시작해요
  return v;
};
// 처음 장면이 나올 때까지: 아이폰은 한 번 재생해야 장면을 줘요 (소리 없는 재생은 허용). 장면이 오면 바로 멈춰요
async function prime(v) {
  if (v.readyState >= 2) return;
  const was = v.paused; v.play().catch(() => {});
  await ready(v, 8000);
  if (was) v.pause();
}
function videoOf(vd) {
  if (els.has(vd)) return els.get(vd);
  const v = mk(P.url(vd)); els.set(vd, v);
  return v;
}
const ready = (v, ms = 4000) => v.readyState >= 2 ? Promise.resolve() : new Promise(ok => { const ev = ['loadeddata', 'canplay', 'seeked', 'playing'], f = () => { ev.forEach(k => v.removeEventListener(k, f)); ok(); }; ev.forEach(k => v.addEventListener(k, f)); setTimeout(f, ms); });   // 옮기는 중(seeking)에도 장면이 오면 바로
const seekTo = (v, t) => new Promise(ok => {
  if (Math.abs(v.currentTime - t) < .02 && v.readyState >= 2) return ok();
  const f = () => { v.removeEventListener('seeked', f); ok(); }; v.addEventListener('seeked', f); v.currentTime = t; setTimeout(ok, 1500);
});

// 영상 파일 → 카드 배경 값. 앞 10초 · 커버는 첫 장면 (아무것도 안 만져도 끝)
export async function add(file) {
  const vd = await P.addFile(file), v = videoOf(vd);
  await new Promise((ok, no) => {
    if (v.readyState >= 1) return ok();
    v.addEventListener('loadedmetadata', ok, { once: true }); v.addEventListener('error', () => no(new Error('video ' + (v.error?.code || ''))), { once: true });
    v.play().catch(() => {});   // 아이폰: 읽기를 깨워요
    setTimeout(() => no(new Error('video timeout ' + v.readyState + '/' + v.networkState)), 12000);
  });
  await prime(v);
  if (!v.videoWidth) throw new Error('video size');
  const dur = isFinite(v.duration) ? v.duration : MAX;
  v.pause(); await seekTo(v, 0);
  const cover = await P.addCanvas(v, v.videoWidth, v.videoHeight);
  return { ...cover, w: v.videoWidth, h: v.videoHeight, vd, dur, t0: 0 };
}
// 지금 장면(또는 t초 장면)을 커버 사진으로
export async function capture(b, t) {
  const v = videoOf(b.vd); await prime(v);
  if (t != null) await seekTo(v, t);
  return { ...(await P.addCanvas(v, v.videoWidth, v.videoHeight)), w: v.videoWidth, h: v.videoHeight };
}

// 타임라인 띠: 영상 전체를 작은 장면 n개로 (한 번 만들면 기억해요). 따로 된 영상 요소로 만들어 재생을 방해하지 않아요
const strips = new Map();
export function strip(b, n, fw, fh) {
  const k = `${b.vd}|${n}|${fw}|${fh}`;
  if (!strips.has(k)) strips.set(k, (async () => {
    const v = mk(P.url(b.vd)); await prime(v); v.pause();
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
  cancelAnimationFrame(cur.raf); cur.v.pause(); cur.v.style.cssText = 'width:1px;height:1px;'; shelfEl().appendChild(cur.v);
  const c = cur.cv.getContext('2d'); c.clearRect(0, 0, cur.cv.width, cur.cv.height); cur.cv.style.visibility = ''; cur.cv.style.opacity = '';   // 멈춘 카드는 커버 사진이 보여요
  cur = null;
}
// cv = 카드 안 영상 캔버스, b = 그 장 배경 값, fid = 카드 필터
export function start(cv, b, fid, { paused = false, onTick } = {}) {
  if (cur && cur.cv === cv && cur.b === b && cur.fid === fid) { cur.onTick = onTick; setPaused(paused); return cur; }
  const keep = cur && cur.b.vd === b.vd ? cur.v.currentTime : null;
  stop();
  const v = videoOf(b.vd), me = { cv, v, b, fid, paused, lv: { lo: 0, hi: 1 }, raf: 0, onTick, key: '', fr: 0, live: false, ar: +(cv.closest('[data-ar]')?.dataset.ar) || 1.25 };
  cur = me;
  // 새 장면이 올 때만 그려요 (화면은 초당 120번이어도 영상은 30장 정도라 필터 일이 크게 줄어요)
  if (v.requestVideoFrameCallback) { const nf = () => { if (cur !== me) return; me.fr++; v.requestVideoFrameCallback(nf); }; v.requestVideoFrameCallback(nf); }
  // 화면에 보이는 자리에 있어야 아이폰이 계속 재생해요 (위 캔버스가 덮어요).
  // 처음엔 거의 투명하게: 맞는 장면이 올 때까지 커버 사진이 보이고, 장면이 오면 0.25초에 걸쳐 나타나요 (검은 화면 · 앞 영상 장면 · 깜빡임 없이)
  v.style.cssText = `position:absolute;left:0;top:0;width:100%;height:${Math.round((cv.clientWidth || cv.parentNode.clientWidth) * me.ar)}px;object-fit:cover;background:transparent;object-position:${b.x ?? 50}% ${b.y ?? 50}%;pointer-events:none;opacity:.01;transition:opacity .25s ease;`; cv.before(v);
  cv.style.transition = 'opacity .25s ease'; cv.style.opacity = '0';
  levels(b).then(l => { me.lv = l; me.key = ''; });
  const t0 = b.t0 || 0, len = lenOf(b);
  (async () => {
    if (keep == null || keep < t0 - .05 || keep > t0 + len) await seekTo(v, t0);
    if (cur !== me) return;
    if (!me.paused) v.play().catch(() => {});
    await frame(v, me.paused);
    if (cur !== me) return;
    me.live = true; me.key = ''; paint(me); show(me);
  })();
  const loop = () => {
    if (cur !== me) return;
    me.raf = requestAnimationFrame(loop);
    if (!cv.isConnected) return stop();
    if (document.hidden) { if (!v.paused) v.pause(); return; }   // 앱이 뒤로 가거나 화면이 꺼지면 멈춰요 (돌아오면 아래에서 다시 재생)
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

// 옮긴 뒤 새 장면 하나가 올 때까지
const frame = (v, paused) => new Promise(ok => {
  setTimeout(ok, 1500);
  if (paused || !v.requestVideoFrameCallback) return ready(v).then(() => paused ? ok() : v.addEventListener('timeupdate', ok, { once: true }));
  v.requestVideoFrameCallback(() => ok());
});
// 늘 캔버스로 보여 줘요. 영상은 안 보이게(.01) 두고 장면만 그려요: 되감기 · 버퍼링 동안 아이폰이 영상을 검게 칠해도 캔버스엔 마지막 장면이 남아요
const show = me => { me.v.style.opacity = '.01'; me.cv.style.opacity = '1'; };
// 장면 하나 그리기: 카드 칸을 고른 위치(x · y)로 꽉 채워 자르고, 필터 · 노이즈를 걸어요
function paint(me) {
  const { cv, v, b } = me; if (!me.live || v.seeking || v.readyState < 2 || !v.videoWidth) return;   // 되감는 중엔 마지막 장면을 그대로
  const f = filterOf(me.fid);
  // 카드 크기에 맞춘 해상도 (가로 최대 720): 필요 이상으로 크게 그리지 않아요
  const W = Math.min(720, Math.round(cv.clientWidth * Math.min(2, devicePixelRatio || 1))); if (!W) return;
  const H = Math.round(W * me.ar);
  const key = [v.requestVideoFrameCallback ? me.fr : Math.round(v.currentTime * 30), v.paused ? v.currentTime : '', W, b.x, b.y, me.fid, b.grain, me.lv.lo].join();
  if (key === me.key) return;   // 새 장면도 바뀐 것도 없으면 다시 안 그려요
  me.key = key;
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  if (work.width !== W || work.height !== H) { work.width = W; work.height = H; }
  const s = Math.max(W / v.videoWidth, H / v.videoHeight), dw = v.videoWidth * s, dh = v.videoHeight * s;
  wc.drawImage(v, (W - dw) * (b.x ?? 50) / 100, (H - dh) * (b.y ?? 50) / 100, dw, dh);
  const out = apply(work, f, !!b.grain, me.lv.lo, me.lv.hi);
  cv.getContext('2d').drawImage(out || work, 0, 0);
}
