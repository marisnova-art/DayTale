// 템플릿 틀: 슬릿스캔 (아트, 11-20). 앤드류 레퍼런스(슬릿스캔처럼 가로 띠가 겹친 풍경)를 코드로 그린 배경 위에 장으로 쓰는 글.
// 글 카드 그리기는 공용(renderText · fitText), 띠는 공용 코드 배경 엔진(js/bg.js 'slit')을 써요.
// 셔플 = 띠 모양 새로 + 색 묶음 5개(노을 · 붉은 저녁 · 황금빛 · 새벽 · 밤 바다)가 바뀌어요. 글자색 · 딤은 띠 밝기로 자동 (formats.js slitLayer)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'slit', name: '슬릿스캔', info: '아트 · 셔플할 때마다 새 풍경 · 숨 쉬는 띠', paid: true, rich: true, cls: 'art slit', css: true,
  tools: { photo: false, emo: true, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['퇴근길 하늘이 이상하게 예뻐서 버스를 한 정거장 일찍 내렸다.'], bg: { id: 'slit', dim: 'dark', seed: 5 } },
  blank: () => ({ pages: [''], bg: { id: 'slit', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'l', v: 't' }, datePos: 'bottom', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
