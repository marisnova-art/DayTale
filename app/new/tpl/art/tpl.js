// 템플릿 틀: 오로라 커튼 (아트). 앤드류 작품(세로 오로라 빛줄기)을 코드로 그린 배경 위에 장으로 쓰는 글.
// 글 카드 그리기는 공용(renderText · fitText), 빛줄기는 공용 코드 배경 엔진(js/bg.js 'bands')을 써요.
// 셔플할 때마다 새 그림, 글꼴은 고를 수 있어요. 지우지 않아요 (템플릿은 숨김만)
import { renderText, fitText } from '../../js/formats.js';

export default {
  id: 'art', name: '오로라 커튼', info: '아트 · 셔플할 때마다 새 그림 · 흐르는 빛', paid: true, rich: true, cls: 'art',
  tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
  sample: { pages: ['창밖 불빛이 번져 보이는 밤. 오늘 하루도 천천히 흘러갔다.'], bg: { id: 'bands', dim: 'dark', seed: 11 } },
  blank: () => ({ pages: [''], bg: { id: 'bands', dim: 'dark', seed: Math.floor(Math.random() * 1e9) }, align: { h: 'l', v: 'm' }, datePos: 'none', font: 'sans', size: 'm' }),
  render: renderText, fit: fitText,
};
