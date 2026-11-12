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

  const messages = {
    en: { labels: ['Citesmith', 'Working…', 'Done', 'Error', 'No action'], menu: ['PDF + BibTeX', 'PDF only', 'BibTeX only'], choose: 'Choose action', noResponse: 'No response from the service worker' },
    ja: { labels: ['Citesmith', '処理中…', '完了', 'エラー', '操作なし'], menu: ['PDF + BibTeX', 'PDF のみ', 'BibTeX のみ'], choose: '操作を選択', noResponse: 'サービスワーカーから応答がありません' },
  };
  let text = messages.en;
  let state = 0;
  const feedback = (value) => { state = value; label.textContent = text.labels[state]; };

  // Split button: the main part follows the popup settings, the menu runs a one-off choice.
  const root = document.createElement('span');
  root.id = 'citesmith-button';
  root.lang = 'en';
  root.style.cssText = 'position:relative;display:inline-flex;align-items:stretch;box-sizing:border-box;padding:0 12px;margin:0;background:#202020;color:#fff;border:0.5px solid #646464;border-radius:4px;font-weight:600;font-size:14px;line-height:1;font-family:system-ui,-apple-system,"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic UI",Meiryo,sans-serif;white-space:nowrap;vertical-align:middle;';
  const reset = 'background:none;border:0;margin:0;padding:0;color:inherit;font:inherit;cursor:pointer;';
  root.innerHTML = `<style>#citesmith-button [role=menuitem]:hover,#citesmith-button [role=menuitem]:focus-visible{background:#3a3a3a}#citesmith-button button:disabled{cursor:default}#citesmith-button button:focus:not(:focus-visible){outline:none}</style>`
    + `<button type="button" class="cs-main" style="${reset}display:inline-flex;align-items:center;gap:6px;"><svg aria-hidden="true" width="18" height="12" viewBox="0 0 442.77 293.66" fill="currentColor"><path d="M5.55,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/><path d="M235.95,141.56c-1.88-5.57-4.77-15.67-5.42-28.68-.19-3.75-.42-12.38,1.27-22.63,4.62-27.96,20.19-47.4,26.13-54.18,5.24-5.98,17.16-19.31,37.29-28.04,41.33-17.94,80.66-.61,86.52,2.08,4.63,2.13,34.27,16.22,49.55,46.04,5.76,11.25,8.45,22.72,8.76,24.07,2.74,11.97,2.73,21.87,2.71,33.29-.01,9.7-.63,17.27-.96,20.71-3.54,37.92-17.03,68.45-18.84,72.47-3.26,7.22-9.66,17.88-22.47,39.2,0,0-3.96,6.59-24.18,32.7-2.31,2.98-7.48,9.47-16.25,12.91-5.61,2.2-12.5,3.04-13.58.96-.46-.88.3-1.84,3.11-7.29,1.38-2.67-.02-.21,2.91-6.05,3.88-7.73,4.68-8.76,6.35-12.23,2.03-4.21,3.19-7.72,5.52-14.75,1.65-4.98,2.87-8.65,4.1-13.81,1.01-4.25,2.3-9.75,2.79-17.05.37-5.56.16-10.27-.15-13.73-2.21.95-5.24,2.15-8.93,3.25-2.67.8-10.99,3.12-22.35,3.41-10.92.28-19.11-1.5-25.18-2.87-7.2-1.62-18.12-4.16-30.59-11.15-3.53-1.98-17.45-10.07-30.27-26.13-10.93-13.7-15.89-26.71-17.85-32.51Z"/></svg><span style="display:inline-grid;justify-items:center;"><span class="cs-label" aria-live="polite" style="grid-area:1/1;">Citesmith</span>${['Citesmith', 'Working…', 'Done', 'Error', 'No action'].map((text) => `<span class="cs-sizer" aria-hidden="true" style="grid-area:1/1;visibility:hidden;">${text}</span>`).join('')}</span></button>`
    + `<button type="button" class="cs-more" aria-label="Choose action" aria-haspopup="menu" aria-expanded="false" style="${reset}display:inline-flex;align-items:center;padding:0 0 0 10px;margin:0 -4px 0 10px;border-left:0.5px solid #646464;"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3h8L5 8z"/></svg></button>`
    + `<div role="menu" style="display:none;position:absolute;top:calc(100% + 4px);right:0;z-index:2147483647;min-width:100%;padding:4px;box-sizing:border-box;background:#202020;border:0.5px solid #646464;border-radius:4px;">`
    + [['1', '1', 'PDF + BibTeX'], ['1', '', 'PDF only'], ['', '1', 'BibTeX only']].map(([pdf, bib, text]) =>
      `<button type="button" role="menuitem" data-pdf="${pdf}" data-bib="${bib}" style="${reset}display:block;width:100%;padding:8px 12px;border-radius:2px;text-align:left;font-weight:400;">${text}</button>`).join('')
    + '</div>';
  const main = root.querySelector('.cs-main');
  const more = root.querySelector('.cs-more');
  const menu = root.querySelector('[role=menu]');
  const label = root.querySelector('.cs-label');
  const render = (language) => {
    root.lang = language === 'ja' ? 'ja' : 'en';
    text = messages[root.lang];
    feedback(state);
    more.setAttribute('aria-label', text.choose);
    root.querySelectorAll('.cs-sizer').forEach((span, i) => { span.textContent = text.labels[i]; });
    menu.querySelectorAll('[role=menuitem]').forEach((item, i) => { item.textContent = text.menu[i]; });
  };
  render('en');
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.language) render(changes.language.newValue);
  });
  chrome.storage.sync.get({ language: 'en' }).then(({ language }) => render(language), () => {});
  const style = root.style.cssText;
  const place = () => {
    // PDF controls can have hidden copies in sticky bars; take the first rendered element.
    const anchor = [...document.querySelectorAll(site.anchor)].find((el) => el.getClientRects().length);
    root.style.cssText = anchor ? style + (site.style ?? '') : `${style}height:36px;position:fixed;right:16px;bottom:16px;z-index:2147483647;`;
    (anchor || document.body).append(root);
  };
  place();
  // React pages (ScienceDirect) can re-render and drop foreign nodes; put the button back.
  new MutationObserver(() => root.isConnected || place()).observe(document.body, { childList: true, subtree: true });

  const toggle = (open) => {
    menu.style.display = open ? 'block' : 'none';
    more.setAttribute('aria-expanded', String(open));
  };
  more.addEventListener('click', () => toggle(menu.style.display !== 'block'));
  document.addEventListener('click', (event) => root.contains(event.target) || toggle(false));
  root.addEventListener('keydown', (event) => event.key === 'Escape' && toggle(false));
  menu.addEventListener('click', (event) => {
    const item = event.target.closest('[role=menuitem]');
    if (!item) return;
    toggle(false);
    return run({ downloadPdf: Boolean(item.dataset.pdf), copyBibtex: Boolean(item.dataset.bib) });
  });
  main.addEventListener('click', () => run());

  async function run(actions) {
    if (main.disabled) return;
    main.disabled = more.disabled = true;
    feedback(1);
    root.title = '';
    try {
      const meta = {};
      for (const tag of document.querySelectorAll('meta[name^="citation_"]')) {
        (meta[tag.name] ||= []).push(tag.content);
      }
      site.collectMeta?.(meta);
      const result = await chrome.runtime.sendMessage({ meta, url: location.href, actions });
      if (!result) throw new Error(text.noResponse);
      if (result.bibtex) await navigator.clipboard.writeText(result.bibtex);
      if (result.errors?.length) throw new Error(result.errors.join('\n'));
      feedback(result.inactive ? 4 : 2);
    } catch (error) {
      feedback(3);
      root.title = error.message;
    } finally {
      setTimeout(() => {
        feedback(0);
        main.disabled = more.disabled = false;
      }, 2000);
    }
  }
})();
