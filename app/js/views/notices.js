/* 알림함: 오는 알림을 모두 한곳에 모아요.
   - 확인이 필요해요: 쓰기 잠김(체험 끝), 저장이 늦어짐 같은 지금의 문제
   - 다가오는 알림: 앞으로 이틀 안에 울릴 일정·할 일 알림
   - 지난 알림: 지난 7일 동안 울린 일정·할 일 알림 + 서버 notices 표(체험 안내·공지)
   안 읽은 것 = 마지막으로 알림함을 연 뒤에 생긴 것. 종 아이콘·메뉴·설정 › 알림·앱 아이콘에 점/숫자로 보여요. */
import { fmtHM, fmtRel, fmtTime, getLang, t } from '../core/i18n.js';
import { esc, icon, ls } from '../core/utils.js';
import { S, emit } from '../data/store.js';
import { Sync } from '../data/sync.js';
import { Reminders } from '../features/reminders.js';
import { saveState } from '../features/safe.js';

const DAY = 864e5, SEEN = 'daytale.inboxSeen';
async function load() {
  if (!Sync.sb) return [];
  const { data, error } = await Sync.sb.from('notices').select('id,user_id,kind,lang,title,body,created_at,read_at').order('created_at', { ascending: false }).limit(50);
  return error ? [] : data.filter(n => !n.lang || n.lang === getLang());
}
const seenAt = () => Number(ls.get(SEEN, 0)) || 0;
const noticeNew = n => n.user_id ? !n.read_at : n.id > Number(localStorage.getItem('daytale.noticeSeen') || 0);
/* 지금 확인이 필요한 일 */
function problems() {
  const out = [];
  if (S.canWrite === false) out.push({ ic: 'lock', title: t('inbox.locked'), body: t('inbox.lockedS'), href: '#/plans', bad: true });
  const st = saveState();
  if (st.bad) out.push({ ic: st.ic, title: st.text, body: t('inbox.lateS'), href: '#/settings/data', bad: true });
  else if (st.off && /\d/.test(st.text)) out.push({ ic: st.ic, title: st.text, body: t('inbox.offS'), href: '#/settings/data' });
  return out;
}
const remText = r => r.type === 'event' ? t(r.b >= 1440 ? 'notify.eventTomorrow' : 'notify.eventSoon', { time: fmtHM(r.time) }) : t(r.b >= 1440 ? 'notify.todoTomorrow' : 'notify.todoDue');
const when = ms => { const d = new Date(ms), k = x => new Date(x).toDateString(); return (k(ms) === k(Date.now()) ? t('list.today') : k(ms) === k(Date.now() + DAY) ? t('inbox.tomorrow') : '') + ' ' + fmtTime(d); };
/* 지난 알림: 일정·할 일 + 서버 공지, 새것부터 */
async function past() {
  const now = Date.now();
  const rem = Reminders.timeline(now - 7 * DAY, now).map(r => ({ ic: r.type === 'event' ? 'calendar' : 'check-square', title: r.title, body: r.type === 'todo' ? t('inbox.todoPast') : remText(r), href: '#/e/' + r.id, at: r.at, fresh: r.at > seenAt() }));
  const srv = (await load()).map(n => ({ ic: n.kind.startsWith('trial') ? 'hourglass' : 'megaphone', title: n.title, body: n.body, at: Date.parse(n.created_at), fresh: noticeNew(n), n }));
  return [...rem, ...srv].sort((a, b) => b.at - a.at);
}
/* 안 읽은 개수 (종 모양 점, 앱 아이콘 숫자) */
async function unread() { return problems().length + (await past()).filter(x => x.fresh).length; }

const row = x => `<${x.href ? `a href="${x.href}"` : 'div'} class="r nt${x.fresh || x.bad ? ' new' : ''}${x.bad ? ' bad' : ''}"><span class="kc">${icon(x.ic, 18)}</span><span class="tx"><div class="t">${esc(x.title)}</div>${x.body ? `<div class="p wrap">${esc(x.body)}</div>` : ''}</span>${x.tm ? `<span class="tm">${esc(x.tm)}</span>` : ''}</${x.href ? 'a' : 'div'}>`;
const grp = (label, list) => list.length ? `<div class="grp"><span>${esc(label)}</span></div><div class="card">${list.map(row).join('')}</div>` : '';

function render(view) {
  view.innerHTML = `<section class="lst ntc"><div class="lst-head"><a class="icon-btn" href="#/home" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</a><h1>${esc(t('nav.notices'))}</h1></div><div class="body"></div><div style="height:120px"></div></section>`;
  (async () => {
    const now = Date.now();
    const prob = problems();
    const soon = Reminders.timeline(now, now + 2 * DAY).map(r => ({ ic: r.type === 'event' ? 'calendar' : 'check-square', title: r.title, body: remText(r), href: '#/e/' + r.id, tm: when(r.at) }));
    const old = (await past()).map(x => ({ ...x, tm: fmtRel(new Date(x.at).toISOString()) }));
    const body = view.querySelector('.body'); if (!body) return;
    body.innerHTML = prob.length + soon.length + old.length
      ? grp(t('inbox.check'), prob) + grp(t('inbox.soon'), soon) + grp(t('inbox.past'), old)
      : `<div class="empty">${icon('bell', 28)}<b>${esc(t('empty.inbox'))}</b><p>${esc(t('empty.inbox.s'))}</p><a class="btn line" href="#/settings/notify">${icon('settings', 18)}${esc(t('inbox.settings'))}</a></div>`;
    // 열었으니 읽음으로
    ls.set(SEEN, now);
    const mine = old.filter(x => x.n?.user_id && !x.n.read_at).map(x => x.n.id);
    if (mine.length) await Sync.sb.from('notices').update({ read_at: new Date().toISOString() }).in('id', mine);
    const top = Math.max(0, ...old.filter(x => x.n && !x.n.user_id).map(x => x.n.id)); if (top) localStorage.setItem('daytale.noticeSeen', String(top));
    emit('notices');
  })();
}
export { render, unread };
