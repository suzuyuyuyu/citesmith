import { articleFromMeta } from './meta.js';

export function springerBibtexUrl(doi) {
  return `https://citation-needed.springer.com/v2/references/${doi.split('/').map(encodeURIComponent).join('/')}?format=bibtex&flavour=citation`;
}

export function fromMeta(meta, url) {
  const page = new URL(url);
  if (page.origin !== 'https://link.springer.com' || !/^\/article\/10\.\d{4,9}\/\S+$/.test(page.pathname)) throw new Error('Springer の記事 URL ではありません');
  const article = articleFromMeta(meta, url, 'publication_date');
  if (!/^\/content\/pdf\/.+\.pdf$/.test(new URL(article.pdfUrl).pathname)) throw new Error('PDF URL が不正です');
  if (!/^10\.\d{4,9}\/\S+$/.test(article.doi)) throw new Error('DOI が不正です');
  return { ...article, bibtexUrl: springerBibtexUrl(article.doi) };
}
