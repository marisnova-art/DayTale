// 사진 저장: 카드에 정해 둔 그대로(비율 · 날짜 줄 · 서명) 모든 장을 바로 저장해요. 저장 창은 없어요.
// 위 가운데 알림에 '만드는 중 2/3' → 공유 창(사진 저장 · 인스타 · X …) → '저장했어요'. 쓰기 · 피드 같은 움직임.
// 아이폰은 만드는 사이 누른 효과가 끝나면 공유 창이 안 열려서, 그땐 '준비됐어요 · 눌러서 저장'을 한 번 더 눌러요
import { ic } from './icons.js';
import { cardImages, saveImages } from './export.js';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 위 가운데 알림 (1.2초). keep = 닫힐 때까지, tap = 누르면 할 일
let pillT = 0;
export function pill(text, icon, o = {}) {
  $$('.pill').forEach(p => p.remove()); clearTimeout(pillT);
  const p = document.createElement('div'); p.className = 'pill' + (o.tap ? ' tap' : ''); p.innerHTML = (icon ? ic(icon) : '') + esc(text);
  if (o.tap) p.onclick = () => { p.remove(); o.tap(); };
  document.body.appendChild(p);
  if (!o.keep) pillT = setTimeout(() => p.remove(), o.tap ? 6000 : 1200);
  return p;
}
export const pillOff = () => { $$('.pill').forEach(p => p.remove()); clearTimeout(pillT); };

let last = { key: '', files: null }, busy = false;   // 마지막으로 만든 그림 (같은 카드를 다시 누르면 바로 공유)

async function send(files, total, failed, c) {
  const r = await saveImages(files);
  if (r === 'again') return pill('준비됐어요 · 눌러서 저장', 'save', { tap: () => send(files, total, failed, c) });
  if (r === 'cancel') return pillOff();
  if (failed.length) return pill(`${total}장 중 ${failed.length}장 저장 못 했어요 · 다시`, '', { tap: () => make(c, failed) });
  pill('저장했어요', 'check');
}

async function make(c, pages) {
  if (busy) return; busy = true;
  try {
    const key = JSON.stringify(c);
    if (!pages && last.key === key && last.files) return await send(last.files, last.files.length, [], c);
    pill('만드는 중', '', { keep: true });
    const { files, failed } = await cardImages(c, { pages, onStep: (k, n) => pill(n > 1 ? `만드는 중 ${k}/${n}` : '만드는 중', '', { keep: true }) });
    const total = files.length + failed.length;
    if (!files.length) return pill('저장 못 했어요 · 다시', '', { tap: () => make(c, pages) });
    if (!pages && !failed.length) last = { key, files };
    await send(files, total, failed, c);
  } catch (e) {
    console.error(e); pill('저장 못 했어요 · 다시', '', { tap: () => make(c, pages) });
  } finally { busy = false; }
}

export const saveCard = c => make(c);
