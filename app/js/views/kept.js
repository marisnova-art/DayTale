/* 간직한 문장: 홈의 한 마디·문학 구절에서 '간직하기'한 문장들. 최근에 간직한 것부터, 누르면 같은 시트 */
import { fmtDate, fmtNum, t } from '../core/i18n.js';
import { esc, icon } from '../core/utils.js';
import { kept, wordSheet } from '../features/words-ui.js';
import * as Editor from './editor.js';

function render(view) {
  Editor.leave();
  const paint = () => {
    const list = kept();
    view.innerHTML = `<section class="lst kept"><div class="lst-head"><h1>${esc(t('nav.kept'))}</h1><span class="c">${list.length ? fmtNum(list.length) : ''}</span></div>
      <div class="body">${list.length ? `<div class="card">${list.map((w, i) => `<button class="kw" data-i="${i}"><span class="kq">${esc(w.q)}</span><span class="kb">${esc(w.by)}${w.src ? ` · ${esc(w.src)}` : ''}<i>${esc(fmtDate(w.day + 'T12:00:00', { month: 'short', day: 'numeric' }))}</i></span></button>`).join('')}</div>`
        : `<div class="empty">${icon('bookmark', 28)}<b>${esc(t('empty.kept'))}</b><p>${esc(t('empty.kept.s'))}</p></div>`}</div><div style="height:120px"></div></section>`;
    view.querySelectorAll('.kw').forEach(b => b.onclick = () => { const w = kept()[+b.dataset.i]; if (w) wordSheet(w, { onChange: paint }); });
  };
  paint();
}

export { render };
