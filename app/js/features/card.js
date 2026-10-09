/* 기록을 이미지 카드로: 위에 제목·내용, 아래 왼쪽 날짜 · 오른쪽 브랜드 마크.
   사진은 폰 안에서만 써요(서버에 올리지 않음). 모바일 전용, 저장·공유는 폰의 공유 창으로 */
import { CFG, brand } from '../core/config.js';
import { fmtDate, getLang, t } from '../core/i18n.js';
import { htmlToText } from '../core/sanitize.js';
import { esc, icon } from '../core/utils.js';
import { fontOf } from '../core/fonts.js';
import { displayTitle } from '../data/store.js';
import { stops } from '../ui/backdrop.js';
import { toast } from '../ui/feedback.js';

const SIZES = { '4:5': [1080, 1350], '9:16': [1080, 1920], '1:1': [1080, 1080] };
const FAMILY = { base: "'Pretendard Variable', Pretendard, sans-serif", serif: "'DT Gowun Batang', 'DT Noto Serif JP', serif", hand: "'DT Caveat', 'DT Nanum Pen Script', 'DT Klee One', cursive" };

/* 낱말 단위로 줄 바꿈 (너무 긴 낱말만 글자 단위로) */
function wrap(x, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const tok of para.match(/\S+\s*|\s+/g) || ['']) {
      if (x.measureText(line + tok).width <= maxW) { line += tok; continue; }
      if (line.trim()) out.push(line.trimEnd());
      line = '';
      if (x.measureText(tok).width > maxW) { for (const ch of tok) { if (x.measureText(line + ch).width > maxW && line) { out.push(line); line = ''; } line += ch; } }
      else line = tok.trimStart();
    }
    out.push(line.trimEnd());
  }
  return out;
}
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

function draw(cv, o) {
  const [W, H] = SIZES[o.ratio]; cv.width = W; cv.height = H; const x = cv.getContext('2d');
  if (o.photo) { const p = o.photo, s = Math.max(W / p.width, H / p.height); x.drawImage(p, (W - p.width * s) / 2, (H - p.height * s) / 2, p.width * s, p.height * s); }
  else { const g = x.createLinearGradient(0, 0, W * .45, H); o.grad.forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  // 글이 잘 읽히게: 전체를 어둡게 + 위아래 가장자리를 조금 더
  x.fillStyle = `rgba(10,9,14,${o.dim})`; x.fillRect(0, 0, W, H);
  const edge = x.createLinearGradient(0, 0, 0, H); edge.addColorStop(0, `rgba(10,9,14,${o.dim * .5})`); edge.addColorStop(.3, 'rgba(10,9,14,0)'); edge.addColorStop(.75, 'rgba(10,9,14,0)'); edge.addColorStop(1, `rgba(10,9,14,${o.dim * .7})`);
  x.fillStyle = edge; x.fillRect(0, 0, W, H);
  const pad = 96, maxW = W - pad * 2, fam = FAMILY[o.font], hand = o.font === 'hand' ? 1.25 : 1;
  x.textBaseline = 'top'; x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 12;
  let y = pad + (o.ratio === '9:16' ? 120 : 20);
  if (o.title) {
    const ts = (o.ratio === '1:1' ? 64 : 72) * hand; x.font = `${o.font === 'hand' ? 400 : 700} ${ts}px ${fam}`; x.fillStyle = '#fff';
    wrap(x, o.title, maxW).slice(0, 3).forEach(l => { x.fillText(l, pad, y); y += ts * 1.28; });
    y += 34;
  }
  const fs = (o.ratio === '1:1' ? 40 : 44) * hand, lh = fs * 1.62, bottom = H - pad - 100;
  x.font = `${o.font === 'hand' ? 400 : 500} ${fs}px ${fam}`; x.fillStyle = 'rgba(255,255,255,.9)';
  let lines = wrap(x, o.body, maxW); const room = Math.max(1, Math.floor((bottom - y) / lh));
  if (lines.length > room) { lines = lines.slice(0, room); lines[room - 1] = lines[room - 1].replace(/\s*\S{0,2}$/, '') + '…'; }
  lines.forEach(l => { x.fillText(l, pad, y); y += lh; });
  // 아래: 왼쪽 날짜 · 오른쪽 브랜드 마크
  x.shadowBlur = 0; const by = H - pad - 48;
  x.font = "600 32px 'Pretendard Variable', Pretendard, sans-serif"; x.fillStyle = 'rgba(255,255,255,.72)'; x.fillText(o.date, pad, by + 8);
  x.font = "700 34px 'Pretendard Variable', Pretendard, sans-serif"; const bw = x.measureText(o.brand).width;
  x.fillStyle = '#fff'; x.fillText(o.brand, W - pad - bw, by + 6);
  if (o.logo) { x.save(); x.beginPath(); x.roundRect(W - pad - bw - 64, by, 48, 48, 13); x.clip(); x.drawImage(o.logo, W - pad - bw - 64, by, 48, 48); x.restore(); }
}

async function openCard(e) {
  const text = htmlToText(e.content || '') || e.text || '';
  const title = displayTitle(e, '') || '';
  if (!text.trim() && !title.trim()) { toast(t('card.empty')); return; }
  const o = { ratio: '4:5', dim: .45, photo: null, grad: stops(), font: fontOf(e), title, body: title && text.startsWith(title) ? text.slice(title.length).trim() : text,
    date: fmtDate(e.created_at, { year: 'numeric', month: 'long', day: 'numeric' }), brand: brand(getLang()), logo: null };
  try { o.logo = await loadImg('./icons/icon-192.png'); } catch {}
  const fam = FAMILY[o.font]; try { await Promise.all([document.fonts.load(`700 72px ${fam}`, title + o.body.slice(0, 200)), document.fonts.load("700 34px 'Pretendard Variable'")]); } catch {}
  const d = document.createElement('div'); d.className = 'card-maker'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', t('card.title'));
  d.innerHTML = `<div class="cm-top"><b>${esc(t('card.title'))}</b><button class="icon-btn" data-c="close" aria-label="${esc(t('common.close'))}">${icon('x', 22)}</button></div>
    <div class="cm-pv"><canvas></canvas></div>
    <div class="cm-ctl">
      <div><div class="lab">${esc(t('card.bg'))}</div><div class="segs"><button data-bg="photo">${icon('image', 17)}${esc(t('card.myPhoto'))}</button><button data-bg="grad" class="on">${esc(t('card.gradient'))}</button></div></div>
      <div><div class="lab">${esc(t('card.dim'))}</div><label class="cm-dim"><input type="range" min="0" max="80" value="45" aria-label="${esc(t('card.dim'))}"><span>45%</span></label></div>
      <div><div class="lab">${esc(t('card.ratio'))}</div><div class="segs" data-g="ratio"><button data-r="4:5" class="on">4:5</button><button data-r="9:16">9:16</button><button data-r="1:1">1:1</button></div></div>
    </div>
    <div class="cm-btns"><button data-c="share">${icon('share', 18)}${esc(t('card.share'))}</button><button data-c="save" class="main">${icon('download', 18)}${esc(t('card.save'))}</button></div>
    <input type="file" accept="image/*" hidden>`;
  document.body.append(d); document.documentElement.classList.add('card-open');
  const cv = d.querySelector('canvas'), file = d.querySelector('input[type=file]'), range = d.querySelector('input[type=range]');
  const paint = () => { draw(cv, o); cv.style.aspectRatio = o.ratio.replace(':', ' / '); };
  paint();
  const close = () => { d.remove(); document.documentElement.classList.remove('card-open'); if (o.url) URL.revokeObjectURL(o.url); };
  const blob = () => new Promise(r => cv.toBlob(r, 'image/png'));
  const name = () => `${(CFG.BRAND.name || 'card').replace(/[^\w-]/g, '')}-${(e.created_at || '').slice(0, 10)}.png`;
  const share = async () => {
    const f = new File([await blob()], name(), { type: 'image/png' });
    if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f] }); return true; } catch (err) { return err?.name === 'AbortError'; } }
    return false;
  };
  const download = async () => { const u = URL.createObjectURL(await blob()); const a = document.createElement('a'); a.href = u; a.download = name(); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); toast(t('card.saved')); };
  range.addEventListener('input', () => { o.dim = range.value / 100; range.nextElementSibling.textContent = range.value + '%'; paint(); });
  file.addEventListener('change', async () => {
    const f = file.files[0]; file.value = ''; if (!f) return;
    try { if (o.url) URL.revokeObjectURL(o.url); o.url = URL.createObjectURL(f); o.photo = await loadImg(o.url); d.querySelectorAll('[data-bg]').forEach(b => b.classList.toggle('on', b.dataset.bg === 'photo')); paint(); }
    catch { toast(t('card.photoFail')); }
  });
  d.addEventListener('click', async ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.bg === 'photo') file.click();
    else if (b.dataset.bg === 'grad') { o.photo = null; d.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('on', x === b)); paint(); }
    else if (b.dataset.r) { o.ratio = b.dataset.r; d.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x === b)); paint(); }
    else if (b.dataset.c === 'close') close();
    else if (b.dataset.c === 'share') { if (!(await share())) await download(); }
    else if (b.dataset.c === 'save') {
      // 아이폰은 공유 창의 "이미지 저장"이 사진첩으로 가는 길이에요. 안드로이드·그 밖에는 바로 내려받기
      if (/iPhone|iPad|iPod/.test(navigator.userAgent) && await share()) return;
      await download();
    }
  });
}

export { draw, openCard };
