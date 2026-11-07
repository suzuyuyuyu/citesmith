import { pathToFileURL } from 'node:url';
import { fromMeta } from '../src/sites/index.js';
import { buildFilename, rewriteBibtex } from '../src/template.js';

function decode(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
    if (!entity.startsWith('#')) return entities[entity.toLowerCase()];
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

export function extractMeta(html) {
  const meta = {};
  // shortcut: regex meta parse, fine for probe only
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = {};
    for (const match of tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[match[1].toLowerCase()] = decode(match[2] ?? match[3]);
    }
    if (attrs.name?.startsWith('citation_') && attrs.content !== undefined) {
      (meta[attrs.name] ||= []).push(attrs.content);
    }
  }
  return meta;
}

async function fetchText(url) {
  // shortcut: Nature sends cookieless clients through an IdP redirect loop; this query is where that loop ends
  if (new URL(url).hostname === 'www.nature.com') url += (url.includes('?') ? '&' : '?') + 'error=cookies_not_supported';
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

export async function probe(url) {
  const article = fromMeta(extractMeta(await fetchText(url)), url);
  const bibtex = rewriteBibtex(await fetchText(article.bibtexUrl), article);
  return { filename: buildFilename(article), bibtex };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/probe.mjs <article URL>');
    const result = await probe(process.argv[2]);
    console.log(result.filename);
    console.log(result.bibtex);
  } catch (error) {
    console.error(`Probe failed: ${error.message}${error.cause ? ` (${error.cause.code || error.cause.message})` : ''}`);
    process.exitCode = 1;
  }
}
