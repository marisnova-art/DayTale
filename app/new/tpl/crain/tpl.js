// 템플릿 틀: 코드 레인 (아트, 11-26 130차). 앤드류 레퍼런스(떨어지는 글자 비)의 느낌만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'crain'). 글 뒤를 가리지 않고 글자에 옅은 그림자만
// 셔플 = 글자 종류 · 흐름 · 밀도 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'crain', name: '코드 레인', info: '아트 · 셔플할 때마다 새 코드 비 · 글자가 떨어져요', paid: true, rich: true, cls: 'art crain',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'crain', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'crain', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
