// Add a tooltip to the "ファイル名のフォーマット：" label
const label = document.querySelector('label[for="filenameFormat"]');
if (label) {
  label.title = '論文をダウンロードする際に使用するファイル名のフォーマットを設定します。';
}

/**
 * ポップアップUIの機能を制御するスクリプトです。
 * - ページ読み込み時に保存された設定を読み込みます
 * - 設定の保存をハンドリングします
 * - chrome.storage.syncを使用してデータを永続的に保存します
 */

document.addEventListener('DOMContentLoaded', function () {
  const filenameFormatInput = document.getElementById('filenameFormat');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');

  // 保存されている設定を読み込む
  chrome.storage.sync.get(['filenameFormat'], function (result) {
    if (result.filenameFormat) {
      filenameFormatInput.value = result.filenameFormat;
    } else {
      filenameFormatInput.value = '${firstAuthorLastNameCaps}${year}-${titleSnakeCase}';
    }
  });

  // 保存ボタンのクリックイベントを処理
  saveButton.addEventListener('click', function () {
    const filenameFormat = filenameFormatInput.value;

    // 空の場合はデフォルト値に戻す
    if (!filenameFormat.trim()) {
      filenameFormatInput.value = '${firstAuthorLastNameCaps}${year}-${titleSnakeCase}';
    }

    // 設定を保存
    chrome.storage.sync.set({
      filenameFormat: filenameFormatInput.value
    }, function () {
      // まず表示する
      statusMessage.style.display = 'block';

      chrome.storage.sync.get(['messageDuration'], function(result) {
        const duration = result.messageDuration || 1000;

        // 指定時間後にフェードアウト開始
        setTimeout(function () {
          // フェードアウト開始
          statusMessage.classList.add('fade');

          // トランジション完了後に非表示にする
          statusMessage.addEventListener('transitionend', function handler() {
            // トランジション完了後に非表示に設定
            statusMessage.style.display = 'none';
            statusMessage.classList.remove('fade');
            statusMessage.removeEventListener('transitionend', handler);
          });
        }, duration);
      });
    });
  });
});

// Enterキーで保存
document.getElementById('filenameFormat').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    document.getElementById('saveButton').click();
  }
});
