import { articleFromMeta, value } from './meta.js';

export function authorsFromBibtex(bibtex) {
  const authors = bibtex.match(/^[ \t]*author\s*=\s*\{([^{}]*)\}/im)?.[1]
    .split(' and ').map((name) => name.trim()).filter(Boolean);
  if (!authors?.length) throw new Error('BibTeX の著者情報が不足しています');
  return authors;
}

export function fromMeta(meta, url) {
  const page = new URL(url);
  const pii = page.pathname.match(/^\/science\/article\/(?:abs\/)?pii\/([A-Za-z0-9]+)$/)?.[1];
  if (page.origin !== 'https://www.sciencedirect.com' || !pii) throw new Error('ScienceDirect の記事 URL ではありません');
  if (value(meta, 'pii') !== pii) throw new Error('PII が不正です');
  const article = articleFromMeta(meta, url, 'publication_date', value(meta, 'pdf_url'), false);
  if (new URL(article.pdfUrl).pathname !== `/science/article/pii/${pii}/pdfft`) throw new Error('PDF URL が不正です');
  return {
    ...article, authorsFromBibtex,
    // pdfft answers non-browser downloads with a JS check page; the real PDF ends up on this host.
    pdfTabDomain: 'pdf.sciencedirectassets.com',
    bibtexUrl: `https://www.sciencedirect.com/sdfe/arp/cite?pii=${pii}&format=text%2Fx-bibtex&withabstract=true`,
  };
}
