// 템플릿 틀: 이클립스 링 (아트, 11-25 103차). 앤드류 레퍼런스(만화경 그림)의 느낌만 · 코드는 셰이더로 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'eclipse'). 글은 안쪽 원 폭에 맞게 좁게 (tpl.css)
// 셔플 = 초승달 방향 · 굵기 · 고리 크기 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'eclipse', name: '이클립스 링', info: '아트 · 셔플할 때마다 새 고리 · 천천히 도는 색', paid: true, rich: true, css: true, cls: 'art cecl',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘 하늘이 유난히 맑았다.'], bg: { id: 'eclipse', dim: 'dark', seed: 6 } },
  blank: () => ({ pages: [''], bg: { id: 'eclipse', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
