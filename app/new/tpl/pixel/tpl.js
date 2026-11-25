// 템플릿 틀: 픽셀 체커 (아트, 11-26 105차). 앤드류 레퍼런스(물결 바둑판 이미지 · 영상)의 느낌만 · 코드는 셰이더로 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'pixel'). 글 둘레는 셰이더가 글자색에 맞춰 무늬를 연하게 해요
// 셔플 = 칸 크기 · 픽셀 크기 · 칸 모양 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'pixel', name: '픽셀 체커', info: '아트 · 셔플할 때마다 새 바둑판 · 천천히 자리를 바꾸는 칸', paid: true, rich: true, cls: 'art cpix',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 오래된 게임을 다시 해 봤다.'], bg: { id: 'pixel', dim: 'dark', seed: 7 } },
  blank: () => ({ pages: [''], bg: { id: 'pixel', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
