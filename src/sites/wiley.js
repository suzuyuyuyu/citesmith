import { articleFromMeta, value } from './meta.js';

export function fromMeta(meta, url) {
  const page = new URL(url);
  if (page.origin !== 'https://onlinelibrary.wiley.com' || !/^\/doi\/(?:full\/|abs\/)?10\.\d{4,9}\/\S+$/.test(page.pathname)) throw new Error('Wiley の記事 URL ではありません');
  const doi = value(meta, 'doi');
  if (!/^10\.\d{4,9}\/\S+$/.test(doi)) throw new Error('DOI が不正です');
  const pdfUrl = `https://onlinelibrary.wiley.com/doi/pdfdirect/${doi.split('/').map(encodeURIComponent).join('/')}?download=true`;
  return {
    ...articleFromMeta(meta, url, 'publication_date', pdfUrl),
    bibtexUrl: `https://onlinelibrary.wiley.com/action/downloadCitation?doi=${encodeURIComponent(doi)}&format=bibtex&include=abs`,
  };
}
