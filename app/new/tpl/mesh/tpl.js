// 템플릿 틀: 형광 물결망 (아트, 11-26 104차). 앤드류 레퍼런스(노이즈 + 네온 색 영상)의 느낌만 · 코드는 셰이더로 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'mesh'). 가운데 글 자리는 셰이더가 옅게 비워 둬요
// 셔플 = 정돈 정도 · 기울기 · 칸 크기 · 선 굵기 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'mesh', name: '형광 물결망', info: '아트 · 셔플할 때마다 새 그물 · 녹듯이 흐르는 선', paid: true, rich: true, cls: 'art cmesh',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 음악을 크게 틀고 걸었다.'], bg: { id: 'mesh', dim: 'dark', seed: 8 } },
  blank: () => ({ pages: [''], bg: { id: 'mesh', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
