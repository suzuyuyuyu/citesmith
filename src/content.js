(() => {
  const sites = {
    'arxiv.org': { path: /^\/abs\//, anchor: '.full-text', style: 'height:32px;margin:8px 0 0;' },
    'www.nature.com': { path: /^\/articles\/[^/]+$/, anchor: '.c-pdf-download', style: 'height:48px;padding:0 20px;margin-left:8px;border-radius:2px;font-size:16px;' },
    'link.springer.com': { path: /^\/article\/10\.\d{4,9}\/\S+$/, anchor: '.app-article-masthead__buttons .c-pdf-download', style: 'height:44px;padding:0 24px;margin-left:8px;border-radius:32px;font-size:16px;font-weight:700;' },
    'onlinelibrary.wiley.com': { path: /^\/doi\/(?:full\/|abs\/)?10\.\d{4,9}\/\S+$/, anchor: 'nav.coolBar .coolBar__second', style: 'height:28px;margin:-4px 0 0 18px;padding:0 10px;vertical-align:top;font-size:12px;' },
    'www.sciencedirect.com': {
      path: /^\/science\/article\/(?:abs\/)?pii\/[A-Za-z0-9]+$/, anchor: '.content-actions', style: 'height:36px;margin-left:8px;align-self:center;',
      collectMeta(meta) {
        const pii = location.pathname.split('/').at(-1);
        const link = document.querySelector(`a[href*="/pii/${pii}/pdfft"]`);
        if (!meta.citation_pdf_url && link) meta.citation_pdf_url = [link.href];
      },
    },
  };
  const site = sites[location.hostname];
  if (!site?.path.test(location.pathname) || document.getElementById('citesmith-button')) return;

  const button = document.createElement('button');
  button.id = 'citesmith-button';
  button.type = 'button';
  button.style.cssText = 'display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;padding:0 12px;margin:0;background:#202020;color:#fff;border:0.5px solid #646464;border-radius:4px;font-weight:600;font-size:14px;line-height:1;font-family:inherit;white-space:nowrap;cursor:pointer;';
  button.innerHTML = '<svg aria-hidden="true" width="18" height="12" viewBox="0 0 442.77 293.66" fill="currentColor"><path d="M5.55,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/><path d="M235.95,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/></svg><span aria-live="polite">Citesmith</span>';
  const label = button.querySelector('span');
  const style = button.style.cssText;
  const place = () => {
    // PDF controls can have hidden copies in sticky bars; take the first rendered element.
    const anchor = [...document.querySelectorAll(site.anchor)].find((el) => el.getClientRects().length);
    button.style.cssText = anchor ? style + (site.style ?? '') : `${style}height:36px;position:fixed;right:16px;bottom:16px;z-index:2147483647;`;
    (anchor || document.body).append(button);
  };
  place();
  // React pages (ScienceDirect) can re-render and drop foreign nodes; put the button back.
  new MutationObserver(() => button.isConnected || place()).observe(document.body, { childList: true, subtree: true });

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    label.textContent = '処理中…';
    button.title = '';
    try {
      const meta = {};
      for (const tag of document.querySelectorAll('meta[name^="citation_"]')) {
        (meta[tag.name] ||= []).push(tag.content);
      }
      site.collectMeta?.(meta);
      const result = await chrome.runtime.sendMessage({ meta, url: location.href });
      if (!result) throw new Error('サービスワーカーから応答がありません');
      if (result.bibtex) await navigator.clipboard.writeText(result.bibtex);
      if (result.errors?.length) throw new Error(result.errors.join('\n'));
      label.textContent = result.inactive ? '操作なし' : '完了';
    } catch (error) {
      label.textContent = 'エラー';
      button.title = error.message;
    } finally {
      setTimeout(() => {
        label.textContent = 'Citesmith';
        button.disabled = false;
      }, 2000);
    }
  });
})();
