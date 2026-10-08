/* 해시 주소 라우터: #/home, #/all, #/type/todo, #/folder/<id>, #/e/<id> … */
const routes = [];
let current = null, onRoute = () => {};
const route = (pattern, view) => routes.push({ re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/?]+)') + '$'), view });
function parse() {
  const raw = location.hash.replace(/^#/, '') || '/home';
  const [path, qs] = raw.split('?');
  for (const r of routes) { const m = path.match(r.re); if (m) return { path, view: r.view, params: { ...m.groups }, query: Object.fromEntries(new URLSearchParams(qs || '')) }; }
  return { path: '/home', view: routes.find(r => r.re.test('/home')).view, params: {}, query: {} };
}
function go(path, { replace = false } = {}) { const h = '#' + path; if (location.hash === h) { render(); return; } replace ? history.replaceState(null, '', h) : (location.hash = h); if (replace) render(); }
function render() { current = parse(); onRoute(current); }
function start(fn) { onRoute = fn; addEventListener('hashchange', render); render(); }
const now = () => current;

export { go, now, render, route, start };
