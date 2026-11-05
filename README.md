# DIVE ATLAS

個人用ダイビングログ。独立したソース・依存関係・Gitで構成。

## 起動

Node.jsで `npm run dev`。 http://127.0.0.1:4493/ を開く。地図・WebGL水中表現・ログ保存は外部APIキー不要。TUSA ZIP変換だけPython 3.11以降の標準ライブラリを使用。

## 機能

- PC・スマホ幅の地図、ドラッグ・拡大・ピン選択。白・水色・ピンクのUI。ハイビスカスは大当たりをイメージした明暗の点滅。WebGLの水中光・漂う粒子・泡・タップ波紋。reduced-motionと停止設定に対応。
- ログ追加・編集・削除・検索、写真6枚、地図で位置指定。ブラウザ内保存。
- 写真・サイン・TUSA元項目を含むJSONバックアップと復元。重複を上書きしない。
- CSV列対応と取り込み前確認。TUSA AndroidバックアップZIP（backup.db）のローカル変換。
- サンプルは架空データ。自分の記録やバックアップに混ぜない。

## TUSA

ZIPのDIVING_LOG_TBから日付・ポイント・最大水深・潜水時間・水温・透明度・メモ・サイン・参照画像を変換し、元の全項目も保持。-999は欠測。DB内部IDをダイブ本数には使わない。日付はAsia/Tokyoで解釈し元のタイムスタンプを保持。

`python scripts/import-tusa.py --input backup.zip --output artifacts/converted.json` で変換可能。緯度経度がないログは未設定のまま保持。ユーザーが指定・承認した代表位置はlocationKind=approximateで「目安」と明示。元の座標を上書きしない。

公式手順：https://www.tusa.net/iq1204/pmbk/

## 個人データ

実ログ・ZIP・写真・サイン・バックアップはGitに含めない。artifacts/、private/、imports/、backups/、.envは除外。配布用初期データにも埋め込まない。

ローカルの初回取り込みは、artifacts/private-import/内のJSONをDIVE_ATLAS_IMPORT_FILE環境変数で指定。ファイルハッシュごとに一度だけブラウザへ取り込み、再読込で編集・削除を取り消さない。

現状はブラウザ内保存。端末間の自動同期・ログイン・外部公開は未実装。サーバーは127.0.0.1のみで待受け。個人データのAPIは同一オリジンだけを許可。

## 検証

`npm ci`、`npm run check`、`npm run check:browser`。開発用依存はplaywright-coreのみ。ブラウザは同梱せず、インストール済みChromeを使う（CHROME_PATHで変更可）。試験用CSV・画像はテスト内で生成。artifacts/の検証画像はコミットしない。

## 地図

MapLibre GL JSとOpenFreeMapのベクター地図を使用。島名・街名・海域名は地図データの地名レイヤーから表示し、日本語名を優先する。標準タイルにない沖縄の小島名は、GeoNamesの公開地理データから抽出した109島のラベルで補う。ログのピン名とは独立したデータ。地図にはインターネット接続が必要。取得するのは閲覧範囲の公開タイルと文字で、ログ本文・写真・サインは配信元へ送らない。水中表現は水域のマスク内だけに描画。出典はassets/NOTICE.txt。航海・潜水計画には使わない。
