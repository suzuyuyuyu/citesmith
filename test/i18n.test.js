import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as template from '../src/template.js';
import { messages, message, localizedError, errorMessage } from '../src/i18n.js';

const element = () => ({
  children: [], listeners: {},
  append(child) { this.children.push(child); },
  replaceChildren() { this.children = []; },
  addEventListener(type, fn) { this.listeners[type] = fn; },
});
async function page(name, settings) {
  const html = await readFile(new URL(`../${name}.html`, import.meta.url), 'utf8');
  const labels = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(([, i18n]) => ({ dataset: { i18n } }));
  const inputs = Object.fromEntries(Object.entries(template.defaults).map(([key, value]) => [key, {
    ...element(), type: typeof value === 'boolean' ? 'checkbox' : 'text', value: String(value), checked: value,
  }]));
  const form = { ...element(), elements: { namedItem: (key) => inputs[key] } };
  const nodes = Object.fromEntries(['statusMessage', 'placeholders', 'examples'].map((key) => [key, element()]));
  const changes = [];
  const saved = [];
  const document = {
    documentElement: {}, querySelector: () => form, querySelectorAll: () => labels,
    getElementById: (key) => nodes[key], createElement: element,
  };
  const chrome = { storage: {
    sync: { async get(fallback) { return { ...fallback, ...settings }; }, async set(value) { saved.push(value); } },
    onChanged: { addListener(fn) { changes.push(fn); } },
  } };
  const source = (await readFile(new URL(`../script/${name}.js`, import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
  await vm.runInNewContext(`(async () => {${source}\n})()`, {
    ...template, messages, message, document, chrome, setTimeout() {}, clearTimeout() {},
  });
  return { document, inputs, form, nodes, changes, saved, text: (key) => labels.find((node) => node.dataset.i18n === key) };
}

test('coded errors keep English messages and parameters; API errors pass through', () => {
  const error = localizedError('unknownPlaceholder', { key: 'typo' });
  assert.equal(error.message, 'Unknown placeholder: typo');
  assert.equal(error.code, 'unknownPlaceholder');
  assert.deepEqual(error.params, { key: 'typo' });
  assert.equal(errorMessage(error, 'ja'), '不明なプレースホルダー: typo');
  assert.equal(errorMessage(error, 'invalid'), error.message);
  assert.equal(errorMessage(new Error('Chrome error'), 'ja'), 'Chrome error');
  assert.deepEqual(Object.keys(messages.en), Object.keys(messages.ja));
  assert.deepEqual(Object.keys(messages.en.descriptions), Object.keys(messages.ja.descriptions));
});

test('popup defaults to English, switches immediately and saves language with settings', async () => {
  const state = await page('popup', {});
  assert.equal(state.document.documentElement.lang, 'en');
  assert.equal(state.text('save').textContent, 'Save');
  state.inputs.language.value = 'ja';
  state.inputs.language.listeners.change();
  assert.equal(state.document.documentElement.lang, 'ja');
  assert.equal(state.text('popupTitle').textContent, 'Citesmith 設定');
  assert.equal(state.text('save').textContent, '保存');
  assert.equal(state.saved.length, 0);
  await state.form.listeners.submit({ preventDefault() {} });
  assert.equal(state.saved[0].language, 'ja');
  assert.equal(state.saved[0].filenameFormat, template.defaults.filenameFormat);
  assert.equal(state.nodes.statusMessage.textContent, '保存しました');
  state.inputs.language.value = 'en';
  state.inputs.language.listeners.change();
  assert.equal(state.nodes.statusMessage.textContent, 'Saved');
  const japanese = await page('popup', { language: 'ja' });
  assert.equal(japanese.document.documentElement.lang, 'ja');
});

test('help translates prose, descriptions and empty examples from storage and updates', async () => {
  const state = await page('help', { language: 'ja' });
  assert.equal(state.document.documentElement.lang, 'ja');
  assert.equal(state.text('help1').innerHTML, '書き方');
  assert.equal(state.nodes.placeholders.children[0].children[1].textContent, '全著者を and で連結');
  assert.ok(state.nodes.placeholders.children.some((row) => row.children[2].textContent === '（空）'));
  state.changes[0]({ language: { newValue: 'en' } }, 'sync');
  assert.equal(state.document.documentElement.lang, 'en');
  assert.equal(state.text('help1').innerHTML, 'Writing templates');
  assert.equal(state.nodes.placeholders.children[0].children[1].textContent, 'All authors joined with and');
  assert.equal(state.nodes.placeholders.children.length, Object.keys(messages.en.descriptions).length);
  assert.equal(state.nodes.examples.children.length, 4);
});
