// 템플릿 틀: 스펙트럼 커브 (아트, 11-26 117차). 앤드류 레퍼런스 첫 화면(모서리에서 휘어 퍼지는 색띠)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'spec'). 픽셀 없이 매끈하게 · 카드 전체 채도 · 밝기 폭을 낮춰요
// 셔플 = 퍼지는 모서리 · 휘는 정도 · 띠 수 · 일렁임 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'spec', name: '스펙트럼 커브', info: '아트 · 셔플할 때마다 새 색띠 · 색이 띠를 따라 흘러요', paid: true, rich: true, cls: 'art cspec',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['해 질 녘에 강가를 걸었다.'], bg: { id: 'spec', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'spec', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
