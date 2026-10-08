/* 토스트, 확인 대화상자, 아래 시트 */
import { t } from '../core/i18n.js';
import { $, esc, h } from '../core/utils.js';

function toast(msg, { bad = false, action, onAction, ms = 3800 } = {}) {
  let box = $('.toasts'); if (!box) { box = h('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.append(box); }
  const el = h(`<div class="toast${bad ? ' bad' : ''}"><span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}</div>`);
  if (action) el.querySelector('button').onclick = () => { el.remove(); onAction?.(); };
  box.append(el); setTimeout(() => el.remove(), ms);
}
function confirmDlg(title, body, ok = t('common.ok'), { danger = false, cancel = t('common.cancel') } = {}) {
  return new Promise(res => {
    const d = h(`<dialog class="dlg"><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}<div class="row">${cancel ? `<button class="btn ghost" value="0">${esc(cancel)}</button>` : ''}<button class="btn ${danger ? 'danger' : 'primary'}" value="1">${esc(ok)}</button></div></dialog>`);
    document.body.append(d);
    d.addEventListener('click', e => { const v = e.target.closest('button')?.value; if (v != null) d.close(v); else if (e.target === d) d.close('0'); });
    d.addEventListener('close', () => { res(d.returnValue === '1'); d.remove(); });
    d.showModal();
  });
}
function promptDlg(title, { value = '', placeholder = '', ok = t('common.ok'), type = 'text', maxlength = 300 } = {}) {
  return new Promise(res => {
    const d = h(`<dialog class="dlg"><form method="dialog"><h3>${esc(title)}</h3><label class="field" style="margin:4px 0 18px"><input type="${type}" maxlength="${maxlength}" placeholder="${esc(placeholder)}"></label><div class="row"><button class="btn ghost" value="0" type="button">${esc(t('common.cancel'))}</button><button class="btn primary" value="1">${esc(ok)}</button></div></form></dialog>`);
    const inp = d.querySelector('input'); inp.value = value;
    document.body.append(d);
    d.querySelector('[value="0"]').onclick = () => d.close('0');
    d.addEventListener('close', () => { res(d.returnValue === '1' ? inp.value.trim() : null); d.remove(); });
    d.showModal(); inp.focus(); inp.select();
  });
}
/* 시트: 내용(Element)을 받아 열고, 닫힐 때 onClose */
function openSheet(content, { label = '', onClose } = {}) {
  const scrim = h('<div class="sheet-scrim"></div>');
  const sh = h(`<section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><span class="grip"></span><div class="body"></div></section>`);
  sh.querySelector('.body').append(content);
  document.body.append(scrim, sh);
  requestAnimationFrame(() => { scrim.classList.add('open'); sh.classList.add('open'); });
  const prev = document.activeElement;
  const close = () => { scrim.classList.remove('open'); sh.classList.remove('open'); removeEventListener('keydown', onKey); setTimeout(() => { scrim.remove(); sh.remove(); }, 280); prev?.focus?.(); onClose?.(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey); scrim.onclick = close;
  // 손잡이를 아래로 끌어 닫기
  let y0 = null; const grip = sh.querySelector('.grip');
  sh.addEventListener('touchstart', e => { if (e.target === grip || sh.querySelector('.body').scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; sh.style.transform = ''; if (dy > 90) close(); });
  setTimeout(() => sh.querySelector('input,textarea,button:not(.grip)')?.focus({ preventScroll: true }), 300);
  return { el: sh, close };
}

export { confirmDlg, openSheet, promptDlg, toast };
