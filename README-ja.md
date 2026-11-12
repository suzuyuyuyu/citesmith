# Citesmith

[English](README.md) | 日本語

arXiv の論文概要ページ、Nature・Springer（link.springer.com）・Wiley Online Library・ScienceDirect の記事ページで、Citesmith ボタンから PDF の保存と BibTeX のコピーを行う Chrome MV3 拡張です。

## インストール・設定

1. リポジトリを取得し、Chrome の `chrome://extensions` でデベロッパーモードを有効にする。
2. 「パッケージ化されていない拡張機能を読み込む」でリポジトリのルートを選ぶ。
3. 対応ページを再読み込みし、PDF リンク付近の Citesmith ボタンを押す。配置先がない場合は右下に表示する。ボタン右の ▾ から「PDF only」「BibTeX only」などをその場で選べる。

拡張のポップアップで表示言語（English／日本語、初期値は English）、ファイル名・引用キーの書式と「PDF をダウンロード」「BibTeX をコピー」を設定して保存します。両方とも初期値はオンです。更新後は拡張と記事ページを再読み込みしてください。

- ファイル名の初期値：`${firstAuthorLastNameCaps}${year}-${titleSnakeCase}`（`.pdf` は自動付与）
- 引用キーの初期値：`${firstAuthorLastNameLower}${year}${titleFirstWord}`（例：`harris2020array`、`vaswani2017attention`）
- 保存先フォルダ：ダウンロードフォルダ内のサブフォルダ（例：`papers/${journal}`）。空欄なら直下。Chrome の制約で、ダウンロードフォルダの外は指定できません。

## プレースホルダー

ポップアップの「書式のプレースホルダー一覧」から、例つきの一覧（`help.html`）を開けます。

以下の名前を `${名前}` と書きます。情報は `citation_*` メタタグから取得し、ScienceDirect の著者は BibTeX から取得します。ない項目は空文字になります。不明な名前はエラーになります。

| 名前 | 内容 |
| --- | --- |
| `author` | 全著者を ` and ` で連結 |
| `firstAuthorFullName` | 第一著者の名前 |
| `firstAuthorFirstName` / `firstAuthorLastName` | 第一著者の名（ミドルネームを含む）／姓 |
| `firstAuthorInitials` | 名と姓の頭文字（大文字） |
| `firstAuthorFirstNameCaps` / `firstAuthorLastNameCaps` | 名／姓の大文字表記 |
| `firstAuthorLastNameLower` | 姓の小文字表記 |
| `firstAuthorFullNameCaps` | 名、姓の順に大文字で連結 |
| `firstAuthorFullNameCapsSnake` / `firstAuthorFullNameCapsKebab` | 上記の空白を `_` ／ `-` に置換 |
| `year` | 出版年（arXiv は初版年） |
| `title` | タイトル |
| `titleSnakeCase` / `titleKebabCase` | タイトルの空白を `_` ／ `-` に置換（大文字・小文字は保持） |
| `titleCamelCase` | タイトルを lowerCamelCase に変換 |
| `titleFirstWord` | 冠詞・前置詞などの英語の頻出語を除いた最初の ASCII 単語（アクセント除去、小文字） |
| `doi` / `journal` | DOI／誌名 |
| `volume` / `number` / `pages` | 巻／号／ページ範囲（`--` 区切り） |
| `publisher` / `booktitle` / `organization` | 出版社／会議名／組織名 |
| `url` | 記事ページ URL |

ファイル名は禁則文字・制御文字を除去し、空白をまとめ、拡張子の前を UTF-8 で180バイト以内に制限します。引用キーはアクセントを除去し、英数字と `_ : . -` のみを残します。空になった場合は `paper` を使用します。重複ファイルは Chrome が連番を付けます。

BibTeX はサイトのエクスポートを使用し、引用キー、タイトルの大文字保護、arXiv の `year`（初版年に統一）を変更し、前後の空白を除去します。ボタンの「Done」は有効な操作の処理完了（PDF はダウンロード開始）を表し、転送完了は Chrome のダウンロード画面で確認できます。「Error」の詳細はボタンにマウスを置くと表示されます。

## 開発

Node.js 24。追加の npm 依存・ビルド処理は不要です。

```sh
npm test
node scripts/probe.mjs https://arxiv.org/abs/1706.03762
node scripts/probe.mjs https://www.nature.com/articles/s41586-020-2649-2
node scripts/e2e.mjs https://arxiv.org/abs/1706.03762 https://www.nature.com/articles/s41586-020-2649-2
```

`src/sites/` はメタ情報のアダプタ、`src/template.js` は共通の書式処理です。

- probe：ページと BibTeX を Node から取得し、生成されるファイル名と BibTeX を表示します。
- e2e：使い捨てプロファイルの Chrome（headless）に拡張を読み込み、ボタンを押して、表示、クリップボード、保存されたファイルを確認します。保存先は `~/tmp/citesmith-e2e/`。`HEADFUL=1` を付けるとウィンドウを表示します。

Springer は `/article/<DOI>`、Wiley は `/doi/<DOI>`・`/doi/full/<DOI>`・`/doi/abs/<DOI>` に対応します。Wiley の PDF ビューアページは対象外です。ScienceDirect は `/science/article/pii/<PII>`・`/science/article/abs/pii/<PII>` に対応します。著者取得のため、BibTeX コピーがオフでも ScienceDirect の BibTeX を取得します。
