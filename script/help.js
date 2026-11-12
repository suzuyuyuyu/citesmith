import { messages } from '../src/i18n.js';
import { placeholders, expandTemplate, buildFilename, sanitizeCitationKey, defaults } from '../src/template.js';

const sample = {
  authors: ['Harris, Charles R.', 'Millman, K. Jarrod', 'van der Walt, Stéfan J.'],
  year: '2020', title: 'Array programming with NumPy', doi: '10.1038/s41586-020-2649-2', journal: 'Nature',
  volume: '585', number: '7825', pages: '357--362', publisher: '', booktitle: '', organization: '',
  url: 'https://www.nature.com/articles/s41586-020-2649-2',
};

const row = (cells) => {
  const tr = document.createElement('tr');
  for (const [text, code] of cells) {
    const td = document.createElement('td');
    if (code) td.append(Object.assign(document.createElement('code'), { textContent: text }));
    else td.textContent = text;
    tr.append(td);
  }
  return tr;
};
function render(language) {
  const lang = language === 'ja' ? 'ja' : 'en';
  const text = messages[lang];
  document.documentElement.lang = lang;
  for (const element of document.querySelectorAll('[data-i18n]')) element.innerHTML = text[element.dataset.i18n];
  document.getElementById('placeholders').replaceChildren();
  document.getElementById('examples').replaceChildren();
  for (const [name, value] of Object.entries(placeholders(sample))) {
    document.getElementById('placeholders').append(row([[`\${${name}}`, true], [text.descriptions[name] ?? ''], [value || text.empty]]));
  }
  for (const [format, result] of [
    [defaults.filenameFormat, buildFilename(sample)],
    ['${year}_${firstAuthorLastName}_${titleCamelCase}', buildFilename(sample, '${year}_${firstAuthorLastName}_${titleCamelCase}')],
    [defaults.citationKeyFormat, sanitizeCitationKey(expandTemplate(defaults.citationKeyFormat, sample))],
    ['papers/${journal}', 'papers/Nature/'],
  ]) document.getElementById('examples').append(row([[format, true], [result, true]]));
}
render('en');
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.language) render(changes.language.newValue);
});
try {
  const { language } = await chrome.storage.sync.get({ language: 'en' });
  render(language);
} catch {}
