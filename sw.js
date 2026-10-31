// 運営管理ツール Service Worker(app/build.js が作る。直接編集しない)
// 役割: アプリの殻を保存して速く・電波が弱くても開けるようにする/新しい版の知らせ/プッシュ通知の受信
var VERSION = 'v10.65 (2026-11-01)', CACHE = 'unei-' + VERSION;
var SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'icons/badge-96.png'];
importScripts('config.js');
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); })); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k.indexOf('unei-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'SKIP_WAITING') self.skipWaiting(); else if (e.data === 'VERSION' && e.ports && e.ports[0]) e.ports[0].postMessage(VERSION); }); // v10.6: 画面が新しい版と同じなら、知らせを出さずに入れ替える
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return; // サーバー(Apps Script)や Firebase への通信には触らない
  var fresh = r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname) || /config\.js$/.test(u.pathname);
  if (fresh) {
    // 画面本体は「まずネット、だめなら保存してあるもの」(更新がすぐ届く)
    // v10.6: 電波が弱くて2.5秒たっても届かないときは保存してある画面をすぐ出し、裏で最新を取って次回に使う
    var key = r.mode === 'navigate' ? 'index.html' : r;
    var net = fetch(r).then(function (res) {
      if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(key, cp); }); }
      return res;
    });
    e.respondWith(new Promise(function (ok) {
      var done = false, give = function (x) { if (!done && x) { done = true; ok(x); } };
      var t = setTimeout(function () { caches.match(key, { ignoreSearch: true }).then(give); }, 2500);
      net.then(function (res) { clearTimeout(t); give(res); }).catch(function () { clearTimeout(t); caches.match(key, { ignoreSearch: true }).then(function (h) { give(h || Response.error()); }); });
    }));
    e.waitUntil(net.catch(function () { }));
  } else {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(r).then(function (res) { if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return res; });
    }));
  }
});
// v10.7: 通知は Firebase の部品を使わず、ここで必ず表示する。
// iPhone は「通知が来たのに表示しなかった」ことが数回あると、その端末の通知の登録を黙って止めてしまう
// (Firebase の部品はアプリを開いている間は表示しないため、テスト通知などで止められていた)
self.addEventListener('push', function (e) {
  var j = {}; try { j = e.data ? e.data.json() : {}; } catch (x) { try { j = { notification: { body: e.data.text() } }; } catch (y) { } }
  var n = j.notification || {}, d = j.data || {};
  var title = n.title || d['gcm.notification.title'] || '運営管理ツール', body = n.body || d['gcm.notification.body'] || '';
  var url = (j.fcmOptions && j.fcmOptions.link) || n.click_action || ((d.url || './') + (d.go ? '#go=' + encodeURIComponent(d.go) : ''));
  var jobs = [self.registration.showNotification(title, { body: body, icon: n.icon || 'icons/icon-192.png', badge: n.badge || 'icons/badge-96.png', tag: n.tag || ('m-' + Date.now()), renotify: true, vibrate: [200, 100, 200], data: { url: url, go: d.go || '' } })];
  var b = d.badge;
  if (b !== undefined && b !== '' && self.navigator && self.navigator.setAppBadge) jobs.push(+b > 0 ? self.navigator.setAppBadge(+b) : self.navigator.clearAppBadge());
  jobs.push(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: 'push', title: title, body: body }); }); }));
  var C = self.APP_CONFIG || {}; // v10.9: 「届いた」をサーバーに知らせる(どの端末に届かないかを管理者が分かるように)
  if (d.k && C.apiUrl) jobs.push(fetch(C.apiUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn: 'pushAck', args: [d.k] }) }));
  try { jobs.push(caches.open('diag-push').then(function (c) { return c.put('last', new Response(JSON.stringify({ at: Date.now(), title: title, ver: VERSION }))); })); } catch (x) { } // v10.8: 届いた記録(通知の診断で表示)
  e.waitUntil(Promise.all(jobs.map(function (p) { return Promise.resolve(p).catch(function () { }); })));
});
// 通知を押したとき:開いているアプリがあればその画面へ、なければアプリを開く
self.addEventListener('notificationclick', function (e) {
  var d = e.notification.data || {}, url = d.url || './';
  if (d.FCM_MSG) url = (d.FCM_MSG.fcmOptions && d.FCM_MSG.fcmOptions.link) || url; // 前の版で表示された通知
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if ('focus' in cs[i]) { cs[i].postMessage({ type: 'go', go: d.go || ((/#go=([^&]+)/.exec(url) || [])[1] ? decodeURIComponent(/#go=([^&]+)/.exec(url)[1]) : '') }); return cs[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
