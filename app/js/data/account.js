/* 계정 상태: 체험·구독·쓰기 가능 여부, 프로필, 접속 표시 */
import { S, emit } from './store.js';
import { Sync } from './sync.js';
import { esc, ls, todayKey } from '../core/utils.js';
import { t } from '../core/i18n.js';
import { Install } from '../features/install.js';

/* ---------- 회원 구성 통계 (합계만 봐요): 기기 종류 · 처음 어디서 왔는지 ----------
   기록 내용, IP, 기기 고유값은 쓰지 않아요. 정해진 짧은 값만 계정에 적어요. */
const SRC_KEY = 'daytale.src';
const SRC_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'lp', 'rf', 'ref'];
const slug = (v, n) => String(v || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[^a-z0-9]+/, '').slice(0, n).replace(/[-.]+$/, '') || null;
const SEARCH = { google: 1, bing: 1, duckduckgo: 1, yahoo: 1, naver: 1, daum: 1, baidu: 1, yandex: 1, ecosia: 1, brave: 1 };
const HOSTS = [[/(^|\.)gemini\.google\./, 'gemini'], [/(^|\.)google\./, 'google'], [/(^|\.)bing\.com$/, 'bing'], [/duckduckgo\.com$/, 'duckduckgo'], [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)naver\.(com|me)$/, 'naver'], [/(^|\.)daum\.net$/, 'daum'], [/(^|\.)baidu\.com$/, 'baidu'], [/(^|\.)yandex\./, 'yandex'], [/ecosia\.org$/, 'ecosia'], [/search\.brave\.com$/, 'brave'],
  [/(^|\.)instagram\.com$/, 'instagram'], [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'], [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'x'], [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)reddit\.com$/, 'reddit'], [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'], [/(^|\.)tiktok\.com$/, 'tiktok'], [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin'],
  [/(^|\.)pinterest\./, 'pinterest'], [/(^|\.)kakao\.com$/, 'kakaotalk'], [/(^|\.)line\.me$/, 'line'], [/(^|\.)band\.us$/, 'band'],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, 'chatgpt'], [/(^|\.)perplexity\.ai$/, 'perplexity'], [/(^|\.)claude\.ai$/, 'claude']];
const SOCIAL = new Set(['instagram', 'facebook', 'x', 'threads', 'reddit', 'youtube', 'tiktok', 'linkedin', 'pinterest', 'kakaotalk', 'line', 'band']);
const INAPP = [[/Instagram/, 'instagram'], [/FBAN|FBAV/, 'facebook'], [/KAKAOTALK/, 'kakaotalk'], [/Line\//, 'line'], [/NAVER/, 'naver'], [/DaumApps/, 'daum'], [/everytimeApp/, 'everytime']];
/* 참조 주소 → 짧은 이름 (google, instagram …) 또는 도메인 (example.com) */
function hostSource(host) {
  host = String(host || '').toLowerCase().replace(/^(www|m|l|lm|mobile)\./, '');
  if (!host) return null;
  for (const [re, k] of HOSTS) if (re.test(host)) return k;
  const p = host.split('.'), n = p.length > 2 && p[p.length - 1].length === 2 && /^(co|com|or|ne|ac|go|net|org)$/.test(p[p.length - 2]) ? 3 : 2;
  return slug(p.slice(-n).join('.'), 40);
}
/* 처음 연 순간의 정보 (원래 값 그대로, 계정에 적을 때 정리해요). 소개 페이지(site/src.js)도 같은 모양으로 적어요 */
function captureFirstTouch() {
  let q; try { q = new URLSearchParams(location.search); } catch { return; }
  if (!ls.get(SRC_KEY, null)) {
    const legacy = !!(ls.get('daytale.lastUser', null) || ls.get('daytale.seen', null));   // 이 기능 전부터 쓰던 기기: 모르는 채로 둬요
    let r = q.get('rf') || '';
    try { const ref = document.referrer && new URL(document.referrer); if (!r && ref && ref.host !== location.host) r = ref.hostname; } catch {}
    if (!r) r = (INAPP.find(([re]) => re.test(navigator.userAgent)) || [])[1] || '';
    ls.set(SRC_KEY, legacy ? { legacy: 1 } : { s: q.get('utm_source') || '', m: q.get('utm_medium') || '', c: q.get('utm_campaign') || '', ref: q.get('ref') || '',
      r: String(r).slice(0, 100), l: /^[a-z]{2}$/.test(q.get('lp') || '') ? '/' + q.get('lp') : 'app', at: Date.now() });
  }
  // 주소창에서 유입 표시는 지워요 (공유하기·새로고침해도 다시 세지 않게)
  if (SRC_PARAMS.some(k => q.has(k))) { SRC_PARAMS.forEach(k => q.delete(k)); const qs = q.toString(); try { history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch {} }
}
/* 저장해 둔 처음 정보 → 계정 칸 (정해진 값만) */
function firstTouch() {
  const x = ls.get(SRC_KEY, null); if (!x || x.legacy) return null;
  const host = hostSource(x.r), ref = slug(x.ref, 40);
  const source = slug(x.s, 40) || ref || host || 'direct';
  const medium = slug(x.m, 40) || (x.s ? null : ref ? 'referral' : host ? (SEARCH[host] ? 'organic' : SOCIAL.has(host) ? 'social' : 'referral') : null);
  return { first_source: source, first_medium: medium, first_campaign: slug(x.c, 60), first_landing: /^\/[a-z]{2}$/.test(x.l || '') ? x.l : 'app' };
}
/* 지금 기기: 운영체제 · 폰/태블릿/컴퓨터 · 브라우저 계열 · 홈 화면 앱으로 열었는지 */
function device() {
  const ua = navigator.userAgent || '', P = Install.Platform;
  const platform = P.ios() ? 'ios' : P.android() ? 'android' : /CrOS/.test(ua) ? 'chromeos' : /Windows/.test(ua) ? 'windows' : /Macintosh|Mac OS X/.test(ua) ? 'mac' : /Linux|X11/.test(ua) ? 'linux' : 'other';
  const device_kind = platform === 'ios' ? (/iPhone|iPod/.test(ua) ? 'phone' : 'tablet') : platform === 'android' ? (/Mobile/.test(ua) ? 'phone' : 'tablet') : navigator.userAgentData?.mobile ? 'phone' : 'desktop';
  const browser = P.inApp() ? 'inapp' : /Edg(e|A|iOS)?\//.test(ua) ? 'edge' : /OPR\/|Opera/.test(ua) ? 'opera' : /SamsungBrowser/.test(ua) ? 'samsung' : /Firefox|FxiOS/.test(ua) ? 'firefox' : /CriOS|Chrome|Chromium/.test(ua) ? 'chrome' : /Safari/.test(ua) ? 'safari' : 'other';
  return { platform, device_kind, browser, installed: !!P.standalone() };
}

const AUD = 'platform,device_kind,browser,installed,first_source';
const Account = {
  profile: null,
  async load() {
    const sb = Sync.sb; if (!sb || !S.user) return;
    const cols = 'display_name,lang,country,timezone,created_at';
    let [st, pr] = await Promise.all([sb.rpc('my_status'), sb.from('profiles').select(cols + ',avatar,alts,' + AUD).maybeSingle()]);
    if (pr.error) pr = await sb.from('profiles').select(cols + ',avatar,' + AUD).maybeSingle();   // 서버에 '다른 모습' 칸이 아직 없을 때
    if (pr.error) pr = await sb.from('profiles').select(cols + ',avatar').maybeSingle();   // 서버에 회원 구성 칸이 아직 없을 때
    if (pr.error) pr = await sb.from('profiles').select(cols).maybeSingle();   // 서버에 사진 칸이 아직 없을 때
    if (!st.error && st.data) { S.status = st.data; ls.set('daytale.status.' + S.user.id, st.data); }
    if (!pr.error && pr.data) this.profile = pr.data;
    this.apply();
    // 하루 한 번 접속 표시 (1년 미접속 정리 기준) + 기기 시간대·나라 맞추기
    if (ls.get('daytale.seen') !== todayKey()) { ls.set('daytale.seen', todayKey()); sb.rpc('touch_seen').then(() => {}, () => {}); this.syncLocale(); this.syncDevice(); }
    this.syncFirstTouch();
  },
  captureFirstTouch, firstTouch, device, hostSource,
  /* 처음 온 곳: 계정에 비어 있을 때 한 번만 (서버도 한 번 적힌 값은 바꾸지 않아요) */
  syncFirstTouch() {
    const p = this.profile; if (!p || !('first_source' in p) || p.first_source) return;
    const f = firstTouch(); if (f) this.update(f);
  },
  /* 기기: 하루 한 번, 바뀌었을 때만 */
  syncDevice() {
    const p = this.profile; if (!p || !('platform' in p)) return;
    const d = device(); if (Object.keys(d).some(k => p[k] !== d[k])) this.update({ ...d, device_at: new Date().toISOString() });
  },
  restore() { if (S.user) { S.status = ls.get('daytale.status.' + S.user.id, null); this.apply(); } },
  apply() { S.canWrite = S.status ? !!S.status.can_write : true; emit('account'); },
  /* 체험 남은 날(올림). 구독 중이면 null */
  trialDays() {
    if (!S.status || S.status.subscriber) return null;
    return Math.max(0, Math.ceil((new Date(S.status.trial_ends_at) - Date.now()) / 864e5));
  },
  /* 지금 무료 이용이 이용권 덕분인지 (이용권 끝 = 무료 이용 끝) */
  onPass() { const st = S.status; return !!st?.pass_until && !st.subscriber && new Date(st.pass_until) >= new Date(st.trial_ends_at); },
  /* 남은 날 문구: 무료 체험 n일 / 이용권 n일 (n은 그대로 넣어 HTML로 감쌀 수 있게) */
  leftText(n) { return this.onPass() ? t('pass.left', { n }) : t('trial.left', { n }); },
  trialRatio() { const d = this.trialDays(); return d == null || this.onPass() ? 1 : Math.max(0, Math.min(1, d / 30)); },
  /* 다른 모습(최대 2개): 기본 모습과 함께 하루씩 돌아가며 보여요. 비운 칸은 기본 값을 써요 */
  alts() { const a = this.profile?.alts; return Array.isArray(a) ? a.filter(x => x && (x.n || x.a)).slice(0, 2) : []; },
  look() {
    const list = this.alts(); if (!list.length) return null;
    const d = new Date(), day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    const i = day % (list.length + 1); return i ? list[i - 1] : null;
  },
  name(o = {}) { const b = this.profile?.display_name || (S.user?.email || '').split('@')[0]; return (!o.base && this.look()?.n) || b; },
  initial(o) { return (this.name(o) || '·').trim().charAt(0).toUpperCase(); },
  /* 프로필 사진: 직접 넣은 사진 → Google 사진 → 없으면 첫 글자 */
  avatar(o = {}) { const b = this.profile?.avatar || S.user?.picture || ''; return (!o.base && this.look()?.a) || b; },
  avatarHTML(cls = '', o) { const a = this.avatar(o), ini = this.initial(o); return `<span class="avatar${cls ? ' ' + cls : ''}">${a ? `<img src="${esc(a)}" alt="" referrerpolicy="no-referrer">` : esc(ini)}</span>`; },
  /* 고른 사진을 가운데 정사각형으로 잘라 256px로 줄여요 (약 10KB, 사진 저장소 없이 계정 정보에 저장) */
  async photoFrom(file) {
    const bmp = await createImageBitmap(file); const s = Math.min(bmp.width, bmp.height), N = 256;
    const c = document.createElement('canvas'); c.width = c.height = N;
    c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, N, N); bmp.close?.();
    let url = c.toDataURL('image/webp', .82); if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', .85);
    return url;
  },
  async update(fields) { const { error } = await Sync.sb.from('profiles').update(fields).eq('id', S.user.id); if (!error) Object.assign(this.profile ||= {}, fields); emit('account'); return !error; },
  /* 언어는 기기에서, 나라는 시간대에서 짐작해요 (가격·날씨·명절·통계용). IP는 쓰지 않아요. */
  syncLocale() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    const region = (navigator.language || '').split('-')[1];
    const fields = { timezone: tz };
    if (/^[A-Z]{2}$/.test(region || '')) fields.country = region;
    if (this.profile && (this.profile.timezone !== tz || (fields.country && this.profile.country !== fields.country))) this.update(fields);
  }
};

export { Account };
