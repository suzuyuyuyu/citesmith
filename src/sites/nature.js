import { articleFromMeta } from './meta.js';
import { springerBibtexUrl } from './springer.js';

export function fromMeta(meta, url) {
  const page = new URL(url);
  if (page.origin !== 'https://www.nature.com' || !/^\/articles\/[^/]+$/.test(page.pathname)) throw new Error('Nature の記事 URL ではありません');
  const article = articleFromMeta(meta, url, 'publication_date');
  if (!/^\/articles\/.+\.pdf$/.test(new URL(article.pdfUrl).pathname)) throw new Error('PDF URL が不正です');
  if (!/^10\.\d{4,9}\/\S+$/.test(article.doi)) throw new Error('DOI が不正です');
  return {
    ...article,
    bibtexUrl: springerBibtexUrl(article.doi),
  };
}
