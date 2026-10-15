/* 한 마디 시트 · 간직하기 · 이 문장으로 쓰기 (홈과 '간직한 문장' 화면이 같이 써요)
   간직한 문장은 설정(prefs.keptWords)에 문장·작가·출처까지 담아요 → 계정에 저장돼 다른 기기에서도 보이고, 묶음 글이 바뀌어도 그대로 남아요 */
import { getLang, t } from '../core/i18n.js';
import { esc, h, icon, todayKey } from '../core/utils.js';
import { S, setPref } from '../data/store.js';
import { openSheet, toast } from '../ui/feedback.js';
import { go } from '../ui/router.js';

const kept = () => S.prefs.keptWords || [];
const isKept = (w, lang = w.lang || getLang()) => kept().some(x => x.id === w.id && x.lang === lang);
function toggleKeep(w) {
  const lang = w.lang || getLang(), on = isKept(w, lang);
  setPref('keptWords', on ? kept().filter(x => !(x.id === w.id && x.lang === lang)) : [{ id: w.id, lang, day: todayKey(), q: w.q, by: w.by, src: w.src || '' }, ...kept()].slice(0, 500));
  return !on;
}
const writeWith = w => { try { sessionStorage.setItem('daytale.carry', JSON.stringify({ quote: { id: w.id, lang: w.lang || getLang(), q: w.q, by: w.by, src: w.src || '' } })); } catch {} go('/new'); };
function wordSheet(w, { onChange } = {}) {
  const el = h(`<div class="wsheet"><h2>${esc(t('word.title'))}</h2><figure><blockquote>${esc(w.q)}</blockquote><figcaption>${esc(w.by)}${w.src ? ` · ${esc(w.src)}` : ''}</figcaption></figure>
    <div class="acts"><button class="btn" data-k></button><button class="btn primary" data-w>${icon('pencil', 18)}${esc(t('word.write'))}</button></div></div>`);
  const kb = el.querySelector('[data-k]');
  const paint = () => { const on = isKept(w); kb.classList.toggle('on', on); kb.innerHTML = icon(on ? 'bookmark-check' : 'bookmark', 18) + esc(t(on ? 'word.kept' : 'word.keep')); };
  paint();
  kb.onclick = () => { const on = toggleKeep(w); paint(); if (on) toast(t('word.keptToast')); onChange?.(); };
  const sh = openSheet(el, { label: t('word.title') });
  el.querySelector('[data-w]').onclick = () => { sh.close(); writeWith(w); };
  return sh;
}

export { isKept, kept, toggleKeep, wordSheet, writeWith };
