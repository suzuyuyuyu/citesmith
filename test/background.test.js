import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { defaults } from '../src/template.js';

const url = 'https://arxiv.org/abs/1706.03762';
const meta = JSON.parse(await readFile(new URL('fixtures/arxiv.json', import.meta.url)));
const originalFetch = globalThis.fetch;
let settings;
let listener;
let downloads;
let requests;
let downloadError;
globalThis.chrome = {
  runtime: { onMessage: { addListener(fn) { listener = fn; } } },
  storage: { sync: { async get(fallback) { return { ...fallback, ...settings }; } } },
  downloads: { async download(options) {
    downloads.push(options);
    if (downloadError) throw new Error('download failed');
    return 1;
  } },
  declarativeNetRequest: { async updateSessionRules(change) { tabs.push(change); } },
  tabs: {
    async create(options) { tabs.push(options); return { id: 2 }; },
    async update(id, options) {
      tabs.push({ update: id, ...options });
      if (!options.url) return;
      // Another download in flight is left alone; the tab's PDF download gets the template filename.
      tabEvents.naming({ url: 'https://example.com/a.zip' }, (suggestion) => tabs.push({ other: suggestion }));
      tabEvents.naming({ url: options.url, finalUrl: pdfAssetUrl }, (suggestion) => tabs.push({ suggestion }));
    },
    async remove(id) { tabs.push({ removed: id }); },
    onRemoved: { addListener() {}, removeListener() {} },
  },
};
chrome.downloads.onDeterminingFilename = { addListener(fn) { tabEvents.naming = fn; }, removeListener() {} };
const pdfAssetUrl = 'https://pdf.sciencedirectassets.com/272421/1-s2.0-S2405844024005395/main.pdf?X-Amz-Signature=x';
const tabs = [];
const tabEvents = {};
await import('../src/background.js');

function send(sender = { url, tab: { id: 1 } }) {
  return new Promise((resolve) => {
    assert.equal(listener({ meta, url }, sender, resolve), true);
  });
}

test('worker honors both toggles, validates sender and preserves partial successes', async (t) => {
  try {
    for (const downloadPdf of [false, true]) {
      for (const copyBibtex of [false, true]) {
        await t.test(`PDF=${downloadPdf} BibTeX=${copyBibtex}`, async () => {
          settings = { downloadPdf, copyBibtex };
          downloads = []; requests = [];
          globalThis.fetch = async (requested) => {
            requests.push(requested);
            return new Response('@misc{old,\n year={2023},\n title={Example}\n}');
          };
          const result = await send();
          assert.deepEqual(result.errors, []);
          assert.equal(downloads.length, Number(downloadPdf));
          assert.equal(requests.length, Number(copyBibtex));
          assert.equal(Boolean(result.bibtex), copyBibtex);
          if (copyBibtex) assert.match(result.bibtex, /@misc\{vaswani2017attention,\n year=\{2017\}/);
          if (downloadPdf) assert.deepEqual(downloads[0], {
            url: 'https://arxiv.org/pdf/1706.03762',
            filename: 'VASWANI2017-Attention_Is_All_You_Need.pdf', conflictAction: 'uniquify',
          });
        });
      }
    }
    await t.test('ScienceDirect fetches authors independently of copying and fails safely without them', async () => {
      const fixture = JSON.parse(await readFile(new URL('fixtures/pages/sciencedirect-S2405844024005395.meta.json', import.meta.url)));
      const bib = await readFile(new URL('fixtures/pages/sciencedirect-S2405844024005395.bib', import.meta.url), 'utf8');
      const message = { url: fixture.url, meta: { ...fixture.meta, citation_pdf_url: [fixture.pdfLinks[0][0]] } };
      const sendScienceDirect = () => new Promise((resolve) => listener(message, { url: fixture.url, tab: { id: 1 } }, resolve));
      for (const downloadPdf of [false, true]) {
        for (const copyBibtex of [false, true]) {
          settings = { downloadPdf, copyBibtex };
          downloads = []; requests = [];
          globalThis.fetch = async (requested) => {
            requests.push(requested);
            return new Response(bib);
          };
          const result = await sendScienceDirect();
          assert.deepEqual(result.errors, []);
          assert.equal(requests.length, Number(downloadPdf || copyBibtex));
          if (requests.length) assert.equal(requests[0], 'https://www.sciencedirect.com/sdfe/arp/cite?pii=S2405844024005395&format=text%2Fx-bibtex&withabstract=true');
          assert.equal(Boolean(result.bibtex), copyBibtex);
          if (copyBibtex) assert.match(result.bibtex, /^@article\{lucke2024obesity,/);
          assert.equal(downloads.length, 0);
          if (downloadPdf) {
            const [created, added, opened, other, { suggestion }, removedRule, closed] = tabs.splice(0);
            assert.deepEqual(created, { url: 'about:blank', openerTabId: 1, active: false });
            assert.deepEqual(added.addRules[0].condition, {
              tabIds: [2], requestDomains: ['pdf.sciencedirectassets.com'], resourceTypes: ['main_frame'],
              responseHeaders: [{ header: 'content-type', values: ['application/pdf*'] }],
            });
            assert.deepEqual(opened, { update: 2, url: fixture.pdfLinks[0][0] });
            assert.deepEqual(other, { other: undefined });
            assert.match(suggestion.filename, /^LÜCKE2024-Obesity_and/);
            assert.deepEqual(removedRule, { removeRuleIds: [added.addRules[0].id] });
            assert.deepEqual(closed, { removed: 2 });
          }
        }
      }
      settings = { downloadPdf: true, copyBibtex: false };
      for (const response of [new Response('bad', { status: 503 }), new Response('@article{k,\n title={Missing authors}\n}')]) {
        downloads = [];
        globalThis.fetch = async () => response;
        const result = await sendScienceDirect();
        assert.ok(result.errors.length);
        assert.equal(result.bibtex, undefined);
        assert.equal(downloads.length, 0);
      }
    });
    settings = defaults;
    downloads = [];
    globalThis.fetch = async () => new Response('bad', { status: 503 });
    let result = await send();
    assert.match(result.errors[0], /503/);
    assert.equal(downloads.length, 1);
    downloadError = true;
    globalThis.fetch = async () => new Response('@misc{old,\n year={2023},\n title={Example}\n}');
    result = await send();
    assert.match(result.errors[0], /download failed/);
    assert.ok(result.bibtex);
    assert.match((await send({ url: 'https://evil.example/', tab: { id: 1 } })).errors[0], /送信元/);
    assert.match((await send({ url })).errors[0], /送信元/);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.chrome;
  }
});
