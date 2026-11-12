import { localizedError } from '../i18n.js';

export const value = (meta, name) => meta[`citation_${name}`]?.[0]?.trim() || '';

export function articleFromMeta(meta, url, dateName, pdf = value(meta, 'pdf_url'), requireAuthors = true) {
  const title = value(meta, 'title');
  const authors = (meta.citation_author || []).map((name) => name.trim()).filter(Boolean);
  const year = value(meta, dateName).match(/^\d{4}/)?.[0];
  if (!title || (requireAuthors && !authors.length) || !year) throw localizedError('missingMetadata');
  const pdfUrl = new URL(pdf, url);
  const page = new URL(url);
  if (!pdf || pdfUrl.protocol !== 'https:' || pdfUrl.origin !== page.origin) {
    throw localizedError('invalidPdfUrl');
  }
  const firstPage = value(meta, 'firstpage');
  const lastPage = value(meta, 'lastpage');
  return {
    title, authors, year, pdfUrl: pdfUrl.href, url: page.href,
    doi: value(meta, 'doi'), journal: value(meta, 'journal_title'),
    volume: value(meta, 'volume'), number: value(meta, 'issue'),
    pages: firstPage + (lastPage && lastPage !== firstPage ? `--${lastPage}` : ''),
    publisher: value(meta, 'publisher'), booktitle: value(meta, 'conference_title'),
    organization: value(meta, 'organization'),
  };
}
