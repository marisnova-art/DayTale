/* 소개 페이지 → 앱: 처음 어디서 왔는지만 적어 둬요 (회원 구성 통계용, 관리자는 합계만 봐요).
   앱(js/data/account.js captureFirstTouch)과 같은 모양으로, 이 기기에 처음 한 번만. 기록 내용·IP·기기 고유값은 쓰지 않아요. */
(() => {
  const K = 'daytale.src', q = new URLSearchParams(location.search);
  const lp = (location.pathname.match(/\/([a-z]{2})\/(index\.html)?$/) || [])[1] || '';
  let r = '';
  try { const ref = document.referrer && new URL(document.referrer); if (ref && ref.host !== location.host) r = ref.hostname; } catch {}
  const get = k => (q.get(k) || '').slice(0, 100);
  try {
    if (!localStorage.getItem(K) && !localStorage.getItem('daytale.lastUser') && !localStorage.getItem('daytale.seen'))
      localStorage.setItem(K, JSON.stringify({ s: get('utm_source'), m: get('utm_medium'), c: get('utm_campaign'), ref: get('ref'), r: r.slice(0, 100), l: lp ? '/' + lp : 'app', at: Date.now() }));
  } catch {}
  // 앱으로 가는 링크에 utm·참조 사이트를 이어 붙여요 (앱이 다른 주소에 있어도 알 수 있게)
  const add = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'ref']) if (get(k)) add[k] = get(k);
  if (r) add.rf = r.slice(0, 100);
  document.querySelectorAll('a[href*="?lp="]').forEach(a => { try { const u = new URL(a.href); for (const [k, v] of Object.entries(add)) u.searchParams.set(k, v); a.href = u.href; } catch {} });
})();
