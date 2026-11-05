# DIVE ATLAS

個人用ダイビングログ。独立したソース・依存関係・Gitで構成。

## 起動

Node.jsで `npm run dev` を実行し、http://127.0.0.1:4493/ を開きます。画面でログやスポットを閲覧し、地図を操作できます。

## ローカルログ

TUSA Androidのバックアップをローカルで変換します。Python 3.11以降が必要です。

    python -B scripts/import-tusa.py --input backup.zip --output artifacts/private-import/journal.json

出力先のフォルダーは先に作成してください。PowerShellで次のように起動します。

    $env:DIVE_ATLAS_IMPORT_FILE = (Resolve-Path artifacts/private-import/journal.json).Path
    npm run dev

ログ、写真、サインはJSONに残ります。緯度経度がないログには、変換時の `--locations` で目安の位置を指定できます。以前の版で同じファイルを取り込んだブラウザーでは、その後の編集・削除を反映した既存ログを読み取り専用で表示します。新しいJSONに更新すると、その内容を表示します。元のログ・写真・サインはGitの対象外です。

## GitHub Pages

`npm ci` の後、空のフォルダーを指定して `npm run build:pages -- artifacts/pages` で配信用ファイルを作れます。配信版で見られるのはスポット地図と架空のサンプルです。個人ログ、取り込みAPI、ブラウザー内のログ保存処理は配信ファイルに含めません。

GitHub Pagesの公開元をGitHub Actionsに設定し、対象のコミットから **Deploy DIVE ATLAS** を手動実行します。通常のコミットでは自動配信されません。

## 検証

`npm run check` と `npm run check:browser`。Chromeを使います（`CHROME_PATH` で変更可）。実際のTUSA ZIPは `TUSA_ZIP` を指定して `node scripts/check-tusa-browser.mjs` でローカル変換と表示を確認できます。

## 地図

MapLibre GL JSとOpenFreeMapのベクター地図を使用。島名・街名・海域名は地図データの地名レイヤーから表示し、日本語名を優先する。標準タイルにない沖縄の小島名は、GeoNamesの公開地理データから抽出した109島のラベルで補う。ログのピン名とは独立したデータ。地図にはインターネット接続が必要。取得するのは閲覧範囲の公開タイルと文字で、ログ本文・写真・サインは配信元へ送らない。水中表現は水域のマスク内だけに描画。出典はassets/NOTICE.txt。航海・潜水計画には使わない。
