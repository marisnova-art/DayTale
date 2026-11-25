// 템플릿 틀: 네온 플로우 (아트, 11-25 100차). 앤드류 레퍼런스(옵아트 캔버스)의 느낌만 · 셰이더는 새로 작성 (링 없음).
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'neon').
// 셔플 = 덩어리 수 · 크기 · 흐르는 길(8자 · 타원 · 물결) · 장면 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'neon', name: '네온 플로우', info: '아트 · 셔플할 때마다 새 흐름 · 은은한 네온 꼬리', paid: true, rich: true, cls: 'art neon',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['늦은 밤 버스 창밖으로 불빛이 길게 흘러갔다.'], bg: { id: 'neon', dim: 'dark', seed: 21 } },
  blank: () => ({ pages: [''], bg: { id: 'neon', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
