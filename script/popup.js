import { defaults } from '../src/template.js';

const form = document.querySelector('form');
const status = document.getElementById('statusMessage');
let timer;
function show(message) {
  clearTimeout(timer);
  status.textContent = message;
  timer = setTimeout(() => { status.textContent = ''; }, 2000);
}

try {
  const settings = await chrome.storage.sync.get(defaults);
  for (const [key, value] of Object.entries(settings)) {
    const input = form.elements.namedItem(key);
    if (input.type === 'checkbox') input.checked = value;
    else input.value = value;
  }
} catch (error) {
  show(`読み込み失敗: ${error.message}`);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    const input = form.elements.namedItem(key);
    settings[key] = input.type === 'checkbox' ? input.checked : input.value.trim() || fallback;
    if (input.type !== 'checkbox') input.value = settings[key];
  }
  try {
    await chrome.storage.sync.set(settings);
    show('保存しました');
  } catch (error) {
    show(`保存失敗: ${error.message}`);
  }
});
