// 템플릿 틀: 클라우드 텍스처 (아트, 11-26 126차). 앤드류 레퍼런스(여러 크기 노이즈를 겹친 구름 질감)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'cloud'). 글 뒤를 가리지 않고 글자에 옅은 그림자만
// 셔플 = 얼룩 크기 · 결 거칠기 · 대비 · 휘는 정도 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'cloud', name: '클라우드 텍스처', info: '아트 · 셔플할 때마다 새 구름 · 결이 천천히 흘러요', paid: true, rich: true, cls: 'art ccloud',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 아무 생각 없이 창밖만 보았다.'], bg: { id: 'cloud', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'cloud', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
