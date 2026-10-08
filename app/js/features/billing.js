/* 구독 (Paddle Billing). 결제는 Paddle 창에서 하고(판매자 = Paddle, 카드 정보는 우리에게 오지 않아요),
   구독 상태는 서버 웹훅(paddle-webhook)이 subscriptions 표에 써요. 앱은 그걸 다시 읽기만 해요. */
import { CFG } from '../core/config.js';
import { getLang, t } from '../core/i18n.js';
import { S, emit } from '../data/store.js';
import { Account } from '../data/account.js';
import { Sync } from '../data/sync.js';
import { toast } from '../ui/feedback.js';

const PADDLE_JS = 'https://cdn.paddle.com/paddle/v2/paddle.js';
const ACTIVE = ['active', 'trialing', 'past_due'];

const Billing = {
  sub: null, paddle: null, waiting: false, prices: null,
  cfg: () => CFG.PADDLE || {},
  configured() { const c = this.cfg(); return !!(c.clientToken && c.prices?.monthly && c.prices?.yearly); },
  active() { return !!this.sub && ACTIVE.includes(this.sub.status); },

  async refresh() {
    if (!Sync.sb || !S.user) return;
    const { data, error } = await Sync.sb.from('subscriptions').select('subscription_id,status,plan,currency,amount,current_period_end,cancel_at,update_payment_url,cancel_url,updated_at').order('updated_at', { ascending: false }).limit(1);
    if (!error) { this.sub = data[0] || null; emit('billing'); }
  },
  async load() {
    if (this.paddle) return this.paddle;
    if (!window.Paddle) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = PADDLE_JS; s.onload = res; s.onerror = () => rej(new Error('paddle.js')); document.head.appendChild(s); });
    const c = this.cfg();
    if (c.environment !== 'production') window.Paddle.Environment.set('sandbox');
    window.Paddle.Initialize({ token: c.clientToken, eventCallback: ev => this.onEvent(ev) });
    this.paddle = window.Paddle; return this.paddle;
  },
  /* 나라별 세금 포함 가격 (Paddle 가격 미리보기). 안 되면 설정의 표시 가격. */
  async localPrices() {
    const d = this.cfg().display || { monthly: 3.99, yearly: 39.9, currency: 'USD' };
    const fmt = n => new Intl.NumberFormat(getLang(), { style: 'currency', currency: d.currency }).format(n);
    const fallback = { monthly: fmt(d.monthly), yearly: fmt(d.yearly), yearlyPerMonth: fmt(Math.floor(d.yearly / 12 * 100) / 100), save: Math.round((1 - d.yearly / (d.monthly * 12)) * 100), local: false };
    if (!this.configured() || !navigator.onLine) return fallback;
    if (this.prices) return this.prices;
    try {
      const P = await this.load(); const c = this.cfg();
      const r = await P.PricePreview({ items: [{ priceId: c.prices.monthly, quantity: 1 }, { priceId: c.prices.yearly, quantity: 1 }] });
      const li = r.data.details.lineItems; const m = li.find(x => x.price.id === c.prices.monthly), y = li.find(x => x.price.id === c.prices.yearly);
      const cur = r.data.currencyCode; const per = new Intl.NumberFormat(getLang(), { style: 'currency', currency: cur }).format(Math.floor(Number(y.totals.total) / 12) / 100);
      this.prices = { monthly: m.formattedTotals.total, yearly: y.formattedTotals.total, yearlyPerMonth: per, save: Math.round((1 - Number(y.totals.total) / (Number(m.totals.total) * 12)) * 100), local: true };
      return this.prices;
    } catch (e) { console.warn(e); return fallback; }
  },
  async checkout(plan) {
    if (!this.configured()) { toast(t('plan.notReady'), { bad: true }); return; }
    if (!navigator.onLine) { toast(t('err.offline'), { bad: true }); return; }
    try {
      const P = await this.load(); const c = this.cfg();
      P.Checkout.open({ items: [{ priceId: c.prices[plan], quantity: 1 }], customer: { email: S.user.email }, customData: { user_id: S.user.id },
        settings: { displayMode: 'overlay', theme: 'dark', locale: getLang(), allowLogout: false, showAddDiscounts: false } });
    } catch (e) { console.warn(e); toast(t('plan.loadFail'), { bad: true }); }
  },
  onEvent(ev) {
    if (ev?.name !== 'checkout.completed') return;
    this.waiting = true; emit('billing');
    // 웹훅은 보통 몇 초 안에 와요. 몇 번 확인하고, 안 오면 다음에 열 때 다시 봐요.
    let n = 0; const tick = async () => { await this.refresh(); await Account.load().catch(() => {}); if (this.active() || ++n > 10) { this.waiting = false; emit('billing'); if (this.active()) toast(t('plan.thanks')); return; } setTimeout(tick, 3000); };
    setTimeout(tick, 2500);
  }
};

export { Billing };
