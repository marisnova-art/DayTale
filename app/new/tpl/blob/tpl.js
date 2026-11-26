// 템플릿 틀: 컬러 블롭 (아트, 11-26 120차). 앤드류 레퍼런스(격자 값 노이즈 → 색 바퀴)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'blob'). 픽셀 없이 매끈하게 · 카드 전체 채도 · 밝기 폭을 낮춰요
// 셔플 = 얼룩 배치 · 칸 크기 · 색 도는 횟수 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'blob', name: '컬러 블롭', info: '아트 · 셔플할 때마다 새 얼룩 · 잔잔히 흐르며 숨 쉬어요', paid: true, rich: true, cls: 'art cblob',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'blob', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'blob', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
