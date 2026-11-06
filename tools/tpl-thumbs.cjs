// 템플릿 목록용 정지 그림 만들기 (11-06 템플릿 틀). 공개할 때 한 번 돌려요:
//   1) 앱을 띄워요: 아무 정적 서버로 app/ 를 열어요 (예: npx http-server app -p 8790)
//   2) node tools/tpl-thumbs.cjs [템플릿 id ...]   (없으면 지금 목록 전부)
// 앱이 그 템플릿의 첫 예시를 그대로 그려서(글 없는 아트는 그림만) 480 × 600 webp 로 저장해요:
//   app/new/tpl/<틀>/thumbs/<템플릿 id>.webp
// 끝에 템플릿마다 서버 표 assets.thumb 에 넣을 주소를 보여 줘요 (관리자 '템플릿' 메뉴가 생기면 거기서 자동으로)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.APP_URL || 'http://localhost:8790/new/';
const ROOT = path.join(__dirname, '..', 'app', 'new');

(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 480, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto(BASE + '#/tpl'); await p.waitForTimeout(800);
  const want = process.argv.slice(2);
  const ids = want.length ? want : await p.evaluate(() => import('./js/templates.js').then(T => T.TEMPLATES.filter(t => !t.dummy).map(t => t.id)));
  const out = {};
  for (const id of ids) {
    const info = await p.evaluate(async id => {
      const T = await import('./js/templates.js'), F = await import('./js/formats.js');
      const t = T.tpl(id); if (!t) return null;
      await F.ensure(t.fmt);
      document.body.innerHTML = '<div id="th" style="width:480px;container-type:inline-size"></div>';
      const c = T.exCard(t, 0, true), el = F.renderCard(c); el.querySelectorAll('.o').forEach(o => o.removeAttribute('data-m'));
      document.getElementById('th').appendChild(el); F.fitCard(el, c);
      await document.fonts.ready; F.fitCard(el, c); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { fmt: t.fmt };
    }, id);
    if (!info) { console.log('없는 템플릿', id); continue; }
    const dir = path.join(ROOT, 'tpl', info.fmt, 'thumbs'); fs.mkdirSync(dir, { recursive: true });
    const png = await (await p.$('#th .cd')).screenshot({ type: 'png' });
    const file = path.join(dir, id + '.webp');
    const webp = await p.evaluate(async b64 => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const cv = document.createElement('canvas'); cv.width = 480; cv.height = 600;
      const x = cv.getContext('2d'); const s = Math.max(480 / im.width, 600 / im.height);
      x.drawImage(im, (480 - im.width * s) / 2, (600 - im.height * s) / 2, im.width * s, im.height * s);
      return cv.toDataURL('image/webp', .82).split(',')[1];
    }, png.toString('base64'));
    fs.writeFileSync(file, Buffer.from(webp, 'base64'));
    out[id] = `tpl/${info.fmt}/thumbs/${id}.webp`;
    console.log(id, '→', out[id], Math.round(fs.statSync(file).size / 1024) + 'KB');
  }
  console.log(JSON.stringify(out, null, 2));
  await br.close();
})();
