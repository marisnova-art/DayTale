/* 정보 탭에서 여는 글: 이용약관 · 개인정보 처리방침 · 자주 묻는 질문 · 회사 소개
   앱 안의 시트로 열고 닫아요. 랜딩 페이지(소개 사이트)로는 가지 않아요. */
import { CFG, brand } from '../core/config.js';
import { getLang, t } from '../core/i18n.js';
import { esc, h, icon } from '../core/utils.js';
import { FAQ } from '../core/faq.js';
import { openSheet } from '../ui/feedback.js';

function docSheet(title, html) {
  const el = h(`<div class="docv"><div class="docv-top"><h2>${esc(title)}</h2><button class="icon-btn" data-x aria-label="${esc(t('common.close'))}">${icon('x', 22)}</button></div><div class="docv-body">${html}</div></div>`);
  const sh = openSheet(el, { label: title });
  el.querySelector('[data-x]').onclick = () => sh.close();
  el.querySelector('.docv-body').addEventListener('click', e => {   // 글 안의 다른 약관 링크도 시트 안에서 바꿔 열어요
    const a = e.target.closest('a[href]'); if (!a) return;
    const k = /(terms|privacy)/.exec(a.getAttribute('href') || '');
    if (k && /legal\/|^(terms|privacy)/.test(a.getAttribute('href'))) { e.preventDefault(); sh.close(); openLegal(k[1]); }
    else if (!/^mailto:/.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
  });
  return sh;
}
/* 약관은 legal/*.html 원본을 그대로 불러와 본문만 보여 줘요 (머리·꼬리·사이트 링크 없이) */
async function openLegal(kind) {
  const file = `./legal/${kind}${getLang() === 'ko' ? '.ko' : ''}.html`;
  const title = t(kind === 'terms' ? 'set.terms' : 'set.privacy');
  const sh = docSheet(title, `<p class="snote">…</p>`);
  try {
    const doc = new DOMParser().parseFromString(await (await fetch(file)).text(), 'text/html');
    const main = doc.querySelector('main .wrap') || doc.querySelector('main') || doc.body;
    main.querySelectorAll('script, style, header, footer, h1').forEach(n => n.remove());
    main.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /^javascript:/i.test(a.value)) n.removeAttribute(a.name); }));
    const body = sh.el.querySelector('.docv-body'); if (body) body.innerHTML = main.innerHTML;
  } catch { const body = sh.el.querySelector('.docv-body'); if (body) body.innerHTML = `<p class="snote">${esc(t('err.generic'))}</p>`; }
  return sh;
}
function openFaq() {
  const list = FAQ[getLang()] || FAQ.en;
  docSheet(t('set.faq'), list.map(([q, a]) => `<details class="faq"><summary>${esc(q)}${icon('chevron-down', 18)}</summary><p>${esc(a)}</p></details>`).join(''));
}
/* 회사 소개: 틀만 먼저. 내용은 오픈 전에 채워요 (config의 COMPANY가 있으면 그걸 보여 줘요) */
function openAbout() {
  const c = CFG.COMPANY || {};
  const rows = [['set.co.name', c.name], ['set.co.ceo', c.ceo], ['set.co.addr', c.address], ['set.co.reg', c.reg], ['set.co.mail', c.email || CFG.CONTACT]];
  docSheet(t('set.about'), `<div class="co-hero"><img src="icons/icon-192.png" alt="" width="56" height="56"><b>${esc(brand(getLang()))}</b></div>
    <p class="co-intro">${esc(c.intro?.[getLang()] || c.intro?.en || t('set.co.soon'))}</p>
    <dl class="co-dl">${rows.map(([k, v]) => `<dt>${esc(t(k))}</dt><dd>${v ? esc(v) : '<span class="tbd">—</span>'}</dd>`).join('')}</dl>`);
}
export { openAbout, openFaq, openLegal };
