/* 오프라인 앱 껍데기. 기록은 IndexedDB에 있고 페이지가 동기화해요. 캐시 이름은 앱 버전을 따라가요. */
const VERSION = 'daytale-' + (new URL(self.location.href).searchParams.get('v') || 'dev');
/* PRECACHE:START (tools/update-precache.mjs 가 만들어요) */
const SHELL = ["./config.js","./css/auth.css","./css/base.css","./css/calendar.css","./css/editor.css","./css/home.css","./css/list.css","./css/settings.css","./css/shell.css","./css/tokens.css","./fonts/pretendard.css","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./index.html","./js/core/config.js","./js/core/faq.js","./js/core/fonts.js","./js/core/i18n.js","./js/core/icons.js","./js/core/sanitize.js","./js/core/stickers.js","./js/core/utils.js","./js/data/account.js","./js/data/cities.js","./js/data/local-db.js","./js/data/store.js","./js/data/supabase.js","./js/data/sync.js","./js/features/backup.js","./js/features/billing.js","./js/features/card.js","./js/features/install.js","./js/features/photos.js","./js/features/reminders.js","./js/features/weather.js","./js/i18n/en.js","./js/i18n/es.js","./js/i18n/fr.js","./js/i18n/ja.js","./js/i18n/ko.js","./js/main.js","./js/story/en.js","./js/story/engine.js","./js/story/es.js","./js/story/fr.js","./js/story/ja.js","./js/story/ko.js","./js/story/lit.js","./js/story/questions.es.js","./js/story/questions.fr.js","./js/story/questions.ja.js","./js/story/questions.js","./js/ui/backdrop.js","./js/ui/feedback.js","./js/ui/router.js","./js/ui/shell.js","./js/views/auth.js","./js/views/backup.js","./js/views/calendar.js","./js/views/editor.js","./js/views/folders.js","./js/views/home.js","./js/views/info.js","./js/views/list.js","./js/views/notices.js","./js/views/pickers.js","./js/views/plans.js","./js/views/settings.js","./js/views/today.js","./manifest.webmanifest","./stickers/fluent/blossom.webp","./stickers/fluent/cloud.webp","./stickers/fluent/event.webp","./stickers/fluent/fire.webp","./stickers/fluent/fog.webp","./stickers/fluent/idea.webp","./stickers/fluent/item.webp","./stickers/fluent/leaf.webp","./stickers/fluent/moon.webp","./stickers/fluent/night.webp","./stickers/fluent/note.webp","./stickers/fluent/personal.webp","./stickers/fluent/photo.webp","./stickers/fluent/rain.webp","./stickers/fluent/scrap.webp","./stickers/fluent/snow.webp","./stickers/fluent/snowman.webp","./stickers/fluent/sparkles.webp","./stickers/fluent/sun.webp","./stickers/fluent/suncloud.webp","./stickers/fluent/sunflower.webp","./stickers/fluent/sunrise.webp","./stickers/fluent/thunder.webp","./stickers/fluent/todo.webp","./stickers/pixel/cake.svg","./stickers/pixel/crown.svg","./stickers/pixel/fire.svg","./stickers/pixel/gift.svg","./stickers/pixel/heart.svg","./stickers/pixel/moon.svg","./stickers/pixel/star.svg","./stickers/pixel/sun.svg","./stickers/pixel/trophy.svg","./vendor/supabase.js"];
/* PRECACHE:END */
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(['./', ...SHELL])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('daytale-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const putCopy = (req, res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                         // 서버·결제·사진은 캐시하지 않아요
  const scope = new URL(self.registration.scope).pathname;
  if (/^(en|ko|ja|es|fr|legal|site)(\/|$)/.test(url.pathname.slice(scope.length))) return;   // 소개·약관 페이지는 앱 껍데기가 아니에요
  if (req.mode === 'navigate') { e.respondWith(fetch(req).then(r => r.redirected || new URL(r.url).pathname.slice(scope.length).replace('index.html', '') ? r : putCopy(new Request('./index.html'), r)).catch(() => caches.match('./index.html'))); return; }
  if (/\/(fonts|stickers|vendor|icons)\//.test(url.pathname)) { e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => putCopy(req, r)))); return; }
  e.respondWith(fetch(req).then(r => putCopy(req, r)).catch(() => caches.match(req, { ignoreSearch: true })));   // 앱 파일: 네트워크 먼저
});
/* 웹 푸시: 앱이 닫혀 있어도 서버가 보낸 알림을 띄워요 */
self.addEventListener('push', e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch { m = { title: e.data?.text() || '' }; }
  e.waitUntil(self.registration.showNotification(m.title || 'Daytale', { body: m.body || '', tag: m.tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { id: m.id || null } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const id = e.notification.data?.id;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs[0]; if (c) { c.focus(); if (id) c.postMessage({ open: id }); return; }
    return self.clients.openWindow(id ? './#/e/' + id : './#/home');
  }));
});
