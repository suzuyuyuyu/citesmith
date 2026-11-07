import { placeholders, expandTemplate, buildFilename, sanitizeCitationKey, defaults } from '../src/template.js';

const sample = {
  authors: ['Harris, Charles R.', 'Millman, K. Jarrod', 'van der Walt, Stéfan J.'],
  year: '2020', title: 'Array programming with NumPy', doi: '10.1038/s41586-020-2649-2', journal: 'Nature',
  volume: '585', number: '7825', pages: '357--362', publisher: '', booktitle: '', organization: '',
  url: 'https://www.nature.com/articles/s41586-020-2649-2',
};
const descriptions = {
  author: '全著者を and で連結',
  firstAuthorFullName: '第一著者の名前',
  firstAuthorFirstName: '第一著者の名（ミドルネームを含む）',
  firstAuthorLastName: '第一著者の姓',
  firstAuthorInitials: '名と姓の頭文字',
  firstAuthorFullNameCaps: '名、姓の順に大文字',
  firstAuthorFullNameCapsSnake: '上の空白を _ に置換',
  firstAuthorFullNameCapsKebab: '上の空白を - に置換',
  firstAuthorFirstNameCaps: '名の大文字',
  firstAuthorLastNameCaps: '姓の大文字',
  firstAuthorLastNameLower: '姓の小文字',
  year: '出版年',
  title: 'タイトル',
  titleSnakeCase: 'タイトルの空白を _ に置換',
  titleKebabCase: 'タイトルの空白を - に置換',
  titleCamelCase: 'タイトルを lowerCamelCase に',
  titleFirstWord: '冠詞や前置詞を除いた最初の英単語（小文字）',
  doi: 'DOI', journal: '誌名', volume: '巻', number: '号', pages: 'ページ範囲',
  publisher: '出版社', booktitle: '会議名', organization: '組織名', url: '記事ページの URL',
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
for (const [name, value] of Object.entries(placeholders(sample))) {
  document.getElementById('placeholders').append(row([[`\${${name}}`, true], [descriptions[name] ?? ''], [value || '（空）']]));
}
for (const [format, result] of [
  [defaults.filenameFormat, buildFilename(sample)],
  ['${year}_${firstAuthorLastName}_${titleCamelCase}', buildFilename(sample, '${year}_${firstAuthorLastName}_${titleCamelCase}')],
  [defaults.citationKeyFormat, sanitizeCitationKey(expandTemplate(defaults.citationKeyFormat, sample))],
  ['papers/${journal}', 'papers/Nature/'],
]) document.getElementById('examples').append(row([[format, true], [result, true]]));
