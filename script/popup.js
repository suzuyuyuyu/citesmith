const label = document.querySelector('label[for="filenameFormat"]');
if (label) {
  label.title = '論文をダウンロードする際に使用するファイル名のフォーマットを設定します。';
}

/**
 * popup.js
 * - load the saved settings when the popup is opened
 * - save the settings when the save button is clicked
 * - settings are saved in chrome.storage.sync
 */

document.addEventListener('DOMContentLoaded', function () {
  const filenameFormatInput = document.getElementById('filenameFormat');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');

  // read the saved settings in chrome.storage.sync
  chrome.storage.sync.get(['filenameFormat'], function (result) {
    if (result.filenameFormat) {
      filenameFormatInput.value = result.filenameFormat;
    } else {
      filenameFormatInput.value = '${firstAuthorLastNameCaps}${year}-${titleSnakeCase}';
    }
  });

  // save button click event
  saveButton.addEventListener('click', function () {
    const filenameFormat = filenameFormatInput.value;

    // default value handling
    if (!filenameFormat.trim()) {
      filenameFormatInput.value = '${firstAuthorLastNameCaps}${year}-${titleSnakeCase}';
    }

    // save the setting
    chrome.storage.sync.set({
      filenameFormat: filenameFormatInput.value
    }, function () {
      // show the status message
      statusMessage.style.display = 'block';

      chrome.storage.sync.get(['messageDuration'], function(result) {
        const duration = result.messageDuration || 1000;

        setTimeout(function () {
          statusMessage.classList.add('fade');

          statusMessage.addEventListener('transitionend', function handler() {
            statusMessage.style.display = 'none';
            statusMessage.classList.remove('fade');
            statusMessage.removeEventListener('transitionend', handler);
          });
        }, duration);
      });
    });
  });
});

// Enter key event for the filename format input
document.getElementById('filenameFormat').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    document.getElementById('saveButton').click();
  }
});
