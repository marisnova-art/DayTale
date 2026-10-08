/* 번역과 지역 형식. 언어는 기기 설정에서 정해요(IP 아님). */
import { LANGS } from './config.js';
import { $$ } from './utils.js';

const PACKS = {};
let LANG = 'en';
const register = (lang, dict) => { PACKS[lang] = Object.assign(PACKS[lang] || {}, dict); };
const detectLang = () => {
  for (const tag of navigator.languages || [navigator.language || 'en']) {
    const l = String(tag).toLowerCase().split('-')[0];
    if (LANGS.includes(l)) return l;
  }
  return 'en';
};
function setLang(l) { LANG = LANGS.includes(l) ? l : 'en'; document.documentElement.lang = LANG; }
function t(key, vars) {
  let s = PACKS[LANG]?.[key] ?? PACKS.en?.[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}
const safeLocale = tag => { try { return Intl.getCanonicalLocales(String(tag).replace('_', '-'))[0] || 'en-US'; } catch { return 'en-US'; } };
const locale = () => { const n = navigator.language || ''; return n.toLowerCase().startsWith(LANG) ? safeLocale(n) : ({ ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', es: 'es-ES', fr: 'fr-FR' }[LANG] || 'en-US'); };
const fmtNum = n => new Intl.NumberFormat(locale()).format(n);
const fmtDate = (d, o) => new Intl.DateTimeFormat(locale(), o).format(typeof d === 'string' ? new Date(d) : d);
const fmtTime = d => fmtDate(d, { hour: 'numeric', minute: '2-digit' });
const fmtHM = hm => {
  if (!hm) return ''; const [h, m] = hm.split(':').map(Number);
  if (LANG === 'ko' && m === 0) return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시`;   // 오후 2시
  return fmtTime(new Date(2000, 0, 1, h, m));
};
function fmtRel(iso) {
  const d = new Date(iso), diff = (Date.now() - d) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  if (diff < 45) return t('time.now');
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 86400 * 6) return rtf.format(-Math.round(diff / 86400), 'day');
  return fmtDate(d, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}
function applyI18n(root = document) {
  $$('[data-t]', root).forEach(n => { n.textContent = t(n.dataset.t); });
  $$('[data-t-ph]', root).forEach(n => { n.placeholder = t(n.dataset.tPh); });
  $$('[data-t-label]', root).forEach(n => { n.setAttribute('aria-label', t(n.dataset.tLabel)); });
}
const getLang = () => LANG;

export { applyI18n, detectLang, fmtDate, fmtHM, fmtNum, fmtRel, fmtTime, getLang, locale, register, setLang, t };
