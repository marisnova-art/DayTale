// 템플릿 틀: 컬러 필드 (아트, 11-26 123차). 앤드류 레퍼런스(격자에 맞물린 직사각형 · 블록마다 두 색 그라데이션)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'field'). 글 뒤를 가리지 않고 글자에 옅은 그림자만
// 셔플 = 블록 배치 · 크기 · 칠 방식 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'field', name: '컬러 필드', info: '아트 · 셔플할 때마다 새 색 블록 · 그라데이션이 천천히 돌아요', paid: true, rich: true, cls: 'art cfield',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'field', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'field', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
