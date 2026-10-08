/* 알림함: 체험 안내(7일·3일 전), 공지. 서버 notices 표에서 읽어요. */
import { fmtRel, getLang, t } from '../core/i18n.js';
import { esc, icon } from '../core/utils.js';
import { S, emit } from '../data/store.js';
import { Sync } from '../data/sync.js';

async function load() {
  if (!Sync.sb) return [];
  const { data, error } = await Sync.sb.from('notices').select('id,user_id,kind,lang,title,body,created_at,read_at').order('created_at', { ascending: false }).limit(50);
  return error ? [] : data.filter(n => !n.lang || n.lang === getLang());
}
/* 안 읽은 개수 (종 모양 점) */
async function unread() { const list = await load(); const seen = Number(localStorage.getItem('daytale.noticeSeen') || 0); return list.filter(n => n.user_id ? !n.read_at : n.id > seen).length; }
function render(view) {
  view.innerHTML = `<section class="lst ntc"><div class="lst-head"><a class="icon-btn" href="#/home" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</a><h1>${esc(t('nav.notices'))}</h1></div><div class="body"><p class="hint">…</p></div></section>`;
  load().then(async list => {
    const body = view.querySelector('.body'); if (!body) return;
    body.innerHTML = list.length ? `<div class="card">${list.map(n => `<div class="r nt${(n.user_id ? !n.read_at : n.id > Number(localStorage.getItem('daytale.noticeSeen') || 0)) ? ' new' : ''}"><span class="kc">${icon(n.kind.startsWith('trial') ? 'hourglass' : 'megaphone', 18)}</span><span class="tx"><div class="t">${esc(n.title)}</div>${n.body ? `<div class="p wrap">${esc(n.body)}</div>` : ''}</span><span class="tm">${esc(fmtRel(n.created_at))}</span></div>`).join('')}</div>`
      : `<div class="empty">${esc(t('notice.empty'))}</div>`;
    const mine = list.filter(n => n.user_id && !n.read_at).map(n => n.id);
    if (mine.length) await Sync.sb.from('notices').update({ read_at: new Date().toISOString() }).in('id', mine);
    const top = Math.max(0, ...list.filter(n => !n.user_id).map(n => n.id)); if (top) localStorage.setItem('daytale.noticeSeen', String(top));
    emit('notices');
  });
}
export { render, unread };
