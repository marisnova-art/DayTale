// 우리 이모티콘 81개 (지금 앱과 같은 그림). 굵은(색) · 선(글자색을 따라가요). 글 안에는 <span class="stk" data-st="이름" [data-v="l"]>로만 저장하고,
// 그릴 때 SVG를 그대로 넣어요 (저장 사진에도 그대로 나오게)
export const NAMES = ['sun', 'cloud', 'suncloud', 'rain', 'snow', 'thunder', 'fog', 'moon', 'event', 'note', 'sparkles', 'idea', 'todo', 'fire', 'coffee', 'recall', 'sunrise', 'sunflower', 'night', 'blossom', 'leaf', 'snowman', 'photo', 'cake', 'item', 'personal', 'scrap', 'mooncloud', 'trophy', 'tulip', 'sprout', 'strawberry', 'watermelon', 'shell', 'icecream', 'ginkgo', 'acorn', 'mushroom', 'mitten', 'tangerine', 'snowflake', 'rainbow', 'umbrella', 'wind', 'star', 'sunset', 'alarm', 'book', 'headphones', 'tea', 'bread', 'rice', 'apple', 'sneaker', 'bicycle', 'bus', 'plane', 'house', 'bed', 'heart', 'gift', 'letter', 'balloon', 'clover', 'smile', 'pencil', 'palette', 'film', 'gamepad', 'plant', 'laptop', 'bag', 'key', 'cat', 'dog', 'bird', 'tree', 'mountain', 'wave', 'butterfly', 'fish'];
const cache = new Map(), got = new Map();
const key = (n, v) => (v === 'l' ? 'line/' : 'kept/') + n;
export function load(n, v) {
  const k = key(n, v);
  if (!cache.has(k)) cache.set(k, fetch(new URL(`../stickers/${k}.svg`, location.href)).then(r => r.text())
    .then(t => (v === 'l' ? t.replace(/#000(000)?\b/gi, 'currentColor') : t).replace(/<\?xml[^>]*>/, '').replace(/<metadata[\s\S]*?<\/metadata>/g, '').replace(/>\s+</g, '><').trim()).catch(() => '').then(t => (got.set(k, t), t)));
  return cache.get(k);
}
export const ready = root => Promise.all([...root.querySelectorAll('span.stk[data-st]')].map(s => load(s.dataset.st, s.dataset.v)));
// 글 안 이모티콘을 그려요 (이미 받아 둔 건 바로, 아니면 받는 대로)
export function hydrate(root) {
  root.querySelectorAll('span.stk[data-st]').forEach(s => {
    s.contentEditable = 'false';
    if (s.firstChild) return;
    const k = key(s.dataset.st, s.dataset.v);
    if (got.has(k)) { s.innerHTML = got.get(k); return; }
    load(s.dataset.st, s.dataset.v).then(t => { if (!s.firstChild) s.innerHTML = t; });
  });
}
export const preloadAll = v => Promise.all(NAMES.map(n => load(n, v)));
