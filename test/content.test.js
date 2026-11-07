import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/content.js', import.meta.url), 'utf8');

function page(anchorPresent, result, clipboardError = false, url = 'https://arxiv.org/abs/1706.03762', selector = '.full-text', metaTags, links = []) {
  const label = {};
  const button = { style: {}, querySelector: () => label, addEventListener(_, fn) { this.click = fn; } };
  const inserted = [];
  const anchor = { append: (element) => inserted.push(['anchor', element]), getClientRects: () => [{}] };
  const hidden = { append: () => assert.fail('hidden anchor used'), getClientRects: () => [] };
  const messages = [];
  const copied = [];
  const timers = [];
  const observers = [];
  const context = {
    MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} },
    location: new URL(url),
    document: {
      getElementById: () => null,
      createElement: () => button,
      querySelector: (requested) => links.find((link) => link.href.includes(requested.match(/href\*="([^"]+)"/)[1])),
      querySelectorAll: (requested) => requested === selector ? [hidden, ...(anchorPresent ? [anchor] : [])] : metaTags || [
        { name: 'citation_author', content: 'Vaswani, Ashish' },
        { name: 'citation_author', content: 'Shazeer, Noam' },
      ],
      body: { append: (element) => inserted.push(['body', element]) },
    },
    chrome: { runtime: { async sendMessage(message) { messages.push(message); return result; } } },
    navigator: { clipboard: { async writeText(text) {
      if (clipboardError) throw new Error('Clipboard denied');
      copied.push(text);
    } } },
    setTimeout: (fn) => timers.push(fn),
  };
  vm.runInNewContext(source, context);
  return { button, label, inserted, messages, copied, timers, observers };
}

test('button is re-inserted after the page drops it', () => {
  const state = page(true, {});
  state.button.isConnected = true;
  state.observers[0]();
  assert.equal(state.inserted.length, 1);
  state.button.isConnected = false;
  state.observers[0]();
  assert.deepEqual(state.inserted.map(([where]) => where), ['anchor', 'anchor']);
});

test('page click collects repeated meta, copies returned BibTeX and resets feedback', async () => {
  const state = page(true, { bibtex: '@article{example,}', errors: [] });
  assert.equal(state.inserted[0][0], 'anchor');
  await state.button.click();
  assert.equal(state.messages[0].url, 'https://arxiv.org/abs/1706.03762');
  assert.equal(JSON.stringify(state.messages[0].meta), '{"citation_author":["Vaswani, Ashish","Shazeer, Noam"]}');
  assert.deepEqual(state.copied, ['@article{example,}']);
  assert.equal(state.label.textContent, '完了');
  await state.button.click();
  assert.equal(state.messages.length, 1);
  state.timers[0]();
  assert.equal(state.button.disabled, false);
  assert.equal(state.label.textContent, 'Citesmith');
});

test('supported hosts select the first rendered anchor and retain fixed fallback', () => {
  for (const [url, selector] of [
    ['https://www.nature.com/articles/example', '.c-pdf-download'],
    ...['', 'abs/'].map((path) => [`https://www.sciencedirect.com/science/article/${path}pii/S2405844024005395`, '.content-actions']),
    ['https://link.springer.com/article/10.1140/epjc/s10052-024-12995-0', '.app-article-masthead__buttons .c-pdf-download'],
    ...['', 'full/', 'abs/'].map((path) => [`https://onlinelibrary.wiley.com/doi/${path}10.1002/ece3.71938`, 'nav.coolBar .coolBar__second']),
  ]) {
    assert.equal(page(true, {}, false, url, selector).inserted[0][0], 'anchor');
    const fallback = page(false, {}, false, url, selector);
    assert.equal(fallback.inserted[0][0], 'body');
    assert.match(fallback.button.style.cssText, /position:fixed/);
  }
});

test('unsupported pages and Wiley PDF viewers do not receive a button', () => {
  for (const url of [
    'https://example.com/doi/10.1002/ece3.71938',
    'https://link.springer.com/book/10.1007/example',
    'https://www.sciencedirect.com/science/article/pii/S2405844024005395/pdfft',
    ...['pdf', 'epdf', 'pdfdirect', 'epub'].map((path) => `https://onlinelibrary.wiley.com/doi/${path}/10.1002/ece3.71938`),
  ]) assert.deepEqual(page(true, {}, false, url).inserted, []);
});

test('fallback placement and errors preserve successful copy and expose feedback', async () => {
  const state = page(false, { bibtex: 'citation', errors: ['PDF failed'] });
  assert.equal(state.inserted[0][0], 'body');
  assert.match(state.button.style.cssText, /position:fixed/);
  await state.button.click();
  assert.deepEqual(state.copied, ['citation']);
  assert.equal(state.label.textContent, 'エラー');
  assert.equal(state.button.title, 'PDF failed');
  const denied = page(true, { bibtex: 'citation', errors: [] }, true);
  await denied.button.click();
  assert.equal(denied.button.title, 'Clipboard denied');
  const inactive = page(true, { errors: [], inactive: true });
  await inactive.button.click();
  assert.equal(inactive.label.textContent, '操作なし');
  assert.deepEqual(inactive.copied, []);
});

test('ScienceDirect collects only its own PDF link and preserves an existing PDF meta tag', async () => {
  const fixture = JSON.parse(await readFile(new URL('fixtures/pages/sciencedirect-S2405844024005395.meta.json', import.meta.url)));
  const tags = Object.entries(fixture.meta).flatMap(([name, values]) => values.map((content) => ({ name, content })));
  const links = fixture.pdfLinks.toReversed().map(([href]) => ({ href }));
  for (const url of [fixture.url, fixture.url.replace('/pii/', '/abs/pii/')]) {
    const state = page(true, {}, false, url, '.content-actions', tags, links);
    await state.button.click();
    assert.equal(state.messages[0].meta.citation_pdf_url[0], fixture.pdfLinks[0][0]);
    assert.deepEqual(state.copied, []);
  }
  const existing = page(true, {}, false, fixture.url, '.content-actions', [...tags, { name: 'citation_pdf_url', content: 'existing' }], links);
  await existing.button.click();
  assert.equal(existing.messages[0].meta.citation_pdf_url[0], 'existing');
  const missing = page(true, {}, false, fixture.url, '.content-actions', tags, links.slice(0, 1));
  await missing.button.click();
  assert.equal(missing.messages[0].meta.citation_pdf_url, undefined);
});
