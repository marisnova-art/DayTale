# 템플릿 틀 (11-06)

템플릿 하나 = 정보 한 줄(서버 표 `dz_templates`) + 그리는 틀 폴더 하나(여기).

- `tpl/<틀>/tpl.js` — `export default { render, fit, blank, sample, tools, ... }`. 날짜 줄 · 서명 · 비율 · 장 나누기 · 저장 · 셔플 · 모션 규칙 · 도구 줄은 공용 틀(`js/formats.js`, `js/main.js`)이 해요. 장으로 쓰는 글 카드는 `renderText` · `fitText`를 그대로 써도 돼요 (예: `art/`).
- `tpl/<틀>/tpl.css` — 이 틀만의 모양 (`css: true`일 때 같이 불러와요).
- `tpl/<틀>/thumbs/<템플릿 id>.webp` — 목록용 정지 그림. `node tools/tpl-thumbs.cjs <id>`로 만들고 `assets.thumb`에 넣어요.
- 틀은 볼 때만 불러와요. 지우지 않아요: 그 틀로 쓴 카드가 남아 있어요 (템플릿은 숨김만).

새 템플릿 넣는 순서: 앤드류 레퍼런스 → 피터가 폴더 만들기 → 예시 3개 · 정보 채우기 → 정지 그림 → 숨김으로 올리기 → 앤드류가 공개.
