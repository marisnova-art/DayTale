// 75차 인트로 시안 페이지 (intro-demo.html) 전용. 고르면 이 파일도 지워요
import { LOGO } from './logo.js';

const V = [
  ['A', '손글씨', '지금 75차. 왼쪽부터 써지고 살짝 빛나요'],
  ['B', '선 따라 그리기', '펜이 테두리를 따라 그린 뒤 속이 채워져요'],
  ['C', '잉크 번짐', '흐릿하게 번졌다가 또렷하게 모여요'],
  ['D', '빛이 지나감', '조용히 나타난 뒤 빛줄기가 한 번 훑어요'],
  ['E', '점에서 퍼짐', '가운데 작은 빛이 커지며 드러나요'],
  ['F', '떠오름', '아래에서 올라와 살짝 튀어요'],
  ['G', '숨결', '가장 조용하게 천천히 밝아져요'],
  ['H', '손글씨 + 날짜', '써진 뒤 아래에 오늘 날짜 한 줄'],
];
const d = new Date(), today = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
const inner = k => k === 'D' ? `<div class="wrap">${LOGO}<i class="shine"></i></div>`
  : k === 'E' ? `<i class="dot"></i>${LOGO}`
  : k === 'F' ? `<div class="clip">${LOGO}</div>`
  : k === 'H' ? `<div class="col">${LOGO}<span class="dt">${today}</span></div>`
  : LOGO;
const g = document.getElementById('g');
g.innerHTML = V.map(([k, n, t]) => `<button class="tile ${k}" type="button"><div class="stage">${inner(k)}</div><i class="home"></i><span class="nm"><b>${k} · ${n}</b>${t}</span></button>`).join('');

// B: 선 길이를 재서 그리기 시작점으로
g.querySelectorAll('.B path').forEach(p => { const L = Math.ceil(p.getTotalLength()); p.style.strokeDasharray = L; p.style.setProperty('--len', L); p.style.strokeDashoffset = L; });
// D: 빛줄기가 로고 모양 안에서만 보이게 로고를 가림막으로
const svg = g.querySelector('.D .lgo');
if (svg) { const s = new XMLSerializer().serializeToString(svg).replace('currentColor', '#000'); g.querySelector('.D .wrap').style.setProperty('--logomask', `url("data:image/svg+xml,${encodeURIComponent(s)}")`); }

const play = t => { t.classList.remove('go'); void t.offsetWidth; t.classList.add('go'); };
g.querySelectorAll('.tile').forEach(t => { t.onclick = () => play(t); });
document.querySelector('.all').onclick = () => g.querySelectorAll('.tile').forEach(play);
requestAnimationFrame(() => g.querySelectorAll('.tile').forEach(play));
