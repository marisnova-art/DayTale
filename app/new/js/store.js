// 1차: 카드는 이 기기에만 저장해요 (계정 연결은 3차). 지금 서비스 데이터와 섞이지 않게 키 이름을 따로 써요
const K_CARDS = 'dz.cards.v1', K_DRAFT = 'dz.draft.v1', K_PREF = 'dz.pref.v1', K_TRASH = 'dz.trash.v1';

const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function cards() { return read(K_CARDS, []).sort((a, b) => (b.created || b.date).localeCompare(a.created || a.date)); }   // 쓴 순서(최근이 위)
export function card(id) { return read(K_CARDS, []).find(c => c.id === id) || null; }
export function saveCard(c) {
  const all = read(K_CARDS, []), i = all.findIndex(x => x.id === c.id);
  c.updated = new Date().toISOString();
  if (i < 0) all.push(c); else all[i] = c;
  return write(K_CARDS, all);
}
// 지운 카드는 휴지통에 30일 동안 두었다가 없애요 (휴지통 화면에서 되살려요)
const DAY = 864e5;
export function removeCard(id) {
  const all = read(K_CARDS, []), c = all.find(x => x.id === id); if (!c) return;
  write(K_TRASH, [{ ...c, deleted: new Date().toISOString() }, ...trash()]);
  write(K_CARDS, all.filter(x => x.id !== id));
}
export function trash() {
  const all = read(K_TRASH, []), keep = all.filter(c => Date.now() - Date.parse(c.deleted) < 30 * DAY);
  if (keep.length !== all.length) write(K_TRASH, keep);
  return keep;
}
export function restoreCard(id) {
  const c = trash().find(x => x.id === id); if (!c) return null;
  delete c.deleted; write(K_TRASH, trash().filter(x => x.id !== id)); saveCard(c); return c;
}

export const draft = () => read(K_DRAFT, null);
export const saveDraft = d => write(K_DRAFT, d);
export const clearDraft = () => { try { localStorage.removeItem(K_DRAFT); } catch {} };

export const pref = (k, d) => (read(K_PREF, {})[k] ?? d);
export const setPref = (k, v) => { const p = read(K_PREF, {}); p[k] = v; write(K_PREF, p); };

// 책: 내가 만든 책만 저장해요 (올해 · 지난해 · 책갈피 책은 카드에서 바로 계산). 카드는 책에 넣어도 한 장 그대로, 책은 id만 가져요
const K_BOOKS = 'dz.books.v1';
export const books = () => read(K_BOOKS, []).sort((a, b) => b.created.localeCompare(a.created));   // 최근에 만든 책이 위
export const book = id => read(K_BOOKS, []).find(b => b.id === id) || null;
export function saveBook(b) {
  const all = read(K_BOOKS, []), i = all.findIndex(x => x.id === b.id);
  if (i < 0) all.push(b); else all[i] = b;
  return write(K_BOOKS, all);
}
export const removeBook = id => write(K_BOOKS, read(K_BOOKS, []).filter(b => b.id !== id));

// 휴지통에서 바로 지우기 · 모두 비우기
export const purge = id => write(K_TRASH, trash().filter(c => c.id !== id));
export const emptyTrash = () => write(K_TRASH, []);

// 백업 파일: 카드 · 책 · 설정 (휴지통은 빼요). 되살리기는 이미 있는 카드는 두고 없는 것만 더해요
export const dump = () => ({ cards: read(K_CARDS, []), books: read(K_BOOKS, []), prefs: read(K_PREF, {}) });
export function merge(d) {
  const cs = read(K_CARDS, []), have = new Set(cs.map(c => c.id)), add = (d.cards || []).filter(c => c?.id && !have.has(c.id));
  write(K_CARDS, [...cs, ...add]);
  const bs = read(K_BOOKS, []), hb = new Set(bs.map(b => b.id));
  write(K_BOOKS, [...bs, ...(d.books || []).filter(b => b?.id && !hb.has(b.id))]);
  if (d.prefs && !Object.keys(read(K_PREF, {})).length) write(K_PREF, d.prefs);
  return add.length;
}
