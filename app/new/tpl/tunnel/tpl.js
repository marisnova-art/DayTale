// 템플릿 틀: 라이트 터널 (아트, 11-25 101차). 앤드류 레퍼런스(사진을 붙인 3D 터널)의 느낌만 · 사진 없이 셰이더로 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'tunnel').
// 셔플 = 부채꼴 수 · 빛줄기 밀도 · 소실점 · 도는 방향 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'tunnel', name: '라이트 터널', info: '아트 · 셔플할 때마다 새 터널 · 뻗어 나오는 빛줄기', paid: true, rich: true, cls: 'art tunnel',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 하루가 정말 빨리 지나갔다.'], bg: { id: 'tunnel', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'tunnel', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
