// 글포맷 글꼴 20가지 (모두 SIL Open Font License 1.1, 우리 서버에 둠). 명조 → 고딕 → 손글씨 → 개성 순서로, 글꼴 단추를 누를 때마다 이 순서로 바뀌어요
// file = 저장 이미지에 넣을 때 읽는 css, k = 글자 크기 보정(글꼴마다 같은 크기라도 커 보이는 정도가 달라요), lh = 줄 간격, grp = 종류
export const FONTS = [
  { id: 'serif', name: '고운바탕', fam: 'DT Gowun Batang', file: 'serif.css', gen: 'serif', k: 1, lh: 1.75, grp: '명조' },
  { id: 'myeongjo', name: '나눔명조', fam: 'DT Nanum Myeongjo', file: 'more.css', gen: 'serif', k: 1, lh: 1.75, grp: '명조' },
  { id: 'songmyung', name: '송명', fam: 'DT Song Myung', file: 'extra.css', gen: 'serif', k: 1, lh: 1.75, grp: '명조' },
  { id: 'hahmlet', name: '함렛', fam: 'DT Hahmlet', file: 'extra.css', gen: 'serif', k: 1, lh: 1.75, grp: '명조' },
  { id: 'diphy', name: '디필레이아', fam: 'DT Diphylleia', file: 'extra.css', gen: 'serif', k: .97, lh: 1.75, grp: '명조' },
  { id: 'sans', name: '프리텐다드', fam: 'Pretendard Variable', file: '', gen: 'sans-serif', k: 1, lh: 1.7, ls: '-.01em', grp: '고딕' },
  { id: 'dodum', name: '고운돋움', fam: 'DT Gowun Dodum', file: 'more.css', gen: 'sans-serif', k: 1, lh: 1.7, grp: '고딕' },
  { id: 'dohyeon', name: '도현', fam: 'DT Do Hyeon', file: 'more.css', gen: 'sans-serif', k: 1.05, lh: 1.6, grp: '고딕' },
  { id: 'jua', name: '주아', fam: 'DT Jua', file: 'extra.css', gen: 'sans-serif', k: 1.03, lh: 1.6, grp: '고딕' },
  { id: 'blackhan', name: '블랙한산스', fam: 'DT Black Han Sans', file: 'extra.css', gen: 'sans-serif', k: 1, lh: 1.6, grp: '고딕' },
  { id: 'hand', name: '나눔펜', fam: 'DT Nanum Pen Script', file: 'hand.css', gen: 'cursive', k: 1.23, lh: 1.5, grp: '손글씨' },
  { id: 'brush', name: '나눔붓', fam: 'DT Nanum Brush Script', file: 'extra.css', gen: 'cursive', k: 1.25, lh: 1.5, grp: '손글씨' },
  { id: 'gaegu', name: '개구', fam: 'DT Gaegu', file: 'more.css', gen: 'cursive', k: 1.12, lh: 1.6, grp: '손글씨' },
  { id: 'melody', name: '하이멜로디', fam: 'DT Hi Melody', file: 'more.css', gen: 'cursive', k: 1.15, lh: 1.6, grp: '손글씨' },
  { id: 'gamja', name: '감자꽃', fam: 'DT Gamja Flower', file: 'pad.css', gen: 'cursive', k: 1.1, lh: 1.6, grp: '손글씨' },
  { id: 'poor', name: '푸어스토리', fam: 'DT Poor Story', file: 'extra.css', gen: 'cursive', k: 1.1, lh: 1.6, grp: '손글씨' },
  { id: 'pixel', name: '갈무리', fam: 'DT Galmuri', file: 'grid.css', gen: 'monospace', k: .9, lh: 1.75, grp: '개성' },
  { id: 'single', name: '싱글데이', fam: 'DT Single Day', file: 'extra.css', gen: 'cursive', k: 1.08, lh: 1.6, grp: '개성' },
  { id: 'yeon', name: '연성', fam: 'DT Yeon Sung', file: 'extra.css', gen: 'cursive', k: 1.12, lh: 1.6, grp: '개성' },
  { id: 'dongle', name: '동글', fam: 'DT Dongle', file: 'extra.css', gen: 'sans-serif', k: 1.35, lh: 1.35, grp: '개성' },
];
export const fontOf = id => FONTS.find(f => f.id === id) || FONTS[0];
export const fontCssOf = f => `'${f.fam}', ${f.gen}`;
// 글자 크기: 큰 · 중간 · 작은 = 카드 폭의 8% · 6% · 4.5% (1080 기준 86 · 65 · 49)
export const SIZES = { xl: 108, l: 86, m: 65, s: 49, xs: 40 };
