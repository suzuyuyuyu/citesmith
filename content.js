console.log('Load content script');

/**
 * Creates a download button on the page to download the PDF and copy the BibTeX entry.
 * The button is added to the "PDF Options" list in the accessbar.
 * If the button cannot be added to the list, a fallback button is created and added to the body.
 * A MutationObserver is used to monitor DOM changes and re-add the button if it's removed.
 * @param {string} whichSite - A string indicating which site the script is running on. Currently only supports 'sciencedirect'.
 */
function createDownloadButton(whichSite) {
  console.log(new Date().toLocaleString());
  // ボタンを作成
  const downloadButton = document.createElement('li');
  downloadButton.className = 'DownloadFullIssue';
  downloadButton.id = 'custom-download-button'; // 固有のIDを追加
  downloadButton.innerHTML = `
    <button class="button-link accessbar-utility-component button-link-primary" type="button" aria-label="Download PDF & BibTeX">
      <span class="button-link-text-container">
        <span class="button-link-text">
          <span class="custom-dl-btn">
          Download PDF & BibTeX
          </span>
        </span>
      </span>
    </button>
  `;

  // スタイルを追加
  const styleId = 'custom-download-button-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .custom-dl-btn {
        color: #fff;
        background-color: #0272B1;
        padding: 10px;
        transition: all 0.3s;
      }
      .custom-dl-btn:hover {
        color: #0272B1;
        background-color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  // ボタンクリックイベント
  downloadButton.addEventListener('click', async () => {
    try {
      // PDFのURLを取得
      const pdfUrl = document.querySelector('a.link-button.accessbar-utility-component.accessbar-utility-link.link-button-primary.link-button-icon-left')?.href;

      // BibTeXのURLを取得（DOIから構築）
      const currentUrl = window.location.href;
      const pii = currentUrl.split('/').pop();
      const bibTexUrl = `https://www.sciencedirect.com/sdfe/arp/cite?pii=${pii}&format=text%2Fx-bibtex&withabstract=true`;

      if (pdfUrl && bibTexUrl) {
        const response = await fetch(bibTexUrl);
        const bibTeX = await response.text();
        // BibTeXのbraceを二重にする
        const bibTeXDoubleBrace = bibTeX.replace(
          /\b(\w+)\s*=\s*\{([^]*?)\}/g,
          (match, field, content) => {
            return `${field}={{${content.replace(/([{}])/g, '$1$1')}}}`;
          }
        );
        await navigator.clipboard.writeText(bibTeXDoubleBrace);

        // BibTeXから情報を抽出
        const downloadName = extractInfoFromBibTeX(bibTeX);

        console.log(pdfUrl);
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `${downloadName}.pdf`;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // alert('PDF download started and BibTeX copied to clipboard!');
      } else {
        alert('Could not find PDF or BibTeX links');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  });

  // ボタンを追加する関数
  function addButtonToDom() {
    // すでに追加済みの場合は処理しない
    if (document.getElementById('custom-download-button')) {
      return;
    }

    // accessbarクラスのdiv内にあるPDF Optionsリストを探してボタンを追加
    const accessbarDiv = document.querySelector('div.accessbar');
    if (accessbarDiv) {
      const pdfOptionsList = accessbarDiv.querySelector('ul[aria-label="PDF Options"]');
      if (pdfOptionsList) {
        pdfOptionsList.appendChild(downloadButton);
        console.log('Button added to PDF Options list');
        return true; // 追加成功
      }
    }

    // 上記の方法で見つからない場合は別の方法も試す
    const pdfOptionsList = document.querySelector('ul.accessbar[aria-label="PDF Options"]');
    if (pdfOptionsList) {
      pdfOptionsList.appendChild(downloadButton);
      console.log('Button added to accessbar ul');
      return true; // 追加成功
    }
    return false; // 追加失敗
  }

  // 即時に試行
  if (!addButtonToDom()) {
    // フォールバックボタン（最初の試行が失敗した場合）
    const fallbackButton = document.createElement('button');
    fallbackButton.id = 'custom-download-fallback';
    fallbackButton.innerHTML = 'Download PDF & Copy BibTeX';
    fallbackButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      z-index: 9999;
    `;
    fallbackButton.addEventListener('click', event => downloadButton.dispatchEvent(new Event('click')));
    document.body.appendChild(fallbackButton);

    // MutationObserverを使用してDOMの変更を監視し、適切なタイミングでボタンを挿入
    const observer = new MutationObserver((mutations, obs) => {
      if (addButtonToDom()) {
        // ボタンの追加に成功したら、フォールバックボタンを削除
        const fallback = document.getElementById('custom-download-fallback');
        if (fallback) fallback.remove();

        // 成功したら監視を停止
        obs.disconnect();
        console.log('Button added via MutationObserver');
      }
    });

    // body全体の子要素の追加を監視
    observer.observe(document.body, { childList: true, subtree: true });

    // 一定時間後に再試行（SPAサイトで遅延ロードの場合）
    setTimeout(() => {
      if (addButtonToDom()) {
        // ボタンの追加に成功したら、フォールバックボタンを削除
        const fallback = document.getElementById('custom-download-fallback');
        if (fallback) fallback.remove();
        observer.disconnect();
        console.log('Button added via setTimeout');
      }
    }, 2000);
  }

  // MutationObserverを使用してDOMの変更を継続的に監視
  const observer = new MutationObserver((mutations) => {
    // ボタンがない場合のみ追加を試みる
    if (!document.getElementById('custom-download-button')) {
      if (addButtonToDom()) {
        console.log('Button re-added via MutationObserver');

        // フォールバックボタンがあれば削除
        const fallback = document.getElementById('custom-download-fallback');
        if (fallback) fallback.remove();
      }
    }
  });

  // 監視を停止しないで継続的に監視を続ける
  observer.observe(document.body, { childList: true, subtree: true });
}

// get the current URL
const currentUrl = window.location.href;
let do_createDownloadButton = true;
if (currentUrl.includes('sciencedirect.com')) {
  var whichSite = 'sciencedirect';
} else {
  console.log(`Error: This site is not supported`);
  do_createDownloadButton = false;
}

// ページ読み込み完了時に実行
if (do_createDownloadButton) {
  console.log(`Running on ${whichSite}`);
  document.addEventListener('DOMContentLoaded', createDownloadButton(whichSite));
}
