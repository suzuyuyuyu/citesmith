import { defaults } from '../src/template.js';
import { messages, message } from '../src/i18n.js';

const form = document.querySelector('form');
const status = document.getElementById('statusMessage');
let timer;
let statusCode;
let statusParams;
const language = () => form.elements.namedItem('language').value === 'ja' ? 'ja' : 'en';
function render() {
  document.documentElement.lang = language();
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = messages[language()][element.dataset.i18n];
  if (statusCode) status.textContent = message(statusCode, language(), statusParams);
}
function show(code, params) {
  clearTimeout(timer);
  statusCode = code;
  statusParams = params;
  render();
  timer = setTimeout(() => { status.textContent = ''; statusCode = ''; }, 2000);
}
form.elements.namedItem('language').addEventListener('change', render);
render();

try {
  const settings = await chrome.storage.sync.get(defaults);
  for (const [key, value] of Object.entries(settings)) {
    const input = form.elements.namedItem(key);
    if (input.type === 'checkbox') input.checked = value;
    else input.value = key === 'language' && value !== 'ja' ? 'en' : value;
  }
  render();
} catch (error) {
  show('loadFailed', { message: error.message });
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
    show('saved');
  } catch (error) {
    show('saveFailed', { message: error.message });
  }
});
