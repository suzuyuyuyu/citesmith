import { localizedError } from '../i18n.js';
import { articleFromMeta } from './meta.js';
import { springerBibtexUrl } from './springer.js';

export function fromMeta(meta, url) {
  const page = new URL(url);
  if (page.origin !== 'https://www.nature.com' || !/^\/articles\/[^/]+$/.test(page.pathname)) throw localizedError('invalidNatureUrl');
  const article = articleFromMeta(meta, url, 'publication_date');
  if (!/^\/articles\/.+\.pdf$/.test(new URL(article.pdfUrl).pathname)) throw localizedError('invalidPdfUrl');
  if (!/^10\.\d{4,9}\/\S+$/.test(article.doi)) throw localizedError('invalidDoi');
  return {
    ...article,
    bibtexUrl: springerBibtexUrl(article.doi),
  };
}
