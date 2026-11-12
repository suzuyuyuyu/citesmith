import { localizedError } from '../i18n.js';
import { articleFromMeta, value } from './meta.js';

export function fromMeta(meta, url) {
  const page = new URL(url);
  if (page.origin !== 'https://onlinelibrary.wiley.com' || !/^\/doi\/(?:full\/|abs\/)?10\.\d{4,9}\/\S+$/.test(page.pathname)) throw localizedError('invalidWileyUrl');
  const doi = value(meta, 'doi');
  if (!/^10\.\d{4,9}\/\S+$/.test(doi)) throw localizedError('invalidDoi');
  const pdfUrl = `https://onlinelibrary.wiley.com/doi/pdfdirect/${doi.split('/').map(encodeURIComponent).join('/')}?download=true`;
  return {
    ...articleFromMeta(meta, url, 'publication_date', pdfUrl),
    bibtexUrl: `https://onlinelibrary.wiley.com/action/downloadCitation?doi=${encodeURIComponent(doi)}&format=bibtex&include=abs`,
  };
}
