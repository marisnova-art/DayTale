/* Supabase 연결 (라이브러리는 앱 안에 들어 있어요: vendor/supabase.js, MIT) */
import { CFG } from '../core/config.js';

let client = null;
const configured = () => /^https:\/\/.+/.test(CFG.SUPABASE_URL) && CFG.SUPABASE_ANON_KEY.length > 20;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); }); }
async function getSupabase() {
  if (client) return client;
  if (!configured()) return null;
  if (!window.supabase) await loadScript('./vendor/supabase.js');
  client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: 'daytale.auth' }
  });
  return client;
}
/* 이 기기에서 확실히 로그아웃: 서버 호출이 실패해도 저장된 세션을 지워요. */
async function endSession() {
  const sb = await getSupabase().catch(() => null);
  const cap = p => Promise.race([p.catch(() => {}), new Promise(r => setTimeout(r, 4000))]);
  if (sb) { await cap(sb.auth.signOut()); await cap(sb.auth.signOut({ scope: 'local' })); }
  try { Object.keys(localStorage).filter(k => k.startsWith('daytale.auth')).forEach(k => localStorage.removeItem(k)); } catch {}
}

export { configured, endSession, getSupabase };
