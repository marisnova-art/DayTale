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
