/* 시트에서 고르기: 종류, 폴더 */
import { S, TYPES, addFolder, folderList } from '../data/store.js';
import { TYPE_ICON } from '../ui/shell.js';
import { t } from '../core/i18n.js';
import { esc, h, icon } from '../core/utils.js';
import { openSheet, promptDlg } from '../ui/feedback.js';

const TYPE_STICKER = { note: 'note', todo: 'todo', event: 'event', idea: 'idea', item: 'item', personal: 'personal', scrap: 'scrap' };
const typeLabel = ty => t('type.' + ty);
/* 종류 이름은 단수형이 자연스러워요 (메뉴는 묶음 이름) */
const KIND_ONE = { ko: { todo: '할 일', event: '일정', item: '물건 둔 곳' }, en: { note: 'Note', todo: 'To-do', event: 'Event', idea: 'Idea', item: 'Where it is', personal: 'Personal', scrap: 'Clipping' } };

function pickType(current) {
  return new Promise(res => {
    const el = h(`<div><h2>${esc(t('ed.kind'))}</h2><div class="pick">${TYPES.map(ty => `<button data-v="${ty}" class="${ty === current ? 'on' : ''}">${icon(TYPE_ICON[ty], 22)}${esc(typeLabel(ty))}</button>`).join('')}</div></div>`);
    let done = false;
    const sh = openSheet(el, { label: t('ed.kind'), onClose: () => { if (!done) res(null); } });
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; done = true; res(b.dataset.v); sh.close(); });
  });
}
/* 결과: 폴더 id, '' (폴더 없음), null (취소) */
function pickFolder(current) {
  return new Promise(res => {
    const el = h(`<div><h2>${esc(t('ed.folder'))}</h2><div class="pick">
      <button data-v="" class="${!current ? 'on' : ''}">${icon('folder-x', 22)}${esc(t('folder.none'))}</button>
      ${folderList().map(f => `<button data-v="${f.id}" class="${f.id === current ? 'on' : ''}"><svg class="i" width="22" height="22" viewBox="0 0 24 24" style="color:${esc(f.color || '#A9A5AF')}"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>${esc(f.name)}</button>`).join('')}
      <button data-new="1" style="color:var(--muted)">${icon('plus', 22)}${esc(t('folder.new'))}</button></div></div>`);
    let done = false;
    const sh = openSheet(el, { label: t('ed.folder'), onClose: () => { if (!done) res(null); } });
    el.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.new) { const name = await promptDlg(t('folder.new'), { placeholder: t('folder.name'), maxlength: 40 }); if (!name) return; const f = await addFolder(name); if (!f) return; done = true; res(f.id); sh.close(); return; }
      done = true; res(b.dataset.v); sh.close();
    });
  });
}
/* 메뉴 한 줄짜리 고르기: [{ v, label, icon, danger }] */
function pickAction(title, items) {
  return new Promise(res => {
    const el = h(`<div>${title ? `<h2>${esc(title)}</h2>` : ''}<div class="pick">${items.map(i => `<button data-v="${i.v}" class="${i.danger ? 'danger' : ''}">${i.icon ? icon(i.icon, 22) : ''}${esc(i.label)}</button>`).join('')}</div></div>`);
    let done = false;
    const sh = openSheet(el, { label: title, onClose: () => { if (!done) res(null); } });
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; done = true; res(b.dataset.v); sh.close(); });
  });
}

export { KIND_ONE, TYPE_STICKER, pickAction, pickFolder, pickType, typeLabel };
