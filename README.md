<div style="display: flex; align-items: center; justify-content: center; margin: 0px; padding: 0px;">
  <img src="./assets/svg/READMElogo.svg" width="100%" alt="Logo" style="margin-left: 3%;"/>
</div>

## Description
ScienceDirectなどの学術的なサイトからPDFをダウンロードするときに、ファイル名を適切に設定し、同時にBibTeXをクリップボードにコピーするためのツールです。

## Usage
Chromeの拡張機能として読み込むことで使うことができます。
Chromeのサイトでは配布していませんので、適当なディレクトリにcloneして読み込んでください。
このリポジトリに変更があったらpullしてリロードすれば最新版に更新されます。

## Roadmap/Will be implemented
### Test
- [x] ダウンロードするファイル名を変更する
- [x] BibTeXをクリップボードにコピーする
- [x] プロセスを実行するボタンをページ内に表示（appendChild）する

### Features
- [ ] ファイル名をプレースホルダーを用いて設定できるようにする
  - [ ] ファイル名のプレースホルダー
    - [ ] Author
    - [ ] Title
    - [ ] Year
    - [ ] DOI
    - [ ] Journal
    - [ ] Volume
  - [ ] プレースホルダーの設定方法: [Issue #2](https://github.com/suzuyuyuyu/ext-download-manager/issues/2)
    - [ ] popup.html (popup)
    - [ ] chrome.storage.sync
- [ ] Lists of supported sites
  - [x] ScienceDirect
  - [ ] Springer Nature
  - [ ] Wiley Online Library
  - [ ] arXiv
- [ ] ris to bibtex: [Issue #1](https://github.com/suzuyuyuyu/ext-download-manager/issues/1)

## Contact
