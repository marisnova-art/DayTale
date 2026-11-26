// 템플릿 틀: 레트로 픽셀 (아트, 11-26 109차). 앤드류 레퍼런스(진동판 마디선 점 격자)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'retro'). 글 둘레는 그릴 때 픽셀을 옅게 해요
// 셔플 = 대칭 모양 · 픽셀 크기 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'retro', name: '레트로 픽셀', info: '아트 · 셔플할 때마다 새 대칭 무늬 · 두 무늬 사이를 천천히 오가요', paid: true, rich: true, cls: 'art cretro',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 오래된 게임기를 꺼냈다.'], bg: { id: 'retro', dim: 'dark', seed: 7 } },
  blank: () => ({ pages: [''], bg: { id: 'retro', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
