/* 로컬 우선 동기화: 버전 확인 쓰기, 충돌 사본, 삭제 표시(tombstone), 가져오기 커서 */
import { DEFAULT_PREFS, S, displayTitle, emit } from './store.js';
import { sanitizeHTML } from '../core/sanitize.js';
import { ls, nowISO, uid } from '../core/utils.js';

const COLS = 'id,type,title,content,content_text,folder_id,tags,favorite,pinned,meta,photos,created_at,client_updated_at,deleted_at,version,updated_at';
const FCOLS = 'id,name,color,sort,created_at,client_updated_at,version,updated_at';
const toRow = e => ({ id: e.id, type: e.type, title: e.title, content: e.content, content_text: e.text, folder_id: e.folder_id || null, tags: e.tags, favorite: e.favorite,
  pinned: e.pinned, meta: e.meta, photos: e.photos || [], created_at: e.created_at, client_updated_at: e.updated_at, deleted_at: e.deleted_at });
const fromRow = r => ({ id: r.id, type: r.type, title: r.title || '', content: sanitizeHTML(r.content || ''), text: r.content_text || '', folder_id: r.folder_id, tags: r.tags || [],
  favorite: !!r.favorite, pinned: !!r.pinned, meta: r.meta || {}, photos: r.photos || [], created_at: r.created_at, updated_at: r.client_updated_at || r.updated_at,
  deleted_at: r.deleted_at, _sv: r.version, _dirty: false });
const fToRow = f => ({ id: f.id, name: f.name, color: f.color, sort: f.sort || 0, created_at: f.created_at, client_updated_at: f.updated_at });
const fFromRow = r => ({ id: r.id, name: r.name, color: r.color, sort: r.sort, created_at: r.created_at, updated_at: r.client_updated_at || r.updated_at, _sv: r.version, _dirty: false });
const locked = err => err && (err.code === 'P0001' || /write_locked/.test(err.message || ''));

const Sync = {
  sb: null, timer: null, prefsTimer: null, running: false, again: false, lastError: null,
  set(state) { S.sync = state; emit('sync'); },
  schedule(ms = 1200) { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), ms); },
  schedulePrefs() { clearTimeout(this.prefsTimer); this.prefsTimer = setTimeout(() => this.pushPrefs(), 1500); },
  async run() {
    if (!this.sb || !S.user) return;
    if (!navigator.onLine) { this.set('offline'); return; }
    if (this.running) { this.again = true; return; }
    this.running = true; this.set('syncing');
    try {
      await this.pushDeletes();
      await this.pushFolders();
      await this.pushEntries();
      await this.pull();
      S.lastSyncAt = nowISO(); await S.db.set('lastSyncAt', S.lastSyncAt);
      this.set([...S.entries.values()].some(e => e._dirty) ? 'pending' : 'synced');
    } catch (err) {
      console.warn('sync failed', err);
      this.lastError = err?.message || String(err);
      if (locked(err)) { S.canWrite = false; emit('locked'); this.set('pending'); }
      else this.set(navigator.onLine ? 'error' : 'offline');
      if (/JWT|token/i.test(this.lastError)) await this.sb.auth.refreshSession().catch(() => {});
    } finally {
      this.running = false;
      if (this.again) { this.again = false; this.schedule(400); }
    }
  },
  async pushDeletes() {
    const pend = await S.db.get('pendingDeletes', []); if (!pend.length) return;
    for (const table of ['entries', 'folders']) {
      const ids = pend.filter(p => p.table === table).map(p => p.id);
      for (let i = 0; i < ids.length; i += 200) {
        // 기록은 서버에서도 휴지통에 있거나, 이 기기가 마지막으로 본 뒤 아무도 안 고쳤을 때만 지워요
        // (다른 기기에서 되살리거나 고친 기록은 남겨요)
        let q = this.sb.from(table).delete().in('id', ids.slice(i, i + 200)); if (table === 'entries') q = q.not('deleted_at', 'is', null);
        const { error } = await q; if (error) throw error;
      }
      if (table === 'entries') for (const p of pend.filter(p => p.table === 'entries' && p.sv != null)) {
        const { error } = await this.sb.from('entries').delete().eq('id', p.id).lt('version', p.sv + 1); if (error) throw error;
      }
    }
    await S.db.set('pendingDeletes', []);
  },
  async pushFolders() {
    for (const f of [...S.folders.values()].filter(f => f._dirty)) {
      const q = f._sv == null ? this.sb.from('folders').upsert(fToRow(f), { onConflict: 'id' }) : this.sb.from('folders').update(fToRow(f)).eq('id', f.id);
      const { data, error } = await q.select('version');
      if (error) throw error;
      f._sv = data[0]?.version ?? f._sv; f._dirty = false; await S.db.put('folders', f);  // 폴더는 마지막 저장이 이겨요
    }
  },
  async pushEntries() {
    const dirty = [...S.entries.values()].filter(e => e._dirty);
    const fresh = dirty.filter(e => e._sv == null), upd = dirty.filter(e => e._sv != null);
    for (let i = 0; i < fresh.length; i += 100) {
      const chunk = fresh.slice(i, i + 100); const stamps = new Map(chunk.map(e => [e.id, e.updated_at]));
      const { data, error } = await this.sb.from('entries').insert(chunk.map(toRow)).select('id,version');
      if (error) {
        if (error.code === '23505') { for (const e of chunk) await this.pushOne(e); continue; }
        if (/limit/i.test(error.message)) emit('quota');
        throw error;
      }
      const vm = new Map(data.map(r => [r.id, r.version]));
      chunk.forEach(e => { if (vm.has(e.id)) { e._sv = vm.get(e.id); if (S.entries.get(e.id) === e && e.updated_at === stamps.get(e.id)) e._dirty = false; } });
      await S.db.putMany('entries', chunk);
    }
    for (const e of upd) await this.pushOne(e);
  },
  async pushOne(e) {
    const stamp = e.updated_at;
    if (e._sv == null) {
      const { data: ex } = await this.sb.from('entries').select(COLS).eq('id', e.id).maybeSingle();
      if (ex) { await this.conflict(e, ex); return; }
      const { data, error } = await this.sb.from('entries').insert(toRow(e)).select('version').single();
      if (error) throw error; e._sv = data.version;
    } else {
      const { data, error } = await this.sb.from('entries').update(toRow(e)).eq('id', e.id).eq('version', e._sv).select('version');
      if (error) throw error;
      if (!data.length) {
        const { data: ex, error: e2 } = await this.sb.from('entries').select(COLS).eq('id', e.id).maybeSingle();
        if (e2) throw e2;
        if (!ex) { e._sv = null; return this.pushOne(e); }   // 다른 기기에서 지움 → 이 기기 작업은 살려요
        await this.conflict(e, ex); return;
      }
      e._sv = data[0].version;
    }
    if (e.updated_at === stamp) e._dirty = false;
    await S.db.put('entries', e);
  },
  /* 조용히 덮어쓰지 않아요: 서버 내용이 원래 id를, 이 기기 수정은 사본으로 남겨요 */
  async conflict(local, row) {
    const server = fromRow(row);
    const same = server.title === local.title && server.content === local.content && JSON.stringify(server.meta) === JSON.stringify(local.meta) && JSON.stringify(server.photos) === JSON.stringify(local.photos);
    if (same) { Object.assign(local, { _sv: server._sv, _dirty: false }); await S.db.put('entries', local); return; }
    const copy = Object.assign(structuredClone(local), { id: uid(), _sv: null, _dirty: true, photos: (local.photos || []).filter(p => !(server.photos || []).some(x => x.id === p.id)), created_at: nowISO(), title: (local.title || displayTitle(local)) + ' ' + this.suffix });
    S.entries.set(server.id, server); S.entries.set(copy.id, copy);
    await S.db.putMany('entries', [server, copy]);
    this.again = true;
    emit({ type: 'external', id: server.id }); emit({ type: 'conflict', id: copy.id }); emit('entries');
  },
  suffix: '(사본)',
  async pull() {
    let cursor = await S.db.get('pullCursor', '1970-01-01T00:00:00Z');
    let maxCur = cursor, changed = false;
    const { data: fs, error: fe } = await this.sb.from('folders').select(FCOLS).gt('updated_at', cursor);
    if (fe) throw fe;
    const fput = [];
    fs.forEach(r => { const l = S.folders.get(r.id); if (l?._dirty) return; const f = fFromRow(r); S.folders.set(f.id, f); fput.push(f); if (r.updated_at > maxCur) maxCur = r.updated_at; });
    await S.db.putMany('folders', fput); changed = fput.length > 0;
    let since = new Date(new Date(cursor).getTime() - 10000).toISOString();   // 늦게 커밋된 줄 대비 10초 겹침
    for (let page = 0; page < 200; page++) {
      const { data, error } = await this.sb.from('entries').select(COLS).gt('updated_at', since).order('updated_at', { ascending: true }).limit(500);
      if (error) throw error;
      if (!data.length) break;
      const put = [];
      for (const r of data) {
        const l = S.entries.get(r.id);
        if (l?._dirty) { if (l._sv !== r.version) await this.conflict(l, r); continue; }
        if (l && l._sv === r.version) continue;
        const e = fromRow(r); S.entries.set(e.id, e); put.push(e); emit({ type: 'external', id: e.id });
      }
      await S.db.putMany('entries', put); changed ||= put.length > 0;
      since = data[data.length - 1].updated_at; if (since > maxCur) maxCur = since;
      if (data.length < 500) break;
    }
    const tombSince = await S.db.get('tombCursor', '1970-01-01T00:00:00Z');
    const { data: tomb, error: te } = await this.sb.from('deleted_records').select('record_id,table_name,deleted_at').gt('deleted_at', tombSince).order('deleted_at').limit(5000);
    if (te) throw te;
    if (tomb.length) {
      const eIds = tomb.filter(x => x.table_name === 'entries').map(x => x.record_id).filter(id => S.entries.has(id) && !S.entries.get(id)._dirty);
      const fIds = tomb.filter(x => x.table_name === 'folders').map(x => x.record_id).filter(id => S.folders.has(id));
      eIds.forEach(id => S.entries.delete(id)); fIds.forEach(id => S.folders.delete(id));
      await S.db.delMany('entries', eIds); await S.db.delMany('folders', fIds);
      await S.db.set('tombCursor', tomb[tomb.length - 1].deleted_at); changed ||= eIds.length + fIds.length > 0;
    }
    await S.db.set('pullCursor', maxCur);
    if (changed) { emit('entries'); emit('folders'); }
  },
  async pullPrefs() {
    const { data, error } = await this.sb.from('user_settings').select('prefs,updated_at').maybeSingle();
    if (error || !data) return false;
    const localAt = await S.db.get('prefsAt', '1970');
    if (data.updated_at > localAt && data.prefs) { Object.assign(S.prefs, DEFAULT_PREFS, data.prefs); ls.set('daytale.prefs', S.prefs); emit('prefs'); return true; }
    return false;
  },
  async pushPrefs() {
    if (!this.sb || !S.user || !navigator.onLine) return;
    const at = nowISO(); await S.db.set('prefsAt', at);
    const { error } = await this.sb.from('user_settings').upsert({ user_id: S.user.id, prefs: S.prefs, updated_at: at }, { onConflict: 'user_id' });
    if (error) console.warn('prefs sync', error);
  }
};

export { Sync };
