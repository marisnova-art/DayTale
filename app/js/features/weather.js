/* 날씨: 서버 함수 weather → MET Norway. 위치 권한은 쓰지 않고, 도시는 시간대에서 고르거나 설정에서 바꿔요. */
import { CFG } from '../core/config.js';
import { ls } from '../core/utils.js';
import { cityLookup, guessCity } from '../data/cities.js';
import { S, emit } from '../data/store.js';
import { getSupabase } from '../data/supabase.js';

const Weather = {
  busy: false,
  cityId() { return S.prefs.city || guessCity(); },
  city() { return cityLookup(this.cityId()); },
  /* { kind, icon, temp, max, min, city, cityId, at } 3시간 지나면 버려요 */
  current() {
    const w = ls.get('daytale.wx', null), c = this.city();
    if (!w || !c || w.cityId !== c.id || Date.now() - w.at > 3 * 3600e3) return null;
    return { ...w, city: c.name };
  },
  async refresh({ force = false } = {}) {
    const c = this.city(); if (!c || this.busy || !navigator.onLine) return this.current();
    const w = ls.get('daytale.wx', null);
    if (!force && w && w.cityId === c.id && Date.now() - w.at < 45 * 60e3) return this.current();
    this.busy = true;
    try {
      const sb = await getSupabase(); const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${CFG.SUPABASE_URL}/functions/v1/weather?lat=${c.lat}&lon=${c.lon}`, { headers: { apikey: CFG.SUPABASE_ANON_KEY, authorization: 'Bearer ' + (session?.access_token || CFG.SUPABASE_ANON_KEY) } });
      if (!r.ok) throw new Error('weather ' + r.status);
      const j = await r.json();
      ls.set('daytale.wx', { kind: j.kind, icon: j.night && j.kind === 'sun' ? 'moon' : j.kind, temp: j.temp, max: j.max, min: j.min, cityId: c.id, at: Date.now() });
      emit('weather');
    } catch (e) { console.warn(e); }
    finally { this.busy = false; }
    return this.current();
  }
};

export { Weather };
