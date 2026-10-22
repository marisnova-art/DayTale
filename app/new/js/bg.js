// 글포맷 배경: 무료(그라데이션·단색) / 유료 '배경'(작품 이미지·코드 배경). 딤은 배경마다 우리가 정해 둬요
// dim: [방식 all|center|bottom, 어두운 딤 색, 세기], ink = 딤 없이 쓰는 글색
export const FREE = [
  { id: 'g1', css: 'linear-gradient(160deg,#f6a5c0 0%,#b48cf2 48%,#6a7ff0 100%)', ink: '#fff', dim: ['all', '40,16,70', .22] },
  { id: 'g2', css: 'linear-gradient(160deg,#ffd29d 0%,#f17a7a 100%)', ink: '#fff', dim: ['all', '90,30,30', .2] },
  { id: 'g3', css: 'linear-gradient(160deg,#a8e6cf 0%,#3d84a8 100%)', ink: '#fff', dim: ['all', '10,40,60', .22] },
  { id: 'g4', css: 'linear-gradient(160deg,#fbc2eb 0%,#a6c1ee 100%)', ink: '#2a2440', dim: ['all', '40,30,80', .25] },
  { id: 'g5', css: 'linear-gradient(160deg,#2b2d5e 0%,#7a4f9e 100%)', ink: '#fff', dim: ['all', '10,10,30', .2] },
  { id: 'g6', css: 'linear-gradient(170deg,#ffecd2 0%,#fcb69f 100%)', ink: '#4a2a1e', dim: ['all', '80,40,20', .25] },
  { id: 'g7', css: 'linear-gradient(160deg,#0f3d3e 0%,#c9a96e 100%)', ink: '#fff', dim: ['all', '5,25,25', .25] },
  { id: 'g8', css: 'linear-gradient(160deg,#1d2b4f 0%,#5c3b6e 60%,#e0807a 100%)', ink: '#fff', dim: ['all', '10,10,30', .2] },
  { id: 's1', css: '#E8DCC8', ink: '#2E2A24', dim: ['all', '40,30,20', .2] },
  { id: 's2', css: '#2E3B33', ink: '#F1EADB', dim: ['all', '0,0,0', .2] },
  { id: 's3', css: '#F2E1E4', ink: '#3A2A2E', dim: ['all', '60,30,40', .2] },
  { id: 's4', css: '#1C1C1F', ink: '#EDEBE6', dim: ['all', '0,0,0', .2] },
];

export const PAID = [
  { id: 'haze', img: './bg/haze.webp', ink: '#F3ECE0', dim: ['all', '10,30,22', .55] },
  { id: 'stars', img: './bg/stars.webp', ink: '#F3E6C8', dim: ['center', '0,0,0', .55] },
  { id: 'bands', code: 'bands', ink: '#fff', dim: ['center', '40,16,70', .55] },
];

export const find = id => FREE.find(b => b.id === id) || PAID.find(b => b.id === id) || FREE[0];
export const isPaid = id => PAID.some(b => b.id === id);

// 사용자가 고르는 건 '밝게 / 어둡게' 하나뿐이에요
export function dimCss(b, mode) {
  if (mode === 'light') return { layer: 'rgba(255,255,255,.5)', ink: '#26231E' };
  const [kind, rgb, a] = b.dim;
  const c = x => `rgba(${rgb},${x})`;
  const layer = kind === 'center' ? `radial-gradient(ellipse at center, ${c(a)} 0%, ${c(a * .6)} 45%, ${c(0)} 78%)`
    : kind === 'bottom' ? `linear-gradient(to bottom, ${c(0)} 30%, ${c(a * 1.3)} 80%)` : c(a);
  return { layer, ink: b.ink };
}

// 코드 배경: 씨앗 번호가 같으면 늘 같은 모양이에요
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PAL = ['#3fd35a', '#ff4d6d', '#ff6ad5', '#8a5cff', '#e8d84a', '#ff8a3d', '#6ec8ff', '#c9a8ff', '#ff3fa0', '#4b6bff'];

export function drawCode(cv, seed, shift = 0) {
  const W = cv.width, H = cv.height, c = cv.getContext('2d'), r = rng(seed);
  // 9:16 원본을 그린 뒤 카드(4:5)에 맞게 위아래를 잘라 써요. shift(0~1)로 장마다 보이는 부분이 옮겨가요
  const full = Math.round(W * 16 / 9), off = Math.round((full - H) * shift);
  const tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.round(W / 4)); tmp.height = Math.max(1, Math.round(full / 4));
  const t = tmp.getContext('2d'), w = tmp.width, h = tmp.height;
  t.fillStyle = '#c48bff'; t.fillRect(0, 0, w, h);
  const n = 16 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const y = (i + r() * .8) / n * h, x = r() * w;
    t.filter = `blur(${Math.max(1, Math.round(w * .05))}px)`; t.globalAlpha = .75 + r() * .25;
    t.fillStyle = PAL[Math.floor(r() * PAL.length)];
    t.beginPath(); t.ellipse(x, y, w * (.35 + r() * .75), h * (.025 + r() * .045), (r() - .5) * .08, 0, 7); t.fill();
  }
  t.globalAlpha = 1; t.filter = `blur(${Math.max(1, Math.round(w * .025))}px)`; t.drawImage(tmp, 0, 0); t.filter = 'none';
  c.imageSmoothingQuality = 'high';
  c.drawImage(tmp, 0, off / 4, w, H / 4, 0, 0, W, H);
  // 옅은 그레인
  const d = c.getImageData(0, 0, W, H), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const g = (r() - .5) * 12; p[i] += g; p[i + 1] += g; p[i + 2] += g; }
  c.putImageData(d, 0, 0);
}
