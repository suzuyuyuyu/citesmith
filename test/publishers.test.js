import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractMeta } from '../scripts/probe.mjs';
import { fromMeta } from '../src/sites/index.js';
import { buildFilename, defaults, expandTemplate, rewriteBibtex } from '../src/template.js';

const fixtures = [
  {
    file: 'springer-epjc-s10052-024-12995-0', doi: '10.1140/epjc/s10052-024-12995-0',
    filename: 'ALDABERGENOV2024-Hybrid_inflation_from_supersymmetry_breaking.pdf',
    key: 'aldabergenov2024hybrid', bib: 'springer-epjc-12995', oldKey: 'Aldabergenov2024',
  },
  {
    file: 'springer-discover-s42452-025-06497-1', doi: '10.1007/s42452-025-06497-1',
    filename: 'SHARMA2025-Non-invasive_imaging_assisted_CFD_simulation_of_4D_multi-modal_fluid_flow_using_in-situ_adaptor.pdf',
    key: 'sharma2025non',
  },
  {
    file: 'wiley-ece3.71938', doi: '10.1002/ece3.71938',
    filename: 'UMBREEN2025-Effect_of_Environmental_Drivers_on_Functional_Traits_of_Salvadora_Population_in_the_Semi-Arid_Regions_A_Case_Study_From_Division_Sahiwal_Pakistan.pdf',
    key: 'umbreen2025effect', bib: 'wiley-ece3.71938', oldKey: 'https://doi.org/10.1002/ece3.71938',
  },
  {
    file: 'wiley-eng2.70866', doi: '10.1002/eng2.70866',
    filename: 'KHALIFA2026-A_Comprehensive_Systematic_Review_of_Cyber-Physical_Systems_Security_Threats,_Challenges,_and_Defense_in_ICSOT_Environments.pdf',
    key: 'khalifa2026comprehensive',
  },
];

for (const fixture of fixtures) {
  const springer = fixture.file.startsWith('springer');
  const origin = springer ? 'https://link.springer.com' : 'https://onlinelibrary.wiley.com';
  const url = `${origin}/${springer ? 'article' : 'doi'}/${fixture.doi}`;
  const meta = extractMeta(await readFile(new URL(`fixtures/pages/${fixture.file}.html`, import.meta.url), 'utf8'));
  const article = fromMeta(meta, url);

  test(`${fixture.file}: captured metadata produces filename, key and download URLs`, () => {
    assert.equal(buildFilename(article), fixture.filename);
    assert.equal(expandTemplate(defaults.citationKeyFormat, article), fixture.key);
    assert.equal(article.pdfUrl, springer ? `${origin}/content/pdf/${fixture.doi}.pdf` : `${origin}/doi/pdfdirect/${fixture.doi}?download=true`);
    assert.equal(article.bibtexUrl, springer
      ? `https://citation-needed.springer.com/v2/references/${fixture.doi}?format=bibtex&flavour=citation`
      : `${origin}/action/downloadCitation?doi=${encodeURIComponent(fixture.doi)}&format=bibtex&include=abs`);
    if (!springer) {
      for (const path of ['full', 'abs']) {
        assert.equal(fromMeta(meta, `${origin}/doi/${path}/${fixture.doi}`).pdfUrl, article.pdfUrl);
      }
      assert.equal(fromMeta({ ...meta, citation_pdf_url: ['https://evil.example/viewer'] }, url).pdfUrl, article.pdfUrl);
      for (const path of ['pdf', 'epdf', 'pdfdirect', 'epub']) {
        assert.throws(() => fromMeta(meta, `${origin}/doi/${path}/${fixture.doi}`), /URL/);
      }
    } else {
      for (const pdf of ['', 'https://evil.example/a.pdf', 'javascript:alert(1)', url, `${origin}/doi/pdf/example`]) {
        assert.throws(() => fromMeta({ ...meta, citation_pdf_url: [pdf] }, url), /PDF/);
      }
      assert.throws(() => fromMeta(meta, `${origin}/book/${fixture.doi}`), /URL/);
    }
    assert.throws(() => fromMeta(meta, url.replace('https:', 'http:')), /URL/);
    assert.throws(() => fromMeta({ ...meta, citation_doi: ['invalid'] }, url), /DOI/);
    assert.throws(() => fromMeta({ ...meta, citation_author: [] }, url), /Missing/);
    assert.throws(() => fromMeta({ ...meta, citation_publication_date: [] }, url), /Missing/);
  });

  if (fixture.bib) {
    const bib = await readFile(new URL(`fixtures/pages/${fixture.bib}.bib`, import.meta.url), 'utf8');
    test(`${fixture.file}: saved BibTeX changes only key, title protection and surrounding whitespace`, () => {
      const expected = bib.replace(fixture.oldKey, fixture.key).replace('Semi-Arid', '{Semi-Arid}').trim();
      assert.equal(rewriteBibtex(bib, article), expected);
      // Exercise inner capitals in both the quoted and braced export formats.
      const title = springer ? 'title="' : 'title = {';
      assert.equal(rewriteBibtex(bib.replace(title, `${title}DNA NumPy `), article),
        expected.replace(title, `${title}{DNA} {NumPy} `));
    });
  }
}
