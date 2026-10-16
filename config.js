// 運営管理ツール(新しいアプリ)の設定。ここには「公開してよい値」だけを書く(秘密の鍵は書かない)
self.APP_CONFIG = {
  // Apps Script のウェブアプリURL(…/exec)。← いまはテスト環境
  apiUrl: 'https://script.google.com/macros/s/AKfycbwHYS25jRp3qDD0DvoJWPFENF3pV5aPWyKXAh8MYuVekJYDlxB0DCmMn4riZdkSAZkl1Q/exec',
  // Firebase(プロジェクト unei-kanri)の公開設定
  firebase: {
    apiKey: 'AIzaSyBQoEz5-ND4_D2aJwgPNiU7PkRpmjuSazw',
    authDomain: 'unei-kanri.firebaseapp.com',
    projectId: 'unei-kanri',
    storageBucket: 'unei-kanri.firebasestorage.app',
    messagingSenderId: '749406704491',
    appId: '1:749406704491:web:acdc803247d2fa4242722e'
  },
  // ウェブプッシュ証明書(公開鍵)
  vapidKey: 'BLVY4yO45sz70MltVIW-hwvanRyYaYTZumH1iEdaEUgjHd4W0EzOpgj4RdtxJgt_dCm7V78rW3mWhOyJjGGZRMk'
};
