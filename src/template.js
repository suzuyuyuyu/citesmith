export const defaults = {
  filenameFormat: '${firstAuthorLastNameCaps}${year}-${titleSnakeCase}',
  citationKeyFormat: '${firstAuthorLastNameLower}${year}${titleFirstWord}',
  downloadPdf: true,
  copyBibtex: true,
  downloadFolder: '',
};

const ascii = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const stopwords = new Set('a an the and or but for nor so yet as at by from in into of on onto to with without is are was were be been being'.split(' '));

export function placeholders(article) {
  const full = article.authors[0] || '';
  const parts = full.trim().split(/\s+/);
  const comma = full.indexOf(',');
  const last = comma < 0 ? parts.at(-1) : full.slice(0, comma).trim();
  const first = comma < 0 ? parts.slice(0, -1).join(' ') : full.slice(comma + 1).trim();
  const caps = [first, last].filter(Boolean).join(' ').toUpperCase();
  const words = article.title.trim().split(/\s+/);
  return {
    author: article.authors.join(' and '),
    firstAuthorFullName: full,
    firstAuthorFirstName: first,
    firstAuthorLastName: last,
    firstAuthorInitials: (first.charAt(0) + last.charAt(0)).toUpperCase(),
    firstAuthorFullNameCaps: caps,
    firstAuthorFullNameCapsSnake: caps.replace(/\s+/g, '_'),
    firstAuthorFullNameCapsKebab: caps.replace(/\s+/g, '-'),
    firstAuthorFirstNameCaps: first.toUpperCase(),
    firstAuthorLastNameCaps: last.toUpperCase(),
    firstAuthorLastNameLower: last.toLowerCase(),
    year: article.year,
    title: article.title,
    titleSnakeCase: words.join('_'),
    titleKebabCase: words.join('-'),
    titleCamelCase: words.map((word, i) => i ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join(''),
    titleFirstWord: (ascii(article.title).toLowerCase().match(/[a-z0-9]+/g) || []).find((word) => !stopwords.has(word)) || '',
    ...Object.fromEntries(['doi', 'journal', 'volume', 'number', 'pages', 'publisher', 'booktitle', 'organization', 'url'].map((key) => [key, article[key] || ''])),
  };
}

export function expandTemplate(format, article) {
  const values = placeholders(article);
  return format.replace(/\$\{([^}]+)\}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`不明なプレースホルダー: ${key}`);
    return values[key];
  });
}

export function sanitizeFilename(value) {
  let result = value.replace(/[/\\:*?"<>|\u0000-\u001f\u007f-\u009f]/g, '').replace(/\s+/g, ' ').trim().replace(/^\.+|[. ]+$/g, '');
  // Chrome と主要 OS のファイル名制限に余裕を残す（拡張子を除き UTF-8 で180バイト）。
  while (new TextEncoder().encode(result).length > 180) result = [...result].slice(0, -1).join('');
  result = result.replace(/[. ]+$/g, '') || 'paper';
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(result) ? `_${result}` : result;
}

export function sanitizeCitationKey(value) {
  return ascii(value).replace(/[^A-Za-z0-9_:.-]/g, '') || 'paper';
}

// chrome.downloads only accepts paths relative to the browser's download directory, so the folder is a subfolder there.
export function buildFilename(article, format = defaults.filenameFormat, folder = '') {
  const dirs = folder.split(/[/\\]/).filter((dir) => dir.trim()).map((dir) => sanitizeFilename(expandTemplate(dir, article)));
  return [...dirs, `${sanitizeFilename(expandTemplate(format, article))}.pdf`].join('/');
}

// Brace words like NumPy, DNA, B-spline so sentence-case styles keep their capitals. Only top-level text is touched.
export function protectTitleCase(bibtex) {
  const field = /(^[ \t]*title\s*=\s*)(?:\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}|"([^"]*)")/im;
  return bibtex.replace(field, (match, prefix, braced, quoted) => {
    const value = (braced ?? quoted).split(/(\{(?:[^{}]|\{[^{}]*\})*\}|\\[A-Za-z]+)/).map((part, i) =>
      i % 2 ? part : part.replace(/[A-Za-z0-9][A-Za-z0-9-]*/g, (word) => /.[A-Z]|^[A-Z]-/.test(word) ? `{${word}}` : word),
    ).join('');
    return braced !== undefined ? `${prefix}{${value}}` : `${prefix}"${value}"`;
  });
}

export function rewriteBibtex(bibtex, article, format = defaults.citationKeyFormat) {
  const entry = /^(\s*@\w+\s*[{(]\s*)[^,\s]+(?=\s*,)/;
  if (!entry.test(bibtex)) throw new Error('BibTeX の応答が不正です');
  const key = sanitizeCitationKey(expandTemplate(format, article));
  let result = protectTitleCase(bibtex.replace(entry, (_, prefix) => prefix + key));
  if (article.arxivId) {
    const year = /(^[ \t]*year\s*=\s*(?:[{"]\s*)?)\d{4}(?=\s*[,}"])/im;
    if (!year.test(result)) throw new Error('arXiv BibTeX の year が見つかりません');
    result = result.replace(year, (_, prefix) => `${prefix}${article.year}`);
  }
  return result.trim();
}
