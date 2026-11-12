import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fromMeta } from '../src/sites/index.js';
import { authorsFromBibtex } from '../src/sites/sciencedirect.js';
import { buildFilename, defaults, expandTemplate, sanitizeCitationKey, rewriteBibtex } from '../src/template.js';

const fixture = JSON.parse(await readFile(new URL('fixtures/pages/sciencedirect-S2405844024005395.meta.json', import.meta.url)));
const bib = await readFile(new URL('fixtures/pages/sciencedirect-S2405844024005395.bib', import.meta.url), 'utf8');
const meta = { ...fixture.meta, citation_pdf_url: [fixture.pdfLinks[0][0]] };

test('ScienceDirect fixture supplies metadata, URLs, authors, filename and ASCII citation key', () => {
  const article = fromMeta(meta, fixture.url);
  article.authors = article.authorsFromBibtex(bib);
  assert.equal(article.authors.length, 24);
  assert.equal(article.authors[0], 'Jöran Lücke');
  assert.equal(article.authors.at(-1), 'Anastasios D. Giannou');
  assert.equal(article.title, meta.citation_title[0]);
  assert.equal(article.year, '2024');
  assert.equal(article.doi, '10.1016/j.heliyon.2024.e24508');
  assert.equal(article.journal, 'Heliyon');
  assert.equal(article.volume, '10');
  assert.equal(article.number, '2');
  assert.equal(article.pages, 'e24508');
  assert.equal(article.publisher, 'Elsevier');
  assert.equal(article.pdfUrl, fixture.pdfLinks[0][0]);
  assert.equal(article.bibtexUrl, 'https://www.sciencedirect.com/sdfe/arp/cite?pii=S2405844024005395&format=text%2Fx-bibtex&withabstract=true');
  assert.equal(buildFilename(article), `LÜCKE2024-${meta.citation_title[0].replaceAll(' ', '_')}.pdf`);
  assert.equal(sanitizeCitationKey(expandTemplate(defaults.citationKeyFormat, article)), 'lucke2024obesity');
  assert.equal(rewriteBibtex(bib, article), bib.replace('LUCKE2024e24508', 'lucke2024obesity').replace('SARS-CoV-2', '{SARS-CoV-2}').replace('RNA level', '{RNA} level').trim());
  assert.equal(fromMeta(meta, fixture.url.replace('/pii/', '/abs/pii/')).pdfUrl, article.pdfUrl);
  assert.equal(fromMeta({ ...meta, citation_pdf_url: [new URL(article.pdfUrl).pathname + new URL(article.pdfUrl).search] }, fixture.url).pdfUrl, article.pdfUrl);
});

test('ScienceDirect rejects mismatched PII, foreign or incorrect PDF URLs and missing metadata', () => {
  for (const pdf of ['', fixture.pdfLinks[1][0], fixture.url, `${fixture.url}/pdfft/extra`, fixture.pdfLinks[0][0].replace('https:', 'http:'), fixture.pdfLinks[0][0].replace('www.sciencedirect.com', 'evil.example')]) {
    assert.throws(() => fromMeta({ ...meta, citation_pdf_url: [pdf] }, fixture.url), /PDF/);
  }
  assert.throws(() => fromMeta(meta, fixture.url.replace('https:', 'http:')), /URL/);
  assert.throws(() => fromMeta(meta, `${fixture.url}/pdfft`), /URL/);
  assert.throws(() => fromMeta({ ...meta, citation_pii: ['OTHER'] }, fixture.url), /PII/);
  for (const field of ['citation_title', 'citation_publication_date']) {
    assert.throws(() => fromMeta({ ...meta, [field]: [] }, fixture.url), /Missing/);
  }
  for (const invalid of ['<html>Error</html>', '@article{k,\nauthor = {}\n}', '@article{k,\nauthor = { and }\n}']) {
    assert.throws(() => authorsFromBibtex(invalid), /author/);
  }
});
