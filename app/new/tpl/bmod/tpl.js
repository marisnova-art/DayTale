// 템플릿 틀: 블록 모더니즘 (아트, 11-26 114차). 앤드류 레퍼런스(3차원 격자 박스)의 원리만 · 3D 라이브러리 없이 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'bmod'). 카드 전체 채도 · 밝기 폭을 낮춰요
// 셔플 = 박스 배치 · 개수 · 보는 각도 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'bmod', name: '블록 모더니즘', info: '아트 · 셔플할 때마다 새 박스 구성 · 천천히 돌며 숨 쉬어요', paid: true, rich: true, cls: 'art cbmod',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['새로 지은 미술관에 다녀왔다.'], bg: { id: 'bmod', dim: 'dark', seed: 7 } },
  blank: () => ({ pages: [''], bg: { id: 'bmod', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
