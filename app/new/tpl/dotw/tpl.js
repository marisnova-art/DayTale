// 템플릿 틀: 도트 웨이브 (아트, 11-26 127차). 앤드류 레퍼런스(촘촘한 점 격자를 물결로 휘고 색 띠로 칠함)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'dotw'). 글 뒤를 가리지 않고 글자에 옅은 그림자만
// 셔플 = 점 크기 · 큰 도트 · 휘는 방식 · 색 방향 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'dotw', name: '도트 웨이브', info: '아트 · 셔플할 때마다 새 점 격자 · 물결이 천천히 흘러요', paid: true, rich: true, cls: 'art cdotw',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'dotw', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'dotw', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
