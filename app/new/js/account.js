// 로그인 (11-06): Google · 메일 6자리 코드 (비밀번호 없음). Apple은 자리만 (앱 단계에서 켜요)
// 공개(anon) 키만 써요 (../config.js). 예전 앱과 세션을 섞지 않게 저장 이름을 따로 써요
const CFG = window.APP_CONFIG || {};
let client = null, sess = null;
const subs = new Set();

export const configured = () => /^https:\/\/.+/.test(CFG.SUPABASE_URL || '') && (CFG.SUPABASE_ANON_KEY || '').length > 20;
export const appleOn = () => !!CFG.APPLE_LOGIN;

function loadScript(src) {
  return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('load')); document.head.appendChild(s); });
}
export async function sb() {
  if (client) return client;
  if (!configured()) return null;
  if (!window.supabase) await loadScript('../vendor/supabase.js');
  client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: 'dz.auth' }
  });
  client.auth.onAuthStateChange((ev, s) => { sess = s; subs.forEach(f => { try { f(ev, s); } catch {} }); });
  return client;
}

// 처음 열 때: 저장된 로그인이 있을 때만 서버 라이브러리를 읽어요 (로그인 안 한 사람은 가볍게)
const hasStored = () => { try { return !!localStorage.getItem('dz.auth') || /[?&]code=/.test(location.search); } catch { return false; } };
export async function start() {
  if (!configured() || !hasStored()) return null;
  try {
    const c = await sb(); const { data } = await c.auth.getSession(); sess = data.session;
    if (/[?&](code|error)=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);   // 구글에서 돌아온 주소 정리
  } catch { sess = null; }
  return sess;
}
export const session = () => sess;
export const user = () => sess?.user || null;
export const onAuth = f => subs.add(f);
export function provider() {
  const u = user(); if (!u) return '';
  const p = u.app_metadata?.provider || 'email';
  return p === 'google' ? 'google' : p === 'apple' ? 'apple' : 'email';
}

// Google · Apple: 그 회사 화면에 다녀와요. 돌아올 곳 = 이 앱 첫 화면
export async function oauth(p) {
  const c = await sb(); if (!c) throw new Error('config');
  const { error } = await c.auth.signInWithOAuth({ provider: p, options: { redirectTo: location.origin + location.pathname } });
  if (error) throw error;
}
// 메일: 코드 보내기 → 코드 넣기
export async function sendCode(email) {
  const c = await sb(); if (!c) throw new Error('config');
  const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}
export async function verifyCode(email, token) {
  const c = await sb();
  const { data, error } = await c.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  sess = data.session; return sess;
}
export async function signOut() {
  const c = await sb().catch(() => null);
  const cap = p => Promise.race([p.catch(() => {}), new Promise(r => setTimeout(r, 4000))]);
  if (c) await cap(c.auth.signOut({ scope: 'local' }));
  try { Object.keys(localStorage).filter(k => k.startsWith('dz.auth')).forEach(k => localStorage.removeItem(k)); } catch {}
  sess = null;
}
// 탈퇴: 7일 뒤에 지워져요. 그 안에 다시 로그인하면 stay()가 되살려요
export async function leave() { const c = await sb(); const { error } = await c.rpc('dz_leave'); if (error) throw error; }
export async function stay() { const c = await sb(); const { data } = await c.rpc('dz_stay'); return !!data; }
