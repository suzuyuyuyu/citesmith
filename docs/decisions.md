# 決定事項

計画と調査結果の詳細は [plan.html](plan.html) を参照。

## 2026-11-07

- 目標は次の3つ。
  1. 対応ページに Citesmith ボタンを置く
  2. 指定したファイル名で PDF をダウンロードする
  3. BibTeX をクリップボードにコピーする
- 対象サイトは ScienceDirect (Elsevier)、Springer (link.springer.com)、Nature (nature.com)、Wiley Online Library、arXiv。
- HTML を細かくスクレイピングするのはやめ、サイトや DOI 基盤が提供する情報（`citation_*` メタタグ、BibTeX エクスポート、DOI コンテントネゴシエーション）を使う。
- 作業ログ（`log/`）は原則として作らない。
- BibTeX の引用キーも、ファイル名と同じプレースホルダーで書式を設定できるようにする。
- 「PDF をダウンロード」「BibTeX をコピー」はポップアップのチェックボックスで個別にオン／オフできるようにする。
- arXiv の BibTeX の `year` は初版（v1）の年にする。arXiv の `/bibtex` は最新版の年を返すため置き換える。
- BibTeX の大文字保護は `title` だけに適用し、2文字目以降に大文字を含む単語（`NumPy`、`B-spline`、`DNA` など）だけを `{}` で囲む。著者などほかのフィールドは囲まない（著者を囲むと1人の団体名として扱われるため）。
- 実装の順番は、土台 → arXiv と Nature → ScienceDirect と Springer → Wiley。

### 土台と arXiv・Nature の実装

- 今回の有効な対象は `arxiv.org/abs/*` と `www.nature.com/articles/*` に限定。計画の5サイトは今後の対象を含む。
- ルートの manifest から `src/background.js`（ES module）と `src/content.js`（classic script）を読み込む。テンプレートは `src/template.js` に配置する（計画の `filename.js` 案から名称を確定）。
- ファイル名の既存設定 `filenameFormat` を引き継ぎ、`citationKeyFormat`、`downloadPdf`、`copyBibtex` を追加。初期値は今回の依頼どおりとし、操作の失敗は個別に扱う。
- BibTeX の書き換えは、引用キー、`title` の大文字保護、arXiv の初版年の3つだけ。ファイル名用の情報はメタタグから取る。
- ファイル名本体は UTF-8 で180バイト以内とし、`.pdf` を自動付与。引用キーとファイル名が空になった場合は `paper` を使用。不明なプレースホルダーはエラーにする。
- 旧 README の `authors` / `authors[1]` は旧コードにも実装がなかったため、実装済みの `author` を案内する。
- 開発確認は Node 24 の `node --test` と `scripts/probe.mjs`。追加依存・ビルドは不要。
- ボタンの配置先は arXiv が `.full-text`、Nature が `.c-pdf-download`。表示されている最初の要素を使う（Nature には非表示の複製がある）。見つからなければ右下に固定表示する。
- Chrome での動作確認は `scripts/e2e.mjs` で行う。CDP の `Extensions.loadUnpacked` を使う（市販版 Chrome は `--load-extension` を無視するため）。CDP の `Browser.setDownloadBehavior` は拡張が指定したファイル名を上書きするので使わず、プロファイルの設定でダウンロード先を決める。
- Springer の BibTeX サービスは DOI の `/` をエンコード（`%2F`）すると 404 を返すので、`/` はそのまま渡す。
- `test/fixtures/pages/` は、Chrome で採取した Springer と Wiley のページ抜粋、および各サイトの BibTeX 応答。次の段階のテストに使う。

### Springer・Wiley の追加

- Springer の BibTeX URL 生成を Nature と共有し、取得は既存の service worker で行う。
- Wiley の PDF は HTML ビューアを指す `citation_pdf_url` を使わず、`/doi/pdfdirect/<DOI>?download=true` を使う。記事ページは通常・full・abs の3形式を対象とする。
- ボタンは Springer の `.app-article-masthead__buttons .c-pdf-download`、Wiley の `nav.coolBar .coolBar__second` で最初に表示されている要素に置く。なければ既存の固定表示を使う。
- PDF の共通検証は HTTPS・同一オリジンまでとし、サイト固有のパス検証・URL 生成は各アダプタで行う。BibTeX は前後の空白を除去する。

### ScienceDirect の追加

- ScienceDirect は通常・abs の記事ページに対応し、最初に表示されている `.content-actions` にボタンを置く。なければ既存の固定表示を使う。
- `citation_pdf_url` がない場合は content script のサイト別フックで自身の PII の `pdfft` リンクを補完する。アダプタで HTTPS・同一オリジン・自身の PII のパスを検証する。
- ScienceDirect の `pdfft` は拡張から直接ダウンロードすると JavaScript のロボット確認ページを返す。確認処理は回避せず、PDF リンクを裏のタブで開き（手で押したのと同じ）、`pdf.sciencedirectassets.com` は拡張からの2回目の取得にも Cloudflare の確認ページを返すため、取り直しはしない。そのタブ専用の一時ルール（declarativeNetRequest）で、`application/pdf` の応答だけを添付ファイル扱いにしてタブ自身の通信でダウンロードさせ、`downloads.onDeterminingFilename` で指定のファイル名を付けてタブを閉じる。60秒で届かなければエラーにし、タブを前面に出して残す。このため `declarativeNetRequestWithHostAccess` 権限と `pdf.sciencedirectassets.com` のホスト権限を追加する。
- ScienceDirect の著者は BibTeX の `author` を ` and ` で分割する。コピーがオフでも有効な操作があれば取得し、コピー用の応答は返さない。タイトルはメタタグを使い、著者を取得できない場合は不完全なファイル名で保存しない。

### 保存先フォルダ

- ポップアップに「保存先フォルダ」を追加する。`chrome.downloads` はブラウザのダウンロードフォルダからの相対パスしか受け付けないため、ダウンロードフォルダ内のサブフォルダとして指定する。空欄ならダウンロードフォルダ直下。各階層にプレースホルダーを使える（例：`papers/${journal}`）。

### 見た目

- ページ上のボタンは色（`#202020`）を固定し、高さ、角丸、余白、上下位置だけを各サイトの PDF ボタンに合わせる。アイコンはロゴの引用符（`assets/svg/quote.svg`）を使う。
- ポップアップのフッターは「© 2026 Yuta Suzuki」。プレースホルダーの説明は別ページ `help.html` にし、例の値は `src/template.js` で実際に生成して表示する（コードと説明がずれないように）。
- ボタンは分割ボタンにする。本体はポップアップの設定どおりに動き、右の ▾ メニューの「PDF + BibTeX」「PDF only」「BibTeX only」はその1回だけ設定を上書きする（保存された設定は変えない）。ページ上のボタンとメニューは英語表記（対象サイトが英語のため）。

### 表示言語

- 表示言語は英語を初期値とし、ポップアップで日本語に切り替えられるようにする（ブラウザの言語設定ではなく拡張の設定）。対象はページ上のボタン、ホバー時のエラー理由、ポップアップ、説明ページ。
- README は英語の `README.md` と日本語の `README-ja.md` に分ける。`docs/` の計画・決定事項は日本語のまま。
