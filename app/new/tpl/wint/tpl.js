// 템플릿 틀: 웨이브 인터퍼런스 (아트, 11-26 116차). 앤드류 레퍼런스(가로 · 세로 물결 간섭)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'wint'). 쉐이더 느낌의 매끈한 빛 · 카드 전체 밝기 폭을 낮춰요
// 셔플 = 물결 구성 · 결 4가지 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'wint', name: '웨이브 인터퍼런스', info: '아트 · 셔플할 때마다 새 물결 · 빛이 엇갈리며 흘러요', paid: true, rich: true, cls: 'art cwint',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['바닷가에 오래 앉아 물결을 보았다.'], bg: { id: 'wint', dim: 'dark', seed: 13 } },
  blank: () => ({ pages: [''], bg: { id: 'wint', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
