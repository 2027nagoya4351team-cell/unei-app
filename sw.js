// 運営管理ツール Service Worker(app/build.js が作る。直接編集しない)
// 役割: アプリの殻を保存して速く・電波が弱くても開けるようにする/新しい版の知らせ/プッシュ通知の受信
var VERSION = 'v8.5 (2026-10-16)', CACHE = 'unei-' + VERSION;
var SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'icons/badge-96.png'];
importScripts('config.js');
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k.indexOf('unei-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return; // サーバー(Apps Script)や Firebase への通信には触らない
  var fresh = r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname) || /config\.js$/.test(u.pathname);
  if (fresh) {
    // 画面本体は「まずネット、だめなら保存してあるもの」(更新がすぐ届く)
    e.respondWith(fetch(r).then(function (res) {
      if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r.mode === 'navigate' ? 'index.html' : r, cp); }); }
      return res;
    }).catch(function () { return caches.match(r.mode === 'navigate' ? 'index.html' : r, { ignoreSearch: true }); }));
  } else {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(r).then(function (res) { if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return res; });
    }));
  }
});
// 通知を押したとき(Firebase 以外から来た通知用。Firebase の通知は SDK が開く)
self.addEventListener('notificationclick', function (e) {
  var d = e.notification.data || {}; if (d.FCM_MSG) return;
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if ('focus' in cs[i]) return cs[i].focus();
    return self.clients.openWindow('./');
  }));
});
// v8.3: 通知が届いたら、ホーム画面のアイコンの数字を更新(サーバーが data.badge に「やること」の数を入れて送る)
self.addEventListener('push', function (e) {
  try {
    var j = e.data ? e.data.json() : null, b = j && j.data ? j.data.badge : undefined;
    if (b === undefined || b === '' || !self.navigator || !self.navigator.setAppBadge) return;
    var n = +b; e.waitUntil(n > 0 ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge());
  } catch (err) { }
});
// プッシュ通知(Firebase Cloud Messaging)。config.js に firebase の設定があるときだけ
var C = self.APP_CONFIG || {};
if (C.firebase && C.firebase.apiKey) {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp(C.firebase);
  firebase.messaging(); // 画面が閉じているときの通知は SDK が表示する
}
