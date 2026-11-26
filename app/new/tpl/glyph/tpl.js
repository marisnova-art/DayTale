// 템플릿 틀: 글리프 콜라주 (아트, 11-27 143차). 앤드류 레퍼런스(기하 기호가 겹쳐 흩어진 그림)의 느낌만 · 식과 코드는 새로 작성.
// 글 카드 그리기는 공용(renderText · fitText), 배경은 공용 코드 배경 엔진(js/bg.js 'glyph'). 기호는 '기호 · 상징'만, 내 글에서 고른 낱글자가 섞여요
// 셔플 = 배치 · 크기 · 회전 · 기호 (+ 칩을 안 골랐으면 색 묶음 10가지 중). 글자색은 바탕 밝기로 자동 (formats.js)
import { renderText, fitText, cardText } from '../../js/formats.js';
import { glyphReady, glyphLetters } from '../../js/bg.js';

export default {
  id: 'glyph', name: '글리프 콜라주', info: '아트 · 기호와 내 글자가 겹쳐 흩어진 그림 · 천천히 떠다녀요', paid: true, rich: true, cls: 'art cglyph',
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['오늘은 구름 산책. 옥상에서 오래 하늘을 봤다.'], bg: { id: 'glyph', dim: 'dark', seed: 10 } },
  blank: () => ({ pages: [''], bg: { id: 'glyph', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'c', v: 'm' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  prep: c => glyphReady(glyphLetters(cardText(c)).join('')),   // 저장 전에 기호 · 내 글자 글꼴을 기다려요
  render: renderText, fit: fitText,
};
