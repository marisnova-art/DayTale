/* 백업·내보내기: JSON(다시 가져오기 가능) · 마크다운 · PDF(인쇄). 체험이 끝나도 언제나 열려 있어요. */
import { APP_VERSION, brand } from '../core/config.js';
import { fmtDate, getLang, t } from '../core/i18n.js';
import { esc, nowISO, todayKey } from '../core/utils.js';
import { htmlToMarkdown, htmlToText, sanitizeHTML } from '../core/sanitize.js';
import { S, displayTitle, emit, folderList } from '../data/store.js';
import { Photos } from './photos.js';
import { Sync } from '../data/sync.js';
import { typeLabel } from '../views/pickers.js';

const clean = o => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')));
const pick = trash => [...S.entries.values()].filter(e => trash || !e.deleted_at).sort((a, b) => a.created_at.localeCompare(b.created_at));
const photoLinks = e => (e.photos || []).map(p => Photos.src(p, false)).filter(u => /^https:/.test(u));

function download(name, type, data) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const fileName = ext => `${brand('en').toLowerCase()}-${todayKey()}.${ext}`;

function toJSON({ trash = false } = {}) {
  const entries = pick(trash).map(e => ({ ...clean(e), photo_urls: photoLinks(e) }));
  return { app: 'daytale', format: 1, app_version: APP_VERSION, exported_at: nowISO(), lang: getLang(),
    folders: folderList().map(clean), prefs: S.prefs, entries };
}
function exportJSON(opts) { const d = toJSON(opts); download(fileName('json'), 'application/json', JSON.stringify(d, null, 2)); return d.entries.length; }

function toMarkdown({ trash = false } = {}) {
  const fname = id => S.folders.get(id)?.name;
  const out = [`# ${brand(getLang())}`, '', `> ${fmtDate(new Date(), { year: 'numeric', month: 'long', day: 'numeric' })}`, ''];
  for (const e of pick(trash)) {
    const m = e.meta || {};
    out.push(`## ${displayTitle(e, t('common.untitled')).replace(/\n/g, ' ')}`, '');
    out.push(`*${[fmtDate(e.created_at, { year: 'numeric', month: 'long', day: 'numeric' }), typeLabel(e.type), fname(e.folder_id), m.date && e.type !== 'note' ? m.date + (m.time ? ' ' + m.time : '') : '', m.place, ...(e.tags || []).map(x => '#' + x)].filter(Boolean).join(' · ')}*`, '');
    const body = htmlToMarkdown(e.content || '').trim() || (e.text || '').trim();
    if (body) out.push(body, '');
    photoLinks(e).forEach((u, i) => out.push(`![${i + 1}](${u})`));
    out.push('', '---', '');
  }
  return out.join('\n');
}
function exportMarkdown(opts) { download(fileName('md'), 'text/markdown', toMarkdown(opts)); return pick(opts?.trash).length; }

/* PDF: 인쇄용 문서를 만들어 브라우저 인쇄(“PDF로 저장”)를 열어요. 라이브러리 없이. */
function printHTML({ trash = false } = {}) {
  const list = pick(trash); let month = '';
  const rows = list.map(e => {
    const mk = e.created_at.slice(0, 7); const head = mk !== month ? `<h2>${esc(fmtDate(e.created_at, { year: 'numeric', month: 'long' }))}</h2>` : ''; month = mk;
    const imgs = (e.photos || []).map(p => Photos.src(p, true)).filter(Boolean).map(u => `<img src="${esc(u)}" alt="">`).join('');
    return `${head}<article><h3>${esc(displayTitle(e, t('common.untitled')))}</h3><p class="m">${esc([fmtDate(e.created_at, { month: 'long', day: 'numeric', weekday: 'short' }), typeLabel(e.type), S.folders.get(e.folder_id)?.name, e.meta?.place].filter(Boolean).join(' · '))}</p>${imgs ? `<div class="ph">${imgs}</div>` : ''}<div class="b">${sanitizeHTML(e.content || '') || esc(e.text || '').replace(/\n/g, '<br>')}</div></article>`;
  }).join('');
  return `<!doctype html><html lang="${getLang()}"><head><meta charset="utf-8"><title>${esc(brand(getLang()))} · ${todayKey()}</title>
<style>@page{margin:18mm 16mm}body{font-family:'Pretendard Variable',Pretendard,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#1d1b20;font-size:11pt;line-height:1.65}
h1{font-size:22pt;margin:0 0 4pt}.sub{color:#77727d;margin:0 0 18pt}h2{font-size:14pt;margin:22pt 0 8pt;padding-bottom:4pt;border-bottom:1px solid #ddd;break-after:avoid}
article{break-inside:avoid;margin:0 0 14pt}h3{font-size:12pt;margin:0}.m{color:#77727d;font-size:9pt;margin:2pt 0 6pt}.b p{margin:0 0 4pt}.b ul.todo{list-style:none;padding-left:2pt}.b ul.todo li::before{content:'☐ '}.b ul.todo li.done::before{content:'☑ '}
.b blockquote{margin:6pt 0;padding-left:10pt;border-left:2px solid #bbb;color:#555}.ph{display:flex;gap:6pt;margin:4pt 0 6pt}.ph img{width:90pt;height:90pt;object-fit:cover;border-radius:6pt}mark{background:#ffe9a8}</style></head>
<body><h1>${esc(t('bk.printTitle', { name: S.status?.display_name || S.user?.email?.split('@')[0] || '' }))}</h1><p class="sub">${esc(t('bk.count', { n: list.length, f: S.folders.size }))} · ${esc(fmtDate(new Date(), { year: 'numeric', month: 'long', day: 'numeric' }))}</p>${rows}</body></html>`;
}
function exportPDF(opts) {
  const f = document.createElement('iframe'); f.className = 'print-frame'; f.setAttribute('aria-hidden', 'true');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.append(f);
  f.contentDocument.open(); f.contentDocument.write(printHTML(opts)); f.contentDocument.close();
  const go = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } finally { setTimeout(() => f.remove(), 60000); } };
  const imgs = [...f.contentDocument.images]; let left = imgs.length;
  if (!left) setTimeout(go, 150); else { const done = () => { if (--left === 0) go(); }; imgs.forEach(i => i.complete ? done() : (i.onload = i.onerror = done)); setTimeout(() => { if (left > 0) { left = 0; go(); } }, 5000); }
  return pick(opts?.trash).length;
}

/* JSON 가져오기: id가 같으면 더 최근에 고친 쪽을 남겨요 */
async function importJSON(text) {
  let d; try { d = JSON.parse(text); } catch { throw new Error('bad'); }
  if (d?.app !== 'daytale' || !Array.isArray(d.entries)) throw new Error('bad');
  if (!S.canWrite) { emit('locked'); return 0; }
  const UUID = /^[0-9a-f-]{36}$/i;
  const folders = (d.folders || []).filter(f => UUID.test(f.id) && f.name);
  for (const f of folders) { const cur = S.folders.get(f.id); if (!cur || (f.updated_at || '') > (cur.updated_at || '')) { const nf = { id: f.id, name: String(f.name).slice(0, 40), color: f.color, sort: f.sort, created_at: f.created_at, updated_at: nowISO(), _sv: cur?._sv ?? null, _dirty: true }; S.folders.set(nf.id, nf); await S.db.put('folders', nf); } }
  let n = 0; const batch = [];
  for (const x of d.entries) {
    if (!UUID.test(x.id || '')) continue;
    const cur = S.entries.get(x.id);
    if (cur && (cur.updated_at || '') >= (x.updated_at || '')) continue;
    const content = sanitizeHTML(String(x.content || ''));
    const e = { id: x.id, type: String(x.type || 'note').slice(0, 24), title: String(x.title || '').slice(0, 300), content, text: htmlToText(content) || String(x.text || ''),
      folder_id: x.folder_id && S.folders.has(x.folder_id) ? x.folder_id : null, tags: Array.isArray(x.tags) ? x.tags.slice(0, 20).map(String) : [],
      favorite: !!x.favorite, pinned: !!x.pinned, meta: x.meta && typeof x.meta === 'object' ? x.meta : {},
      photos: (cur?.photos || (Array.isArray(x.photos) ? x.photos.filter(p => p?.key && UUID.test(p.id || '') && p.key.startsWith(S.user?.id + '/')).slice(0, 4) : [])),
      created_at: x.created_at || nowISO(), updated_at: x.updated_at || nowISO(), deleted_at: x.deleted_at || null, _sv: cur?._sv ?? null, _dirty: true };
    S.entries.set(e.id, e); batch.push(e); n++;
  }
  await S.db.putMany('entries', batch);
  emit('folders'); emit('entries'); Sync.schedule(300);
  return n;
}

export const Backup = { exportJSON, exportMarkdown, exportPDF, importJSON, toJSON, toMarkdown, printHTML };
