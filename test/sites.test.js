import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fromMeta as arxiv } from '../src/sites/arxiv.js';
import { fromMeta as nature } from '../src/sites/nature.js';
import { fromMeta } from '../src/sites/index.js';

const arxivMeta = JSON.parse(await readFile(new URL('fixtures/arxiv.json', import.meta.url)));
const natureMeta = JSON.parse(await readFile(new URL('fixtures/nature.json', import.meta.url)));
const arxivUrl = 'https://arxiv.org/abs/1706.03762';
const natureUrl = 'https://www.nature.com/articles/s41586-020-2649-2';

test('arXiv adapter uses first submission metadata and all authors', () => {
  const article = arxiv(arxivMeta, arxivUrl);
  assert.equal(article.year, '2017');
  assert.equal(article.title, 'Attention Is All You Need');
  assert.equal(article.authors.length, 8);
  assert.equal(article.authors[0], 'Vaswani, Ashish');
  assert.equal(article.pdfUrl, 'https://arxiv.org/pdf/1706.03762');
  assert.equal(article.bibtexUrl, 'https://arxiv.org/bibtex/1706.03762');
  assert.equal(arxiv({ ...arxivMeta, citation_arxiv_id: ['hep-th/9901001v2'] }, arxivUrl).arxivId, 'hep-th/9901001v2');
});

test('Nature adapter gets date and DOI and uses Springer citation endpoint', () => {
  const article = nature(natureMeta, natureUrl);
  assert.equal(article.year, '2020');
  assert.equal(article.doi, '10.1038/s41586-020-2649-2');
  assert.equal(article.authors[0], 'Harris, Charles R.');
  assert.equal(article.pdfUrl, `${natureUrl}.pdf`);
  const endpoint = new URL(article.bibtexUrl);
  // the service 404s on an encoded slash (%2F)
  assert.equal(endpoint.pathname, '/v2/references/10.1038/s41586-020-2649-2');
  assert.equal(endpoint.search, '?format=bibtex&flavour=citation');
});

test('adapter routing and missing metadata fail explicitly', () => {
  assert.equal(fromMeta(arxivMeta, arxivUrl).arxivId, '1706.03762');
  assert.equal(fromMeta(natureMeta, natureUrl).journal, 'Nature');
  assert.throws(() => fromMeta(natureMeta, 'https://example.com/articles/1'), /Unsupported/);
  assert.throws(() => arxiv({ ...arxivMeta, citation_date: [] }, arxivUrl), /Missing/);
  assert.throws(() => nature({ ...natureMeta, citation_author: [] }, natureUrl), /Missing/);
  assert.throws(() => nature({ ...natureMeta, citation_doi: ['invalid'] }, natureUrl), /DOI/);
  assert.throws(() => arxiv({ ...arxivMeta, citation_arxiv_id: ['../bad'] }, arxivUrl), /ID/);
});

test('reject foreign PDF URLs and unsupported page paths', () => {
  for (const pdf of ['https://evil.example/x.pdf', 'javascript:alert(1)', natureUrl, '']) {
    assert.throws(() => nature({ ...natureMeta, citation_pdf_url: [pdf] }, natureUrl), /PDF/);
  }
  assert.throws(() => arxiv(arxivMeta, 'http://arxiv.org/abs/1706.03762'), /URL/);
  assert.throws(() => nature(natureMeta, `${natureUrl}.pdf/more`), /URL/);
});
