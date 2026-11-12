import { localizedError } from '../i18n.js';
import { articleFromMeta, value } from './meta.js';

export function fromMeta(meta, url) {
  const page = new URL(url);
  if (page.origin !== 'https://arxiv.org' || !page.pathname.startsWith('/abs/')) throw localizedError('invalidArxivUrl');
  const arxivId = value(meta, 'arxiv_id');
  if (!/^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/.test(arxivId)) throw localizedError('invalidArxivId');
  const article = articleFromMeta(meta, url, 'date');
  if (!new URL(article.pdfUrl).pathname.startsWith('/pdf/')) throw localizedError('invalidPdfUrl');
  return {
    ...article, arxivId,
    bibtexUrl: `https://arxiv.org/bibtex/${arxivId}`,
  };
}
