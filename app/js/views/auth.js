/* 로그인 · 계정 만들기 · 비밀번호 재설정 */
import { getSupabase } from '../data/supabase.js';
import { brand } from '../core/config.js';
import { getLang, t } from '../core/i18n.js';
import { $, esc, icon } from '../core/utils.js';

const G = '<svg class="g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>';
const inApp = () => /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps|; wv\)/i.test(navigator.userAgent);
function errText(e) {
  const m = (e?.message || '').toLowerCase();
  if (m.includes('invalid login')) return t('auth.bad');
  if (m.includes('already registered') || m.includes('already been registered')) return t('auth.exists');
  if (m.includes('email not confirmed')) return t('auth.unconfirmed');
  if (m.includes('password') && m.includes('characters')) return t('auth.weak');
  if (m.includes('rate') || e?.status === 429) return t('auth.rate');
  return t('err.generic');
}

function showAuth(mode = 'signin', note = '') {
  const root = $('#auth'); root.hidden = false; $('#app').hidden = true;
  const signup = mode === 'signup', reset = mode === 'reset', newpw = mode === 'newpw';
  root.innerHTML = `<div class="auth">
    <div class="brandrow"><span class="logo"></span><span>${esc(brand(getLang()))}</span></div>
    <div class="hero"><div class="kicker">${esc(t('auth.kicker'))}</div><h1>${esc(t('auth.hero1'))}<br><span class="hl">${esc(t('auth.hero2'))}</span></h1></div>
    <form novalidate>
      ${signup ? `<h2>${esc(t('auth.signupTitle'))}</h2><p class="note" style="margin:0 0 16px">${esc(t('auth.signupNote'))}</p>` : ''}
      ${reset ? `<h2>${esc(t('auth.forgot'))}</h2>` : ''}${newpw ? `<h2>${esc(t('auth.resetTitle'))}</h2>` : ''}
      <div class="msg" hidden></div>
      ${newpw ? '' : `<label class="field">${icon('mail', 18)}<input name="email" type="email" autocomplete="email" inputmode="email" required placeholder="${esc(t('auth.email'))}" aria-label="${esc(t('auth.email'))}"></label>`}
      ${reset ? '' : `<label class="field">${icon('lock', 18)}<input name="pw" type="password" autocomplete="${signup || newpw ? 'new-password' : 'current-password'}" required minlength="${signup || newpw ? 8 : 1}" placeholder="${esc(t(signup || newpw ? 'auth.newPassword' : 'auth.password'))}" aria-label="${esc(t('auth.password'))}"><button type="button" class="eye" aria-label="show">${icon('eye', 18)}</button></label>`}
      ${mode === 'signin' ? `<div class="forgot"><a href="#" class="lk" data-mode="reset">${esc(t('auth.forgot'))}</a></div>` : '<div style="height:16px"></div>'}
      <button class="btn primary" type="submit">${esc(t(signup ? 'auth.signup' : reset ? 'common.ok' : newpw ? 'common.save' : 'auth.signin'))}</button>
      ${signup || mode === 'signin' ? `<div class="or">${esc(t('auth.or'))}</div><button type="button" class="btn line google">${G}${esc(t('auth.google'))}</button>` : ''}
      ${signup ? `<p class="legal">${t('auth.agree')}</p>` : ''}
    </form>
    <div class="bottom">${mode === 'signin' ? `<a href="#" class="lk" data-mode="signup">${t('auth.toSignup')}</a>` : newpw ? '' : `<a href="#" class="lk" data-mode="signin">${t('auth.toSignin')}</a>`}</div>
  </div>`;
  const form = root.querySelector('form'), msg = root.querySelector('.msg');
  const say = (text, bad = false) => { msg.hidden = false; msg.textContent = text; msg.classList.toggle('bad', bad); };
  if (note) say(note);
  root.querySelectorAll('[data-mode]').forEach(a => a.onclick = e => { e.preventDefault(); showAuth(a.dataset.mode); });
  root.querySelector('.eye')?.addEventListener('click', e => { const i = e.currentTarget.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; });
  root.querySelector('.google')?.addEventListener('click', async () => {
    if (inApp()) { say(t('auth.inapp'), true); if (/android/i.test(navigator.userAgent)) location.href = 'intent://' + location.href.replace(/^https?:\/\//, '') + '#Intent;scheme=https;end'; return; }
    const sb = await getSupabase(); if (!sb) return say(t('err.noServer'), true);
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
    if (error) say(errText(error), true);
  });
  form.onsubmit = async e => {
    e.preventDefault();
    const email = form.email?.value.trim(), pw = form.pw?.value || '';
    if (form.email && !/^\S+@\S+\.\S+$/.test(email)) return say(t('auth.email'), true);
    if ((signup || newpw) && pw.length < 8) return say(t('auth.weak'), true);
    const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const sb = await getSupabase(); if (!sb) throw new Error('noserver');
      const back = location.origin + location.pathname;
      if (mode === 'signin') { const { error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error; }
      else if (signup) {
        const { data, error } = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: back, data: { lang: getLang() } } });
        if (error) throw error;
        if (!data.session) say(t('auth.checkMail', { email }));
      } else if (reset) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: back }); if (error) throw error; say(t('auth.resetSent', { email })); }
      else if (newpw) { const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error; location.hash = '#/home'; location.reload(); }
    } catch (err) { say(err.message === 'noserver' ? t('err.noServer') : errText(err), true); }
    finally { btn.disabled = false; }
  };
  $('#boot')?.classList.add('gone');
}
function hideAuth() { const r = $('#auth'); r.hidden = true; r.innerHTML = ''; $('#app').hidden = false; }

export { hideAuth, showAuth };
