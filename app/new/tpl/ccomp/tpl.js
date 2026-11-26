// 템플릿 틀: 큐브 컴포지션 (아트, 11-26 113차). 앤드류 레퍼런스(격자 상자 구성)의 원리만 · 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'ccomp'). 글 둘레는 그릴 때 채도 · 대비를 낮춰요
// 셔플 = 격자 · 큰 상자 비율 · 방식 섞임 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'ccomp', name: '큐브 컴포지션', info: '아트 · 셔플할 때마다 새 상자 구성 · 두께가 물결처럼 움직여요', paid: true, rich: true, cls: 'art cccomp',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 방을 정리하고 상자들을 차곡차곡 쌓았다.'], bg: { id: 'ccomp', dim: 'dark', seed: 7 } },
  blank: () => ({ pages: [''], bg: { id: 'ccomp', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
