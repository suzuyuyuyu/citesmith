import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fromMeta } from '../src/sites/index.js';
import { defaults, placeholders, expandTemplate, sanitizeFilename, sanitizeCitationKey, buildFilename, rewriteBibtex, protectTitleCase } from '../src/template.js';

const arxiv = fromMeta(JSON.parse(await readFile(new URL('fixtures/arxiv.json', import.meta.url))), 'https://arxiv.org/abs/1706.03762');
const nature = fromMeta(JSON.parse(await readFile(new URL('fixtures/nature.json', import.meta.url))), 'https://www.nature.com/articles/s41586-020-2649-2');

test('default filenames and citation keys use meta', () => {
  assert.equal(buildFilename(arxiv), 'VASWANI2017-Attention_Is_All_You_Need.pdf');
  assert.equal(buildFilename(nature), 'HARRIS2020-Array_programming_with_NumPy.pdf');
  assert.equal(buildFilename(nature, '${year}', ' papers/../${journal}\\ /'), 'papers/paper/Nature/2020.pdf');
  assert.equal(expandTemplate(defaults.citationKeyFormat, arxiv), 'vaswani2017attention');
  assert.equal(expandTemplate(defaults.citationKeyFormat, nature), 'harris2020array');
});

test('legacy name/title placeholders and meta fields', () => {
  const values = placeholders(nature);
  assert.equal(values.firstAuthorFirstName, 'Charles R.');
  assert.equal(values.firstAuthorLastName, 'Harris');
  assert.equal(values.firstAuthorInitials, 'CH');
  assert.equal(values.firstAuthorFullNameCapsSnake, 'CHARLES_R._HARRIS');
  assert.equal(values.firstAuthorFullNameCapsKebab, 'CHARLES-R.-HARRIS');
  assert.equal(values.titleCamelCase, 'arrayProgrammingWithNumpy');
  assert.equal(values.titleKebabCase, 'Array-programming-with-NumPy');
  assert.equal(values.pages, '357--362');
  assert.equal(expandTemplate('${journal}:${volume}:${number}:${publisher}:${booktitle}:${organization}', nature), 'Nature:585:7825:::');
  assert.equal(expandTemplate('${title} ${title}', nature), `${nature.title} ${nature.title}`);
  assert.match(values.author, /^Harris,/);
  assert.throws(() => expandTemplate('${typo}', nature), /不明/);
  assert.equal(expandTemplate('${title}', { ...nature, title: '$& $1' }), '$& $1');
});

test('name fallback, ASCII title word and stopwords', () => {
  const values = placeholders({ ...nature, authors: ['Émilie Dupré'], title: 'The étude of arrays' });
  assert.equal(values.firstAuthorFirstName, 'Émilie');
  assert.equal(values.firstAuthorLastNameLower, 'dupré');
  assert.equal(values.titleFirstWord, 'etude');
  assert.equal(placeholders({ ...nature, authors: ['Group'] }).firstAuthorFirstName, '');
  assert.equal(placeholders({ ...nature, title: 'The and of' }).titleFirstWord, '');
});

test('filename strips forbidden characters and handles byte limits and OS names', () => {
  assert.equal(sanitizeFilename(' ../a\\b:c*d?e"f<g>h|i\u0000\u0085  j  '), 'abcdefghi j');
  assert.equal(sanitizeFilename('...'), 'paper');
  assert.equal(sanitizeFilename('CON'), '_CON');
  assert.equal(sanitizeFilename('nul.txt'), '_nul.txt');
  assert.ok(new TextEncoder().encode(sanitizeFilename('語'.repeat(200))).length <= 180);
  assert.equal(sanitizeFilename('hello. '), 'hello');
});

test('citation keys fold diacritics and allow only the specified ASCII characters', () => {
  assert.equal(sanitizeCitationKey('Düpré 2020/é_:.-{}\\'), 'Dupre2020e_:.-');
  assert.equal(sanitizeCitationKey('日本語'), 'paper');
});

test('BibTeX changes only the key and title case protection for Nature', () => {
  const bib = '@article{Harris2020,\n  title="Array {programming} with NumPy and DNA",\n  author="Harris, Charles R.",\n  year="2020",\n  note="keep $& NumPy"\n}\n';
  const protectedBib = bib.replace('with NumPy and DNA', 'with {NumPy} and {DNA}');
  assert.equal(rewriteBibtex(bib, nature), protectedBib.replace('Harris2020', 'harris2020array').trim());
  assert.equal(rewriteBibtex(bib, nature, 'Éxample_:.-'), protectedBib.replace('Harris2020', 'Example_:.-').trim());
  assert.throws(() => rewriteBibtex('<html>Error</html>', nature), /不正/);
});

test('title protects only words with inner capitals', () => {
  const bib = '@article{k,\n  booktitle={DNA Book},\n  title={Array {NumPy} with numPy, DNA, B-spline and \\"{U}ber X-ray FEM},\n  author={Sugai, Riichi}\n}';
  assert.equal(protectTitleCase(bib), bib.replace(
    'title={Array {NumPy} with numPy, DNA, B-spline and \\"{U}ber X-ray FEM}',
    'title={Array {NumPy} with {numPy}, {DNA}, {B-spline} and \\"{U}ber {X-ray} {FEM}}'));
});

test('arXiv overrides latest-version year with first submission year', () => {
  for (const year of ['{2023}', '"2023"', '2023']) {
    const bib = `@misc{old,\n title={Attention {Is} All You Need},\n year=${year},\n eprint={1706.03762}\n}`;
    const result = rewriteBibtex(bib, arxiv);
    assert.equal(result, bib.replace('old,', 'vaswani2017attention,').replace('2023', '2017'));
  }
  assert.throws(() => rewriteBibtex('@misc{old,\n title={missing year}\n}', arxiv), /year/);
});
