/* 설치 안내: 첫 기록을 남긴 뒤 한 번 권해요. 안드로이드·PC 크롬은 바로 설치, 아이폰은 방법 안내. */
import { t } from '../core/i18n.js';
import { esc, h, icon, ls } from '../core/utils.js';
import { openSheet } from '../ui/feedback.js';

let deferred = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
addEventListener('appinstalled', () => { deferred = null; ls.set('daytale.installed', 1); });
const ua = () => navigator.userAgent;
const Platform = {
  ios: () => /iphone|ipad|ipod/i.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  android: () => /android/i.test(ua()),
  inApp: () => /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps|everytimeApp/i.test(ua()),
  standalone: () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
};
const canPrompt = () => !!deferred;
async function install() { if (!deferred) return guide(); deferred.prompt(); const r = await deferred.userChoice.catch(() => null); deferred = null; return r?.outcome; }
function guide() {
  const step = (n, ic, title, sub = '') => `<li><span class="n">${n}</span><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div><span class="ic">${ic}</span></li>`;
  const app = '<img src="icons/icon-192.png" alt="" width="28" height="28" style="border-radius:7px">';
  let steps;
  if (Platform.standalone()) steps = `<li class="done">${icon('circle-check', 20)}<div><b>${esc(t('inst.done'))}</b></div></li>`;
  else if (Platform.ios()) steps = step(1, icon('share', 20), t('inst.ios1'), t('inst.ios1Sub')) + step(2, icon('square-plus', 20), t('inst.ios2')) + step(3, `<b class="add">${esc(t('inst.add'))}</b>`, t('inst.ios3')) + step(4, app, t('inst.open'));
  else if (Platform.android()) steps = step(1, icon('ellipsis-vertical', 20), t('inst.and1')) + step(2, icon('monitor-down', 20), t('inst.and2')) + step(3, app, t('inst.open'));
  else steps = step(1, icon('monitor-down', 20), t('inst.desk1'), t('inst.desk1Sub')) + step(2, icon('app-window', 20), t('inst.desk2'));
  const el = h(`<div class="inst"><h2>${esc(t('inst.title'))}</h2><p class="lead">${esc(t('inst.why'))}</p>${Platform.inApp() ? `<p class="warn">${icon('alert-triangle', 16)} ${esc(t('inst.inApp'))}</p>` : ''}<ol class="steps">${steps}</ol>
    ${canPrompt() ? `<button class="btn primary wide" data-go>${esc(t('inst.now'))}</button>` : ''}</div>`);
  const sh = openSheet(el, { label: t('inst.title') });
  el.querySelector('[data-go]')?.addEventListener('click', async () => { sh.close(); await install(); });
}
/* 첫 기록 뒤 한 번만 (설치돼 있거나 거절했으면 안 물어요) */
function maybeOffer() {
  if (Platform.standalone() || ls.get('daytale.installAsked') || ls.get('daytale.installed')) return;
  if (!canPrompt() && !Platform.ios() && !Platform.android()) return;
  ls.set('daytale.installAsked', 1);
  setTimeout(guide, 900);
}
export const Install = { Platform, canPrompt, install, guide, maybeOffer };
