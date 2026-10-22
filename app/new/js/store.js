// 1차: 카드는 이 기기에만 저장해요 (계정 연결은 3차). 지금 서비스 데이터와 섞이지 않게 키 이름을 따로 써요
const K_CARDS = 'dz.cards.v1', K_DRAFT = 'dz.draft.v1', K_PREF = 'dz.pref.v1';

const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function cards() { return read(K_CARDS, []).sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created)); }
export function card(id) { return read(K_CARDS, []).find(c => c.id === id) || null; }
export function saveCard(c) {
  const all = read(K_CARDS, []), i = all.findIndex(x => x.id === c.id);
  c.updated = new Date().toISOString();
  if (i < 0) all.push(c); else all[i] = c;
  return write(K_CARDS, all);
}
export function removeCard(id) { write(K_CARDS, read(K_CARDS, []).filter(c => c.id !== id)); }

export const draft = () => read(K_DRAFT, null);
export const saveDraft = d => write(K_DRAFT, d);
export const clearDraft = () => { try { localStorage.removeItem(K_DRAFT); } catch {} };

export const pref = (k, d) => (read(K_PREF, {})[k] ?? d);
export const setPref = (k, v) => { const p = read(K_PREF, {}); p[k] = v; write(K_PREF, p); };
