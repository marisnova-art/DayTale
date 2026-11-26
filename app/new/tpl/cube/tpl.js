// 템플릿 틀: 미니멀 큐브 (아트, 11-26 111차). 앤드류 레퍼런스(바닥 위 큐브 하나)의 느낌만 · 3D 라이브러리 없이 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'cube'). 글은 벽 위, 큐브는 아래 1/3
// 셔플 = 크기 · 자리 · 각도 · 바닥선 기울기 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'cube', name: '미니멀 큐브', info: '아트 · 셔플할 때마다 새 자리와 각도 · 큐브가 천천히 돌아요', paid: true, rich: true, cls: 'art ccube',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['책상을 비우고 컵 하나만 올려 두었다.'], bg: { id: 'cube', dim: 'dark', seed: 7 } },
  blank: () => ({ pages: [''], bg: { id: 'cube', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
