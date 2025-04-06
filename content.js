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

  // _/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
  // create download button element
  if (whichSite === 'sciencedirect') {
    var downloadButton = document.createElement('li');
    downloadButton.className = 'DownloadFullIssue';
    downloadButton.id = 'custom-download-button'; // 固有のIDを追加
    downloadButton.innerHTML = `
      <button class="button-link accessbar-utility-component button-link-primary" type="button" aria-label="Download PDF & BibTeX">
        <span class="button-link-text-container">
          <span class="button-link-text">
            <span class="custom-dl-btn">
            <svg id="main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 442.77 293.66" height="14" width="22" style="vertical-align: middle; margin-right: 3px;">
              <defs>
                <style>
                  .svg-btn {
                    fill: #fff;
                  }
                </style>
              </defs>
              <path class="svg-btn" d="M5.55,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/>
              <path class="svg-btn" d="M235.95,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/>
            </svg>
            Cite This Article
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
        .custom-dl-btn:hover .svg-btn {
          fill: #0272B1;
          transition: fill 0.3s;
        }
        .svg-btn {
          transition: fill 0.3s;
        }
      `;
      document.head.appendChild(style);
    }
  } else if (whichSite === 'springer') {
    var downloadButton = document.createElement('div');
    downloadButton.className = 'c-pdf-download u-clear-both u-mb-16';
    downloadButton.id = 'custom-download-button'; // 固有のIDを追加
    downloadButton.innerHTML = `
      <a href="#" class="u-button u-button--full-width u-button--primary u-justify-content-space-between c-pdf-download__link" data-article-pdf="true" data-readcube-pdf-url="true" data-test="pdf-link" data-draft-ignore="true" data-track="content_download" data-track-type="article pdf download" data-track-action="download pdf" data-track-label="button" data-track-external="">
        <svg id="main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 442.77 293.66" height="14" width="22" style="vertical-align: middle; margin-right: 3px;">
          <path class="svg-btn" d="M5.55,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/>
          <path class="svg-btn" d="M235.95,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/>
        </svg>
        <span class="c-pdf-download__text">Cite This Article</span>
        <!-- <svg aria-hidden="true" focusable="false" width="16" height="16" class="u-icon"><use xlink:href="#icon-eds-i-download-medium"></use></svg> -->
      </a>
    `;
  }


  // ボタンクリックイベント
  downloadButton.addEventListener('click', async () => {
    try {
      const currentUrl = window.location.href;
      if (whichSite === 'sciencedirect') {
        // PDFのURLを取得
        var pdfUrl = document.querySelector('a.link-button.accessbar-utility-component.accessbar-utility-link.link-button-primary.link-button-icon-left')?.href;
        // BibTeXのURLを取得（DOIから構築）
        var pii = currentUrl.split('/').pop();
        var bibTexUrl = `https://www.sciencedirect.com/sdfe/arp/cite?pii=${pii}&format=text%2Fx-bibtex&withabstract=true`;
        var response = await fetch(bibTexUrl);
        var bibTeX = await response.text();
      } else if (whichSite === 'springer') {
        var sanitizedUrl = currentUrl.split('#')[0];
        var pdfUrl = sanitizedUrl.replace('/article/', '/content/pdf/') + '.pdf';
        // fixme: debug mode. this requires ris2bibtex
        var bibTeX = ris2bibtex('dummy');
        console.log(bibTeX);
      } else if (whichSite === 'wiley') {
      } else if (whichSite === 'arxiv') {
      }

      if (pdfUrl && bibTeX) {
        // BibTeX to clipboard
        // BibTeXのbraceを二重にする
        const bibTeXDoubleBrace = bibTeX.replace(
          /\b(\w+)\s*=\s*\{([^]*?)\}/g,
          (match, field, content) => {
            return `${field}={{${content.replace(/([{}])/g, '$1$1')}}}`;
          }
        );
        await navigator.clipboard.writeText(bibTeXDoubleBrace);

        // ストレージから保存されたフォーマット設定を取得
        const filenameFormat = await new Promise((resolve) => {
          chrome.storage.sync.get(['filenameFormat'], function(result) {
            if (result.filenameFormat) {
              resolve(result.filenameFormat);
            } else {
              // デフォルト値
              resolve('${firstAuthorLastNameCaps}${year}-${titleSnakeCase}');
            }
          });
        });

        // Download PDF
        // BibTeXから情報を抽出（保存されたフォーマット設定を使用）
        const downloadName = extractInfoFromBibTeX(bibTeX, filenameFormat);

        console.log(`Using format: ${filenameFormat}`);
        console.log(`Generated filename: ${downloadName}.pdf`);

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
  function addButtonToDom(whichSite) {
    // すでに追加済みの場合は処理しない
    if (document.getElementById('custom-download-button')) {
      return;
    }
    // accessbarクラスのdiv内にあるPDF Optionsリストを探してボタンを追加
    if (whichSite === 'sciencedirect') {
      const accessbarDiv = document.querySelector('div.accessbar');
      if (accessbarDiv) {
        const pdfOptionsList = accessbarDiv.querySelector('ul[aria-label="PDF Options"]');
        if (pdfOptionsList) {
          pdfOptionsList.appendChild(downloadButton);
          console.log('Button added to PDF Options list');
          return true; // 追加成功
        }
      }
    } else if (whichSite === 'springer') {
      const pdfContainer = document.querySelector('div.c-pdf-container');
      if (pdfContainer) {
        pdfContainer.appendChild(downloadButton);
        console.log('Button added to PDF Options list');
        return true; // 追加成功
      }
    }
  }

  // This might be unnecessary
  if (!addButtonToDom(whichSite)) {
    console.log('Button not added immediately, creating fallback button');
    // MutationObserverを使用してDOMの変更を監視し、適切なタイミングでボタンを挿入
    const observer = new MutationObserver((mutations, obs) => {
      // ボタンがない場合のみ追加を試みる
      if (!document.getElementById('custom-download-button')) {
        if (addButtonToDom(whichSite)) {
          console.log('Button added via MutationObserver');
          // フォールバックボタンがあれば削除
          const fallback = document.getElementById('custom-download-fallback');
          if (fallback) fallback.remove();
          obs.disconnect(); // 監視を停止
        }
      } else {
        console.log('Button already exists, stopping observer');
        obs.disconnect(); // ボタンが見つかったら監視を停止
      }
    });

    // body全体の子要素の追加を監視
    observer.observe(document.body, { childList: true, subtree: true });

    // 一定時間後に再試行（SPAサイトで遅延ロードの場合）
    setTimeout(() => {
      if (addButtonToDom(whichSite)) {
        // ボタンの追加に成功したら、フォールバックボタンを削除
        const fallback = document.getElementById('custom-download-fallback');
        if (fallback) fallback.remove();
        observer.disconnect();
        console.log('Button added via setTimeout');
      }
    }, 2000);
  }

  console.log('Button creation function executed');
  // MutationObserverを使用してDOMの変更を継続的に監視
  const observer = new MutationObserver((mutations) => {
    console.log('DOM changed, checking for button');
    // ボタンがない場合のみ追加を試みる
    if (!document.getElementById('custom-download-button')) {
      console.log('Button not found, trying to add again');
      if (addButtonToDom(whichSite)) {
        console.log('Button re-added via MutationObserver');
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
} else if (currentUrl.includes('onlinelibrary.wiley.com')) {
  var whichSite = 'wiley';
} else if (currentUrl.includes('link.springer.com')) {
  var whichSite = 'springer';
} else if (currentUrl.includes('arxiv.org')) {
  var whichSite = 'arxiv';
} else {
  console.log(`Error: This site is not supported`);
  do_createDownloadButton = false;
}

// ページ読み込み完了時に実行
if (do_createDownloadButton) {
  console.log(`Running on ${whichSite}`);
  document.addEventListener('DOMContentLoaded', createDownloadButton(whichSite));
}
