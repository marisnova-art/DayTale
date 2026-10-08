/* 계정 상태: 체험·구독·쓰기 가능 여부, 프로필, 접속 표시 */
import { S, emit } from './store.js';
import { Sync } from './sync.js';
import { esc, ls, todayKey } from '../core/utils.js';

const Account = {
  profile: null,
  async load() {
    const sb = Sync.sb; if (!sb || !S.user) return;
    const cols = 'display_name,lang,country,timezone,created_at';
    let [st, pr] = await Promise.all([sb.rpc('my_status'), sb.from('profiles').select(cols + ',avatar').maybeSingle()]);
    if (pr.error) pr = await sb.from('profiles').select(cols).maybeSingle();   // 서버에 사진 칸이 아직 없을 때
    if (!st.error && st.data) { S.status = st.data; ls.set('daytale.status.' + S.user.id, st.data); }
    if (!pr.error && pr.data) this.profile = pr.data;
    this.apply();
    // 하루 한 번 접속 표시 (1년 미접속 정리 기준) + 기기 시간대·나라 맞추기
    if (ls.get('daytale.seen') !== todayKey()) { ls.set('daytale.seen', todayKey()); sb.rpc('touch_seen').then(() => {}, () => {}); this.syncLocale(); }
  },
  restore() { if (S.user) { S.status = ls.get('daytale.status.' + S.user.id, null); this.apply(); } },
  apply() { S.canWrite = S.status ? !!S.status.can_write : true; emit('account'); },
  /* 체험 남은 날(올림). 구독 중이면 null */
  trialDays() {
    if (!S.status || S.status.subscriber) return null;
    return Math.max(0, Math.ceil((new Date(S.status.trial_ends_at) - Date.now()) / 864e5));
  },
  trialRatio() { const d = this.trialDays(); return d == null ? 1 : Math.max(0, Math.min(1, d / 30)); },
  name() { return this.profile?.display_name || (S.user?.email || '').split('@')[0]; },
  initial() { return (this.name() || '·').trim().charAt(0).toUpperCase(); },
  /* 프로필 사진: 직접 넣은 사진 → Google 사진 → 없으면 첫 글자 */
  avatar() { return this.profile?.avatar || S.user?.picture || ''; },
  avatarHTML(cls = '') { const a = this.avatar(); return `<span class="avatar${cls ? ' ' + cls : ''}">${a ? `<img src="${esc(a)}" alt="" referrerpolicy="no-referrer">` : esc(this.initial())}</span>`; },
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
