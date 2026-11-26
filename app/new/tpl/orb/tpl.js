// 템플릿 틀: 루미너스 스피어 (아트, 11-26 131차). 앤드류 레퍼런스(어둠 속 번지는 빛 구슬)의 느낌만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'orb'). 글 뒤를 가리지 않고 글자에 옅은 그림자만
// 셔플 = 구슬 배치 · 수 · 크기 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'orb', name: '루미너스 스피어', info: '아트 · 셔플할 때마다 새 빛 구슬 · 천천히 떠다녀요', paid: true, rich: true, cls: 'art corb',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'orb', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'orb', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
