# 運営管理ツール(新しいアプリ)

よさこいチームの運営管理ツールを、スマホのホーム画面に置けるアプリ(PWA)にしたものです。
データとサーバーは Google Apps Script(チームの Google アカウント)にあり、このリポジトリには**画面だけ**が入っています。

- 公開: GitHub Pages(このリポジトリの main ブランチ / ルート)
- 設定: `config.js`(サーバーのURL・Firebase の公開設定)。**秘密の鍵は絶対に置かない**
- 通知: Firebase Cloud Messaging。送信用の鍵は Apps Script のスクリプト プロパティ `FCM_SA` にだけ置く

## 更新のしかた
1. 開発用フォルダで `npm run build` を実行すると `pwa/` が作り直される(`config.js` は上書きしない)
2. `pwa/` の中身を、このリポジトリにアップロード(「Add file → Upload files」で上書き)
3. 数分で反映。開いているアプリには「新しいバージョンがあります」と表示される
