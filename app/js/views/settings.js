/* 설정: 계정·구독 · 화면 · 기록 · 알림 · 데이터 · 정보 (휴대폰은 목록 → 그룹, PC는 왼쪽 목록 + 오른쪽 내용) */
import { APP_VERSION, CFG, LANGS, LIMITS, brand } from '../core/config.js';
import { fmtDate, fmtNum, fmtRel, getLang, t } from '../core/i18n.js';
import { esc, h, icon, uid } from '../core/utils.js';
import { Account } from '../data/account.js';
import { CITIES, cityLookup, guessCity } from '../data/cities.js';
import { S, emit, live, onChange, setPref } from '../data/store.js';
import { endSession } from '../data/supabase.js';
import { Sync } from '../data/sync.js';
import { Install } from '../features/install.js';
import { Reminders } from '../features/reminders.js';
import { Weather } from '../features/weather.js';
import { confirmDlg, openSheet, promptDlg, toast } from '../ui/feedback.js';
import { go } from '../ui/router.js';
import { pickType, typeLabel } from './pickers.js';

const GROUPS = [['account', 'user'], ['display', 'palette'], ['record', 'notebook-pen'], ['notify', 'bell'], ['data', 'database'], ['info', 'info']];
const isPC = () => matchMedia('(min-width: 900px)').matches;
const LICENSES = [
  ['Pretendard', 'SIL Open Font License 1.1', 'https://github.com/orioncactus/pretendard'],
  ['Lucide Icons', 'ISC License', 'https://lucide.dev/license'],
  ['Fluent Emoji (Microsoft)', 'MIT License', 'https://github.com/microsoft/fluentui-emoji'],
  ['Pixelarticons', 'MIT License', 'https://github.com/halfmage/pixelarticons'],
  ['supabase-js', 'MIT License', 'https://github.com/supabase/supabase-js'],
  ['MET Norway Locationforecast', 'CC BY 4.0 · NLOD', 'https://api.met.no/doc/License']
];

/* ---------- 줄 만들기 ---------- */
const row = ({ ic, label, sub = '', value = '', act = '', href = '', danger = false, chev = true }) =>
  `<${href ? `a href="${href}"` : `button data-a="${act}"`} class="srow${danger ? ' danger' : ''}">${ic ? `<span class="si">${icon(ic, 19)}</span>` : ''}<span class="stx"><b>${esc(label)}</b>${sub ? `<small>${sub}</small>` : ''}</span>${value ? `<span class="sv">${esc(value)}</span>` : ''}${chev ? icon('chevron-right', 18) : ''}</${href ? 'a' : 'button'}>`;
const toggle = (key, label, sub, on) => `<label class="srow"><span class="stx"><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><input type="checkbox" class="sw" data-t="${key}" ${on ? 'checked' : ''}></label>`;
const seg = (key, label, opts, cur) => `<div class="srow col"><span class="stx"><b>${esc(label)}</b></span><span class="seg wide">${opts.map(([v, l]) => `<button data-s="${key}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${esc(l)}</button>`).join('')}</span></div>`;
const card = (title, inner) => `${title ? `<h3 class="sgh">${esc(title)}</h3>` : ''}<div class="scard">${inner}</div>`;

function planLine() {
  const st = S.status; if (!st) return '';
  if (st.subscriber) return t(st.plan === 'yearly' ? 'plan.yearlyOn' : 'plan.monthlyOn') + (st.cancel_at ? ' · ' + t('plan.endsOn', { date: fmtDate(st.cancel_at, { month: 'long', day: 'numeric' }) }) : '');
  const d = Account.trialDays(); return d > 0 ? t('trial.left', { n: d }) : t('trial.ended');
}

function group(g) {
  const p = S.prefs, n = p.notify || {};
  if (g === 'account') return card('', `<div class="sprof"><button class="avbtn" data-a="photo" aria-label="${esc(t('set.photo'))}">${Account.avatarHTML('big')}<i>${icon('camera', 14)}</i></button><input type="file" accept="image/*" hidden class="av-file"><span><b>${esc(Account.name())}</b><small>${esc(S.user?.email || '')}</small></span><button class="chip" data-a="name">${esc(t('set.editName'))}</button></div>`)
    + card(t('set.plan'), row({ ic: 'gem', label: t('set.planNow'), sub: esc(planLine()), href: '#/plans' }))
    + card(t('set.invite'), row({ ic: 'gift', label: t('set.myCode'), sub: esc(t('set.inviteSub')), value: S.status?.referral_code || '', act: 'code' }) + row({ ic: 'ticket', label: t('set.enterCode'), act: 'redeem' }))
    + card(t('set.security'), row({ ic: 'key-round', label: t('set.password'), act: 'password' }) + row({ ic: 'log-out', label: t('set.signOut'), act: 'signout', chev: false }));
  if (g === 'display') return card('', seg('mode', t('set.mode'), [['story', t('set.story')], ['tidy', t('set.tidy')]], p.mode) + `<p class="snote">${esc(t('set.modeSub'))}</p>`)
    + card('', seg('textSize', t('set.textSize'), [['m', t('set.sizeM')], ['l', t('set.sizeL')], ['xl', t('set.sizeXL')]], p.textSize || 'm')
      + seg('lang', t('set.lang'), [['', t('set.langAuto')], ...LANGS.map(l => [l, t('lang.' + l)])], p.lang || '')
      + seg('weekStart', t('set.weekStart'), [[0, t('set.sun')], [1, t('set.mon')]], p.weekStart || 0));
  if (g === 'record') {
    const c = Weather.city();
    return card('', row({ ic: 'shapes', label: t('set.defaultType'), value: typeLabel(p.defaultType || 'note'), act: 'type' })
      + row({ ic: 'cloud-sun', label: t('set.city'), sub: esc(p.city ? t('set.cityManual') : t('set.cityAuto')), value: c ? c.name : '-', act: 'city' }))
      + card(t('set.days'), (p.days || []).map(d => `<div class="srow"><span class="si">${icon('cake', 19)}</span><span class="stx"><b>${esc(d.label)}</b><small>${esc(t('set.everyYear', { date: fmtDate(new Date(2000, +d.date.slice(-5, -3) - 1, +d.date.slice(-2)), { month: 'long', day: 'numeric' }) }))}</small></span><button class="icon-btn" data-del-day="${d.id}" aria-label="${esc(t('common.delete'))}">${icon('x', 18)}</button></div>`).join('')
        + row({ ic: 'plus', label: t('set.addDay'), sub: esc(t('set.daysSub')), act: 'addDay', chev: false }));
  }
  if (g === 'notify') {
    const perm = Reminders.permission();
    return card('', perm === 'granted' ? `<p class="snote ok">${icon('circle-check', 16)} ${esc(t('set.notifyOn'))}</p>` : perm === 'unsupported' ? `<p class="snote">${esc(t('set.notifyNo'))}</p>` : row({ ic: 'bell', label: t('set.notifyAsk'), sub: esc(perm === 'denied' ? t('set.notifyDenied') : t('set.notifyAskSub')), act: 'perm' }))
      + card('', toggle('notify.reminders', t('set.reminders'), t('set.remindersSub'), n.reminders !== false)
        + toggle('notify.morning', t('set.morning'), '', !!n.morning) + (n.morning ? `<label class="srow sub"><span class="stx"><b>${esc(t('set.at'))}</b></span><input type="time" data-time="morningAt" value="${esc(n.morningAt || '08:00')}"></label>` : '')
        + toggle('notify.evening', t('set.evening'), t('set.eveningSub'), !!n.evening) + (n.evening ? `<label class="srow sub"><span class="stx"><b>${esc(t('set.at'))}</b></span><input type="time" data-time="eveningAt" value="${esc(n.eveningAt || '21:00')}"></label>` : ''))
      + `<p class="snote">${esc(t('set.notifyHonest'))}</p>`;
  }
  if (g === 'data') {
    const st = S.status || {}; const ents = S.entries.size;
    const photos = st.subscriber ? `${(st.photo_bytes / 1024 ** 2).toFixed(1)}MB / 1GB` : `${fmtNum(st.photo_count || 0)} / ${LIMITS.trialPhotos}`;
    const sync = !navigator.onLine ? t('sync.offline') : S.sync === 'syncing' ? t('sync.syncing') : S.lastSyncAt ? t('sync.at', { when: fmtRel(S.lastSyncAt) }) : t('sync.never');
    return card('', row({ ic: 'refresh-cw', label: t('set.syncNow'), sub: esc(sync), act: 'sync', chev: false }))
      + card(t('set.usage'), `<div class="usage">${[[t('set.uEntries'), `${fmtNum(ents)} / ${fmtNum(LIMITS.entries)}`, ents / LIMITS.entries], ...(CFG.PHOTOS_URL ? [[t('set.uPhotos'), photos, st.subscriber ? st.photo_bytes / LIMITS.paidBytes : (st.photo_count || 0) / LIMITS.trialPhotos]] : []), [t('set.uFolders'), `${S.folders.size} / ${LIMITS.folders}`, S.folders.size / LIMITS.folders]]
        .map(([l, v, r]) => `<div class="u"><span>${esc(l)}</span><b>${esc(v)}</b><i><em style="width:${Math.min(100, Math.max(1, Math.round(r * 100)))}%"></em></i></div>`).join('')}</div>`)
      + card('', row({ ic: 'download', label: t('bk.title'), sub: esc(t('set.backupSub')), href: '#/backup' }) + row({ ic: 'trash-2', label: t('nav.trash'), sub: esc(t('set.trashSub')), href: '#/trash' }))
      + card(t('set.danger'), row({ ic: 'circle-x', label: t('set.deleteAccount'), sub: esc(t('set.deleteSub')), act: 'deleteAccount', danger: true }));
  }
  if (g === 'info') return card('', `<div class="sabout"><img src="icons/icon-192.png" alt="" width="56" height="56"><b>${esc(brand(getLang()))}</b><small>${esc(CFG.BRAND?.tagline || '')}</small><small>${esc(t('set.version', { v: APP_VERSION }))}</small></div>`)
    + card('', row({ ic: 'smartphone', label: t('inst.title'), sub: esc(Install.Platform.standalone() ? t('inst.done') : t('set.installSub')), act: 'install' })
      + row({ ic: 'mail', label: t('set.contact'), sub: esc(CFG.CONTACT || ''), href: `mailto:${CFG.CONTACT}` }))
    + card('', row({ ic: 'scroll-text', label: t('set.terms'), href: `./legal/terms${getLang() === 'ko' ? '.ko' : ''}.html` }) + row({ ic: 'shield', label: t('set.privacy'), href: `./legal/privacy${getLang() === 'ko' ? '.ko' : ''}.html` }) + row({ ic: 'book-open', label: t('set.licenses'), act: 'licenses' }))
    + `<p class="snote">${t('set.metCredit')}</p>`;
  return '';
}

function render(view, r) {
  const g = r.params.group || (isPC() ? 'account' : '');
  view.innerHTML = `<section class="set${g ? ' has-g' : ''}"><nav class="snav"><h1>${esc(t('nav.settings'))}</h1>
      <div class="scard">${GROUPS.map(([k, ic]) => `<a class="srow${k === g ? ' on' : ''}" href="#/settings/${k}"><span class="si">${icon(ic, 19)}</span><span class="stx"><b>${esc(t('set.g.' + k))}</b></span>${icon('chevron-right', 18)}</a>`).join('')}</div></nav>
    <div class="sbody">${g ? `<div class="shead"><a class="icon-btn back" href="#/settings" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</a><h2>${esc(t('set.g.' + g))}</h2></div><div class="sgroup">${group(g)}</div>` : ''}</div><div style="height:120px"></div></section>`;
  const paint = () => { const box = view.querySelector('.sgroup'); if (box) box.innerHTML = group(g); };
  view.paintSet = paint;
  view.addEventListener('click', ev => onClick(ev, paint));
  view.addEventListener('change', ev => {
    const el = ev.target;
    if (el.dataset.t) { const [a, b] = el.dataset.t.split('.'); if (b) setPref(a, { ...S.prefs[a], [b]: el.checked }); else setPref(a, el.checked); Reminders.schedule(); paint(); }
    if (el.dataset.time) { setPref('notify', { ...S.prefs.notify, [el.dataset.time]: el.value }); Reminders.schedule(); }
  });
}

async function onClick(ev, paint) {
  const s = ev.target.closest('[data-s]');
  if (s) { const k = s.dataset.s; let v = s.dataset.v; if (k === 'weekStart') v = +v; if (k === 'lang' && !v) v = null; setPref(k, v); paint(); if (k === 'lang') location.reload(); return; }
  const dd = ev.target.closest('[data-del-day]');
  if (dd) { setPref('days', (S.prefs.days || []).filter(d => d.id !== dd.dataset.delDay)); paint(); return; }
  const b = ev.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a;
  if (a === 'photo') {
    const pickFile = () => { const inp = document.querySelector('.av-file'); inp.onchange = async () => { const f = inp.files[0]; inp.value = ''; if (!f) return; try { const url = await Account.photoFrom(f); if (await Account.update({ avatar: url })) paint(); else toast(t('set.photoFail'), { bad: true }); } catch { toast(t('set.photoFail'), { bad: true }); } }; inp.click(); };
    if (!Account.profile?.avatar) return pickFile();
    const { pickAction } = await import('./pickers.js');
    const v = await pickAction('', [{ v: 'change', label: t('set.photo'), icon: 'camera' }, { v: 'remove', label: t('set.photoRemove'), icon: 'trash-2', danger: true }]);
    if (v === 'change') pickFile(); else if (v === 'remove' && await Account.update({ avatar: null })) paint();
    return;
  }
  if (a === 'name') { const v = await promptDlg(t('set.editName'), { value: Account.name(), maxlength: 40 }); if (v && v.trim()) { await Account.update({ display_name: v.trim() }); paint(); } }
  else if (a === 'code') { const c = S.status?.referral_code; if (!c) return; const text = t('set.inviteText', { name: brand(getLang()), code: c, url: CFG.SITE_URL || location.origin }); if (navigator.share) navigator.share({ text }).catch(() => {}); else { navigator.clipboard?.writeText(text); toast(t('set.copied')); } }
  else if (a === 'redeem') { const v = await promptDlg(t('set.enterCode'), { placeholder: 'abcd1234', maxlength: 16 }); if (!v) return; const { data } = await Sync.sb.rpc('redeem_referral', { code: v.trim() }); toast(data ? t('set.codeOk') : t('set.codeBad'), { bad: !data }); if (data) { await Account.load(); paint(); } }
  else if (a === 'password') { const v = await promptDlg(t('set.newPassword'), { type: 'password', maxlength: 72 }); if (!v) return; if (v.length < 8) { toast(t('auth.weak'), { bad: true }); return; } const { error } = await Sync.sb.auth.updateUser({ password: v }); toast(error ? t('err.generic') : t('set.passwordOk'), { bad: !!error }); }
  else if (a === 'signout') { if (await confirmDlg(t('set.signOutQ'), t('set.signOutBody'), t('set.signOut'))) { await Sync.run().catch(() => {}); await endSession(); location.hash = ''; location.reload(); } }
  else if (a === 'type') { const v = await pickType(S.prefs.defaultType); if (v) { setPref('defaultType', v); paint(); } }
  else if (a === 'city') { const v = await pickCity(); if (v !== undefined) { setPref('city', v); Weather.refresh({ force: true }).then(() => emit('weather')); paint(); } }
  else if (a === 'addDay') addDay(paint);
  else if (a === 'perm') { const p = await Reminders.request(); if (p === 'denied') toast(t('set.notifyDenied'), { bad: true }); paint(); }
  else if (a === 'sync') { await Sync.run(); toast(t('sync.done')); paint(); }
  else if (a === 'deleteAccount') deleteAccount();
  else if (a === 'install') Install.guide();
  else if (a === 'licenses') { const el = h(`<div><h2>${esc(t('set.licenses'))}</h2><div class="scard">${LICENSES.map(([n, l, u]) => `<a class="srow" href="${u}" target="_blank" rel="noopener"><span class="stx"><b>${esc(n)}</b><small>${esc(l)}</small></span>${icon('external-link', 16)}</a>`).join('')}</div><p class="snote">${esc(t('set.licensesSub'))}</p></div>`); openSheet(el, { label: t('set.licenses') }); }
}

/* 날씨 도시: 자동 + 나라별 목록 검색. 결과: id | null(자동) | undefined(취소) */
function pickCity() {
  return new Promise(res => {
    const auto = cityLookup(guessCity());
    const all = Object.entries(CITIES).flatMap(([cc, c]) => c.c.map(x => ({ id: cc + ':' + x[0], name: getLang() === 'ko' ? x[2] : x[1], en: x[1], ko: x[2], country: getLang() === 'ko' ? c.ko : c.en })));
    const el = h(`<div class="citypick"><h2>${esc(t('set.city'))}</h2><label class="searchbar">${icon('search', 18)}<input type="search" placeholder="${esc(t('set.citySearch'))}"></label><div class="pick list"></div></div>`);
    const list = el.querySelector('.list'); let done = false;
    const draw = q => { const ql = q.trim().toLowerCase(); const hits = ql ? all.filter(c => (c.en + ' ' + c.ko + ' ' + c.country).toLowerCase().includes(ql)).slice(0, 60) : all.filter(c => c.id.startsWith((S.prefs.city || guessCity() || 'KR:').split(':')[0] + ':')).slice(0, 60);
      list.innerHTML = `<button data-v="">${icon('locate', 20)}${esc(t('set.cityAuto'))}${auto ? ` · ${esc(auto.name)}` : ''}</button>` + hits.map(c => `<button data-v="${c.id}" class="${c.id === S.prefs.city ? 'on' : ''}">${icon('map-pin', 20)}${esc(c.name)}<small>${esc(c.country)}</small></button>`).join(''); };
    draw('');
    el.querySelector('input').addEventListener('input', e => draw(e.target.value));
    const sh = openSheet(el, { label: t('set.city'), onClose: () => { if (!done) res(undefined); } });
    list.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; done = true; res(b.dataset.v || null); sh.close(); });
  });
}
async function addDay(paint) {
  const label = await promptDlg(t('set.dayName'), { placeholder: t('set.dayNamePh'), maxlength: 40 }); if (!label) return;
  const date = await promptDlg(t('set.dayDate'), { type: 'date' }); if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return;
  const days = [...(S.prefs.days || []), { id: uid(), label: label.trim(), date }].slice(0, 30);
  setPref('days', days); paint();
}
async function deleteAccount() {
  if (S.status?.subscriber && !S.status.cancel_at) { toast(t('set.cancelFirst'), { bad: true, action: t('trial.plans'), onAction: () => go('/plans'), ms: 7000 }); return; }
  if (!(await confirmDlg(t('set.deleteQ'), t('set.deleteBody'), t('set.deleteAccount'), { danger: true }))) return;
  const v = await promptDlg(t('set.deleteType', { word: t('set.deleteWord') }), { placeholder: t('set.deleteWord') });
  if ((v || '').trim() !== t('set.deleteWord')) return;
  const { error } = await Sync.sb.rpc('delete_my_account');
  if (error) { toast(/cancel_subscription_first/.test(error.message) ? t('set.cancelFirst') : t('err.generic'), { bad: true }); return; }
  await S.db.destroy().catch(() => {}); await endSession(); location.hash = ''; location.reload();
}
const refresh = view => view.paintSet?.();
export { refresh, render };
