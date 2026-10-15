/* 구독: 체험 상태 · 연간(기본) / 월간 · 관리. 무료 등급은 없어요. 체험이 끝나도 읽기·찾기·내보내기·삭제는 열려 있어요. */
import { fmtDate, t } from '../core/i18n.js';
import { esc, icon } from '../core/utils.js';
import { Account } from '../data/account.js';
import { S, onChange } from '../data/store.js';
import { Billing } from '../features/billing.js';
import { snav } from './settings.js';

let pick = 'yearly', off = null;
function render(view) {
  view.innerHTML = `<section class="set has-g plans">${snav('account')}<div class="sbody"><div class="shead"><a class="icon-btn back" href="#/settings/account" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</a><h2>${esc(t('plan.title'))}</h2></div><div class="pbody"></div></div><div style="height:120px"></div></section>`;
  const body = view.querySelector('.pbody');
  const paint = async () => {
    const pr = await Billing.localPrices(); const st = S.status || {}; const sub = Billing.sub; const d = Account.trialDays();
    const status = st.subscriber
      ? `<div class="pstat on">${icon('circle-check', 20)}<span><b>${esc(t(st.plan === 'yearly' ? 'plan.yearlyOn' : 'plan.monthlyOn'))}</b><small>${esc(st.cancel_at ? t('plan.endsOn', { date: fmtDate(st.cancel_at, { year: 'numeric', month: 'long', day: 'numeric' }) }) : sub?.current_period_end ? t('plan.renews', { date: fmtDate(sub.current_period_end, { year: 'numeric', month: 'long', day: 'numeric' }) }) : '')}</small></span></div>`
      : `<div class="pstat${d > 0 ? '' : ' end'}">${icon(d > 0 ? 'hourglass' : 'lock', 20)}<span><b>${esc(d > 0 ? Account.leftText(d) : t('trial.ended'))}</b><small>${esc(d > 0 ? t('plan.trialSub') : t('plan.endedSub'))}</small></span></div>`;
    // 구독 전 (데이원처럼 단순하게): 제목 한 줄 → 체험 상태 한 줄 → 체크 목록 → 연간/월간 타일 → 버튼 하나 → 작은 안내
    const tile = (k, price, per, badge) => `<button class="ptile${k === 'yearly' ? ' best' : ''}${pick === k ? ' on' : ''}" data-plan="${k}" role="radio" aria-checked="${pick === k}">${badge ? `<em>${esc(badge)}</em>` : ''}<span class="tl">${esc(t('plan.' + k))}</span><b>${esc(price)}</b><small>${esc(per)}</small></button>`;
    const feats = `<ul class="pchk">${['f1', 'f2', 'f3', 'f4'].map(f => `<li>${icon('check', 20)}${esc(t('plan.' + f))}</li>`).join('')}</ul>`;
    // 우리만의 장점: 아이콘 타일 + 굵은 한 줄 + 작은 설명
    const perks = `<ul class="pperk">${[['b1', 'book-open'], ['b2', 'sparkles'], ['b3', 'image'], ['b4', 'pencil'], ['b5', 'cloud-check']].map(([k, ic]) => `<li><span class="ti">${icon(ic, 20)}</span><span><b>${esc(t('plan.' + k))}</b><small>${esc(t('plan.' + k + 's'))}</small></span></li>`).join('')}</ul>`;
    body.innerHTML = st.subscriber ? status + manage(sub) + `<h3 class="sgh">${esc(t('plan.includes'))}</h3>${feats}` : `<div class="pv2">
      <div class="phero"><h1 class="ptitle">${esc(t('plan.headline'))}</h1>
      <p class="ptrial${d > 0 ? '' : ' end'}">${icon(d > 0 ? 'hourglass' : 'lock', 17)}<span><b>${esc(d > 0 ? Account.leftText(d) : t('trial.ended'))}</b> · ${esc(d > 0 ? t('plan.trialSub') : t('plan.endedSub'))}</span></p>
      ${perks}</div>
      <div class="ptiles" role="radiogroup">${tile('yearly', pr.yearly, t('plan.perMonth', { price: pr.yearlyPerMonth }), pr.save > 0 ? t('plan.save', { n: pr.save }) : '')}${tile('monthly', pr.monthly, t('plan.monthlySub'), '')}</div>
      <button class="btn primary wide pgo" data-buy ${Billing.waiting ? 'disabled' : ''}>${esc(Billing.waiting ? t('plan.waiting') : t('plan.start', { plan: t('plan.' + pick) }))}</button>
      <p class="pfine">${esc(pr.local ? t('plan.taxIncl') : t('plan.taxNote'))} ${esc(t('plan.cancelAny'))}</p>
      <div class="pmore"><b>${esc(t('plan.afterTrial'))}</b><p>${esc(t('plan.afterTrialBody'))}</p></div></div>`;
  };
  view.paintPlans = paint;
  body.addEventListener('click', ev => {
    const o = ev.target.closest('[data-plan]'); if (o) { pick = o.dataset.plan; paint(); return; }
    if (ev.target.closest('[data-buy]')) Billing.checkout(pick);
    if (ev.target.closest('[data-recheck]')) { Billing.refresh().then(() => Account.load()).then(paint); }
  });
  paint(); Billing.refresh().then(paint);
  off?.(); off = onChange(w => { if (w === 'billing' || w === 'account') paint(); });
}
function manage(sub) {
  if (!sub) return `<p class="snote">${esc(t('plan.manageLater'))}</p>`;
  return `<div class="scard" style="margin-top:14px">${sub.update_payment_url ? `<a class="srow" href="${esc(sub.update_payment_url)}" target="_blank" rel="noopener"><span class="si">${icon('credit-card', 19)}</span><span class="stx"><b>${esc(t('plan.updatePay'))}</b></span>${icon('external-link', 16)}</a>` : ''}
    ${sub.cancel_url && !sub.cancel_at ? `<a class="srow" href="${esc(sub.cancel_url)}" target="_blank" rel="noopener"><span class="si">${icon('circle-x', 19)}</span><span class="stx"><b>${esc(t('plan.cancel'))}</b><small>${esc(t('plan.cancelSub'))}</small></span>${icon('external-link', 16)}</a>` : ''}
    <button class="srow" data-recheck><span class="si">${icon('refresh-cw', 19)}</span><span class="stx"><b>${esc(t('plan.recheck'))}</b></span></button></div>`;
}
function leave() { off?.(); off = null; }
const refresh = view => view.paintPlans?.();
export { leave, refresh, render };
