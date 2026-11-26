// 템플릿 틀: 플로팅 셰이프 (아트, 11-26 125차). 앤드류 레퍼런스(3D 도형들이 떠다님)의 원리만 · 3D 라이브러리 없이 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'float'). 글 뒤를 가리지 않고 글자에 옅은 그림자만
// 셔플 = 배치 4 · 도형 비율 · 개수 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'float', name: '플로팅 셰이프', info: '아트 · 셔플할 때마다 새 배치 · 도형들이 둥실 돌아요', paid: true, rich: true, cls: 'art cfloat',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'float', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'float', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
