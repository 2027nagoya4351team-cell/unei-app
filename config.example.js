// 運営管理ツール(新しいアプリ)の設定。ここには「公開してよい値」だけを書く(秘密の鍵は書かない)
self.APP_CONFIG = {
  // Apps Script のウェブアプリURL(…/exec)。デプロイを管理 → ウェブアプリ のURL
  apiUrl: '',
  // Firebase コンソール → プロジェクトの設定 → マイアプリ(ウェブ)の firebaseConfig をそのまま
  firebase: { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' },
  // Firebase コンソール → プロジェクトの設定 → Cloud Messaging → ウェブプッシュ証明書 の「鍵ペア」
  vapidKey: ''
};
