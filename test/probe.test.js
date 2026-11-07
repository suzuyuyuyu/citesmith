import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMeta, probe } from '../scripts/probe.mjs';

const html = `<meta content="The &quot;Arrays&quot; &amp; caf&#233; &#x41;" name="citation_title">
<meta name='citation_author' content='Harris, Charles R.'>
<meta name="citation_author" content="Other, Author">
<meta name="citation_publication_date" content="2020/09/16">
<meta name="citation_doi" content="10.1038/s41586-020-2649-2">
<meta name="citation_pdf_url" content="https://www.nature.com/articles/s41586-020-2649-2.pdf">`;

test('probe extracts repeated meta values, either quote style, attribute order and entities', () => {
  const meta = extractMeta(html);
  assert.equal(meta.citation_title[0], 'The "Arrays" & café A');
  assert.deepEqual(meta.citation_author, ['Harris, Charles R.', 'Other, Author']);
});

test('probe uses shared adapter and template logic (mock HTTP)', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  try {
    globalThis.fetch = async (url) => {
      requests.push(url);
      return new Response(requests.length === 1 ? html : '@article{Harris2020,\n title="Example",\n year="2020"\n}');
    };
    const result = await probe('https://www.nature.com/articles/s41586-020-2649-2');
    assert.equal(result.filename, 'HARRIS2020-The_Arrays_&_café_A.pdf');
    assert.match(result.bibtex, /^@article\{harris2020arrays,/);
    assert.equal(requests.length, 2);
    assert.equal(new URL(requests[1]).hostname, 'citation-needed.springer.com');
    globalThis.fetch = async () => new Response('', { status: 403 });
    await assert.rejects(probe('https://arxiv.org/abs/1706.03762'), /HTTP 403/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
