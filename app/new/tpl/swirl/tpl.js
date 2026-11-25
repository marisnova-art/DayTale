// 템플릿 틀: 라이트 스월 (아트, 11-25 99차). 앤드류 레퍼런스(셰이더 그림)의 느낌만 · 셰이더는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'swirl').
// 셔플 = 겹 수 · 반짝임 자리 · 감김 · 도는 방향 · 파장 간격 · 나선 물결 (+ 칩을 안 골랐으면 색 20가지 중). 글자색 · 막은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'swirl', name: '라이트 스월', info: '아트 · 셔플할 때마다 새 소용돌이 · 번지는 물결', paid: true, rich: true, cls: 'art swirl',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['창문을 열었더니 바람이 차가웠다. 따뜻한 차를 끓여 오래 마셨다.'], bg: { id: 'swirl', dim: 'dark', seed: 3 } },
  blank: () => ({ pages: [''], bg: { id: 'swirl', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
