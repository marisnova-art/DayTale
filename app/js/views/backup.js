/* 백업·내보내기 화면 (설정 › 데이터에서 열어요) */
import { Backup } from '../features/backup.js';
import { S } from '../data/store.js';
import { fmtNum, t } from '../core/i18n.js';
import { esc, icon } from '../core/utils.js';
import { toast } from '../ui/feedback.js';

function render(view) {
  const items = [['json', 'database', 'bk.json', 'bk.jsonDesc'], ['md', 'file-text', 'bk.md', 'bk.mdDesc'], ['pdf', 'download', 'bk.pdf', 'bk.pdfDesc']];
  view.innerHTML = `<section class="lst bk"><div class="lst-head"><a class="icon-btn" href="#/settings/data" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</a><h1>${esc(t('bk.title'))}</h1></div>
    <p class="hint">${esc(t('bk.desc'))}</p>
    <div class="card">${items.map(([k, ic, l, d]) => `<button class="r bk-it" data-x="${k}"><span class="kc">${icon(ic, 20)}</span><span class="tx"><div class="t">${esc(t(l))}</div><div class="p">${esc(t(d))}</div></span>${icon('chevron-right', 18)}</button>`).join('')}</div>
    <label class="bk-opt"><input type="checkbox" class="bk-trash"> ${esc(t('bk.trash'))}</label>
    <p class="hint">${esc(t('bk.count', { n: fmtNum([...S.entries.values()].filter(e => !e.deleted_at).length), f: fmtNum(S.folders.size) }))} · ${esc(t('bk.photos'))}</p>
    <div class="card" style="margin-top:22px"><button class="r bk-it" data-x="import"><span class="kc">${icon('upload', 20)}</span><span class="tx"><div class="t">${esc(t('bk.import'))}</div><div class="p">${esc(t('bk.importDesc'))}</div></span>${icon('chevron-right', 18)}</button></div>
    <input type="file" accept="application/json,.json" hidden class="bk-file"><div style="height:120px"></div></section>`;
  const trash = () => view.querySelector('.bk-trash').checked;
  view.addEventListener('click', ev => {
    const b = ev.target.closest('[data-x]'); if (!b) return;
    const x = b.dataset.x;
    if (x === 'import') { view.querySelector('.bk-file').click(); return; }
    const n = x === 'json' ? Backup.exportJSON({ trash: trash() }) : x === 'md' ? Backup.exportMarkdown({ trash: trash() }) : Backup.exportPDF({ trash: trash() });
    if (x !== 'pdf') toast(t('bk.done', { n: fmtNum(n) }));
  });
  view.querySelector('.bk-file').addEventListener('change', async ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try { const n = await Backup.importJSON(await f.text()); toast(t('bk.imported', { n: fmtNum(n) })); } catch { toast(t('bk.bad'), { bad: true }); }
  });
}
export { render };
