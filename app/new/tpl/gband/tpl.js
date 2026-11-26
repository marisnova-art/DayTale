// 템플릿 틀: 그라데이션 밴드 (아트, 11-26 110차). 앤드류 레퍼런스(세로 띠 대칭 그라데이션)의 원리만 · 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'gband'). 글 둘레는 그릴 때 수평선 색으로 옅게 해요
// 셔플 = 띠 수 · 물결 폭 · 수평선 높이 · 방향 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'gband', name: '그라데이션 밴드', info: '아트 · 셔플할 때마다 새 띠 · 물결이 옆으로 천천히 흘러요', paid: true, rich: true, cls: 'art cgband',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['해 질 무렵 강가를 오래 걸었다.'], bg: { id: 'gband', dim: 'dark', seed: 7 } },
  blank: () => ({ pages: [''], bg: { id: 'gband', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
