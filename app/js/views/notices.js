/* 알림함: 오는 알림을 모두 한곳에 모아요.
   - 확인이 필요해요: 쓰기 잠김(체험 끝), 저장이 늦어짐 같은 지금의 문제
   - 다가오는 알림: 앞으로 이틀 안에 울릴 일정·할 일 알림
   - 지난 알림: 지난 7일 동안 울린 일정·할 일 알림 + 서버 notices 표(체험 안내·공지)
   안 읽은 것 = 마지막으로 알림함을 연 뒤에 생긴 것. 종 아이콘·메뉴·설정 › 알림·앱 아이콘에 점/숫자로 보여요.
   홈 배너: 관리자가 '홈에도 띄우기'로 올린 공지는 기간 동안 홈 위에 한 줄로 떠요. 닫거나 보면 사라지고, 다음 배너는 다음 날부터. */
import { fmtDate, fmtHM, fmtRel, fmtTime, getLang, t } from '../core/i18n.js';
import { esc, icon, ls } from '../core/utils.js';
import { S, emit } from '../data/store.js';
import { Sync } from '../data/sync.js';
import { Reminders } from '../features/reminders.js';
import { saveState } from '../features/safe.js';

const DAY = 864e5, SEEN = 'daytale.inboxSeen';
/* 이 공지가 나에게 맞는지: 언어 + 대상(모두 / 체험 중 / 구독 중 / 체험 끝·미구독) */
function forMe(n) {
  if (n.lang && n.lang !== getLang()) return false;
  const aud = n.audience || 'all', st = S.status; if (aud === 'all') return true; if (!st) return false;
  return aud === 'subscriber' ? !!st.subscriber : aud === 'trial' ? !st.subscriber && !!st.can_write : aud === 'ended' ? !st.subscriber && !st.can_write : false;
}
let cache = null;
async function load() {
  if (!Sync.sb) return [];
  const { data, error } = await Sync.sb.from('notices').select('id,user_id,kind,lang,title,body,created_at,read_at,banner,audience,starts_at,ends_at,image_url,cta_label,cta_url,detail').order('created_at', { ascending: false }).limit(50);
  return cache = error ? (cache || []) : data.filter(forMe);
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
  const srv = (await load()).map(n => ({ ic: n.kind.startsWith('trial') ? 'hourglass' : 'megaphone', title: n.title, body: n.body, href: '#/notices/' + n.id, at: Date.parse(n.starts_at || n.created_at), fresh: noticeNew(n), n }));
  return [...rem, ...srv].sort((a, b) => b.at - a.at);
}
/* 안 읽은 개수 (종 모양 점, 앱 아이콘 숫자) */
async function unread() { return problems().length + (await past()).filter(x => x.fresh).length; }

/* 홈 배너: 'strip' = 홈 위 띠(글자만), 'popup' = 이미지와 함께 시트(모바일은 아래에서, PC는 가운데 창).
   종류마다 하루에 하나만. 닫거나 보거나 알림함에서 읽은 공지는 다시 띄우지 않아요 */
const BN = 'daytale.banner', todayKey = () => new Date().toDateString();
const bstate = () => { const st = ls.get(BN, null); return st && typeof st.day === 'object' ? st : { closed: [], day: {} }; };
function pickBanner(list, kind) {
  const st = bstate(), now = Date.now();
  if (st.day[kind] === todayKey()) return null;   // 오늘 이 종류는 이미 하나를 닫았어요
  return (list || []).find(n => n.banner === kind && !n.user_id && !st.closed.includes(n.id) && (!n.starts_at || Date.parse(n.starts_at) <= now) && (!n.ends_at || Date.parse(n.ends_at) > now)) || null;
}
function closeBanner(ids, kind) { const st = bstate(); ids = [].concat(ids); ls.set(BN, { closed: [...st.closed.filter(x => !ids.includes(x)), ...ids].slice(-50), day: kind ? { ...st.day, [kind]: todayKey() } : st.day }); }
/* 버튼이 갈 곳: 관리자가 정한 앱 안(#/…) 또는 https 주소. 없으면 공지 상세 화면 */
const custom = n => /^#\/[\w\/-]*$/.test(n.cta_url || '') || /^https:\/\/[^\s"'<>]+$/.test(n.cta_url || '');
const ctaHref = n => custom(n) ? n.cta_url : '#/notices/' + n.id;
const ctaLabel = n => n.cta_label || t('banner.more');
const ext = u => u.startsWith('https:') ? ' target="_blank" rel="noopener"' : '';
const stripHTML = n => n ? `<div class="hbn" data-id="${n.id}">${icon('megaphone', 18)}<a class="tx" href="${esc(ctaHref(n))}"${ext(ctaHref(n))} data-hbn><b>${esc(n.title)}</b>${n.body ? `<span>${esc(n.body)}</span>` : ''}</a><a class="go" href="${esc(ctaHref(n))}"${ext(ctaHref(n))} data-hbn>${esc(n.cta_label || t('banner.go'))}</a><button class="x" data-hbn aria-label="${esc(t('common.close'))}">${icon('x', 16)}</button></div>` : '';
let popOpen = false;
async function popup(n) {
  if (!n || popOpen) return; popOpen = true;
  const { openSheet } = await import('../ui/feedback.js');
  const href = ctaHref(n);
  const el = document.createElement('div'); el.className = 'npop';
  el.innerHTML = `${n.image_url && /^https:\/\//.test(n.image_url) ? `<img class="pim" src="${esc(n.image_url)}" alt="">` : ''}<h3>${esc(n.title)}</h3>${n.body ? `<p>${esc(n.body)}</p>` : ''}<div class="acts"><button class="btn line" data-x>${esc(t('common.close'))}</button><a class="btn primary" href="${esc(href)}"${ext(href)}>${esc(ctaLabel(n))}</a></div>`;
  closeBanner(n.id, 'popup');   // 한 번 뜬 팝업은 다시 띄우지 않아요
  const sh = openSheet(el, { label: n.title, onClose: () => { popOpen = false; } });
  sh.el.classList.add('pop-sheet');
  el.querySelector('[data-x]').onclick = () => sh.close();
  el.querySelector('a.btn').addEventListener('click', () => sh.close());
}
/* 홈에 넣기: 받아 둔 것으로 먼저 그리고, 새로 받아 와서 바뀌었으면 다시 그려요. 띠와 백업 안내가 겹치면 띠가 먼저예요 */
function banner(slot) {
  if (!slot) return;
  const paint = list => {
    const n = pickBanner(list, 'strip'), cur = slot.querySelector('.hbn');
    if (String(n?.id ?? '') !== (cur?.dataset.id ?? '')) {
      slot.innerHTML = stripHTML(n); slot.closest('.home')?.classList.toggle('has-hbn', !!n);
      slot.querySelectorAll('[data-hbn]').forEach(b => b.addEventListener('click', () => { closeBanner(n.id, 'strip'); slot.innerHTML = ''; slot.closest('.home')?.classList.remove('has-hbn'); }));
    }
    const p = pickBanner(list, 'popup'); if (p) setTimeout(() => { if (slot.isConnected) popup(p); }, 700);
  };
  if (cache) paint(cache);
  load().then(paint, () => {});
}

const row = x => `<${x.href ? `a href="${x.href}"` : 'div'} class="r nt${x.fresh || x.bad ? ' new' : ''}${x.bad ? ' bad' : ''}"><span class="kc">${icon(x.ic, 18)}</span><span class="tx"><div class="t">${esc(x.title)}</div>${x.body ? `<div class="p wrap">${esc(x.body)}</div>` : ''}</span>${x.tm ? `<span class="tm">${esc(x.tm)}</span>` : ''}</${x.href ? 'a' : 'div'}>`;
const grp = (label, list) => list.length ? `<div class="grp"><span>${esc(label)}</span></div><div class="card">${list.map(row).join('')}</div>` : '';

/* 공지 상세: 이미지 · 제목 · 날짜 · 자세한 내용 (+ 관리자가 정한 버튼) */
async function renderDetail(view, id) {
  view.innerHTML = `<section class="lst ntc ndet"><div class="lst-head"><a class="icon-btn" href="#/notices" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</a><h1>${esc(t('nav.notices'))}</h1></div><div class="body"></div><div style="height:120px"></div></section>`;
  const n = (cache || []).find(x => x.id === id) || (await load()).find(x => x.id === id);
  const body = view.querySelector('.body'); if (!body) return;
  if (!n) { body.innerHTML = `<div class="empty">${icon('bell', 28)}<b>${esc(t('inbox.gone'))}</b><a class="btn line" href="#/notices">${esc(t('nav.notices'))}</a></div>`; return; }
  const href = custom(n) ? n.cta_url : '';
  body.innerHTML = `<article class="nart">${n.image_url && /^https:\/\//.test(n.image_url) ? `<img class="pim" src="${esc(n.image_url)}" alt="">` : ''}
    <h2>${esc(n.title)}</h2><time>${esc(fmtDate(new Date(n.starts_at || n.created_at), { year: 'numeric', month: 'long', day: 'numeric' }))}</time>
    <div class="ntext">${esc(n.detail || n.body)}</div>
    ${href ? `<a class="btn primary" href="${esc(href)}"${ext(href)}>${esc(ctaLabel(n))}</a>` : ''}</article>`;
  closeBanner(n.id);   // 읽었으니 배너로 다시 띄우지 않아요
  if (n.user_id && !n.read_at) await Sync.sb?.from('notices').update({ read_at: new Date().toISOString() }).eq('id', n.id);
}

function render(view, r) {
  if (r?.params?.id) return renderDetail(view, Number(r.params.id));
  view.innerHTML = `<section class="lst ntc"><div class="lst-head"><a class="icon-btn" href="#/home" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</a><h1>${esc(t('nav.notices'))}</h1></div><div class="body"></div><div style="height:120px"></div></section>`;
  (async () => {
    const now = Date.now();
    const prob = problems();
    const soon = Reminders.timeline(now, now + 2 * DAY).map(r => ({ ic: r.type === 'event' ? 'calendar' : 'check-square', title: r.title, body: remText(r), href: '#/e/' + r.id, tm: when(r.at) }));
    const old = (await past()).map(x => ({ ...x, tm: fmtRel(new Date(x.at).toISOString()) }));
    const body = view.querySelector('.body'); if (!body) return;
    body.innerHTML = prob.length + soon.length + old.length
      ? (prob.length || old.some(x => x.fresh) ? `<p class="nlegend"><i></i>${esc(t('inbox.legend'))}</p>` : '') + grp(t('inbox.check'), prob) + grp(t('inbox.soon'), soon) + grp(t('inbox.past'), old)
      : `<div class="empty">${icon('bell', 28)}<b>${esc(t('empty.inbox'))}</b><p>${esc(t('empty.inbox.s'))}</p><a class="btn line" href="#/settings/notify">${icon('settings', 18)}${esc(t('inbox.settings'))}</a></div>`;
    // 열었으니 읽음으로
    ls.set(SEEN, now);
    const seenB = old.filter(x => x.n?.banner).map(x => x.n.id); if (seenB.length) closeBanner(seenB);   // 알림함에서 본 공지는 홈 배너로 다시 띄우지 않아요
    const mine = old.filter(x => x.n?.user_id && !x.n.read_at).map(x => x.n.id);
    if (mine.length) await Sync.sb.from('notices').update({ read_at: new Date().toISOString() }).in('id', mine);
    const top = Math.max(0, ...old.filter(x => x.n && !x.n.user_id).map(x => x.n.id)); if (top) localStorage.setItem('daytale.noticeSeen', String(top));
    emit('notices');
  })();
}
export { banner, render, unread };
