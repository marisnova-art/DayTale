// 템플릿 틀: 웨이브 렌즈 (아트, 11-26 122차). 앤드류 레퍼런스(원 밖은 물결 · 원 안은 직선)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'lens'). 원 안 직선은 옅게 해서 글이 읽혀요
// 셔플 = 물결 스타일 6 · 선 종류 4 · 줄 개수 · 원 크기 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'lens', name: '웨이브 렌즈', info: '아트 · 셔플할 때마다 새 물결 · 원 밖은 물결, 안은 직선', paid: true, rich: true, cls: 'art clens',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'lens', dim: 'dark', seed: 11 } },
  blank: () => ({ pages: [''], bg: { id: 'lens', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
