// 템플릿 틀: 프랙탈 패턴 (아트, 11-26 107차). 앤드류 레퍼런스(점 밀도 무늬)의 원리만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'fractal'). 배경 도구 없이 셔플만 (앤드류 11-26):
// 셔플 = 무늬 · 크기 · 색 묶음 10가지 · 색 방향. 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'fractal', name: '프랙탈 패턴', info: '아트 · 셔플할 때마다 새 무늬 · 실이 얽힌 무늬가 천천히 흘러요', paid: true, rich: true, cls: 'art cfrac',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: false, dp: true },
  sample: { pages: ['오늘은 생각이 실타래처럼 엉켰다가 천천히 풀렸다.'], bg: { id: 'fractal', dim: 'dark', seed: 11 } },
  blank: () => ({ pages: [''], bg: { id: 'fractal', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
