// 템플릿 틀: 플라즈마 (아트, 11-26 106차). 앤드류 레퍼런스(셰이더 효과 모음 중 플라즈마)의 원리만 · 코드는 셰이더로 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'plasma'). 글 둘레는 셰이더가 글자색에 맞춰 둘레를 옅게 해요
// 셔플 = 물결 크기 · 방향 · 빛 번짐 (+ 칩을 안 골랐으면 색 묶음 11가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'plasma', name: '플라즈마', info: '아트 · 셔플할 때마다 새 물결 · 빛이 번지듯 천천히 일렁여요', paid: true, rich: true, cls: 'art cplas',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 바다를 오래 보고 왔다.'], bg: { id: 'plasma', dim: 'dark', seed: 9 } },
  blank: () => ({ pages: [''], bg: { id: 'plasma', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
