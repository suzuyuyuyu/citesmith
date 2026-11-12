import { localizedError, errorMessage } from './i18n.js';
import { fromMeta } from './sites/index.js';
import { defaults, buildFilename, rewriteBibtex } from './template.js';

let nextRuleId = 1;

// The PDF host answers any second request with its own verification page, so the PDF must be saved from the
// tab's own request: open the link in a background tab (as a user click would), turn only that tab's PDF
// response into a download, and give the download the template filename.
function downloadFromTab(article, openerTabId, filename) {
  const ruleId = nextRuleId++;
  return new Promise((resolve, reject) => {
    let tabId;
    const done = (error) => {
      clearTimeout(timer);
      chrome.downloads.onDeterminingFilename.removeListener(naming);
      chrome.tabs.onRemoved.removeListener(removed);
      chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] }).catch(() => {});
      if (!error) {
        chrome.tabs.remove(tabId).catch(() => {});
        return resolve();
      }
      if (tabId) chrome.tabs.update(tabId, { active: true }).catch(() => {});
      reject(error);
    };
    const naming = (item, suggest) => {
      if (new URL(item.finalUrl || item.url).hostname !== article.pdfTabDomain) return suggest();
      suggest({ filename, conflictAction: 'uniquify' });
      done();
    };
    const removed = (id) => { if (id === tabId) done(localizedError('pdfTabClosed')); };
    const timer = setTimeout(() => done(localizedError('pdfTimeout')), 60000);
    chrome.downloads.onDeterminingFilename.addListener(naming);
    chrome.tabs.onRemoved.addListener(removed);
    (async () => {
      tabId = (await chrome.tabs.create({ url: 'about:blank', openerTabId, active: false })).id;
      await chrome.declarativeNetRequest.updateSessionRules({ addRules: [{
        id: ruleId, priority: 1,
        condition: {
          tabIds: [tabId], requestDomains: [article.pdfTabDomain], resourceTypes: ['main_frame'],
          responseHeaders: [{ header: 'content-type', values: ['application/pdf*'] }],
        },
        action: { type: 'modifyHeaders', responseHeaders: [{ header: 'content-disposition', operation: 'set', value: 'attachment' }] },
      }] });
      await chrome.tabs.update(tabId, { url: article.pdfUrl });
    })().catch(done);
  });
}

async function run({ meta, url, actions }, sender) {
  const settings = await chrome.storage.sync.get(defaults);
  try {
    return await runWithSettings({ meta, url, actions }, sender, settings);
  } catch (error) {
    return { errors: [errorMessage(error, settings.language)] };
  }
}

async function runWithSettings({ meta, url, actions }, sender, settings) {
  if (!sender.tab || sender.url !== url) throw localizedError('invalidSender');
  // A choice from the button's menu applies to this click only.
  if (actions) Object.assign(settings, { downloadPdf: actions.downloadPdf === true, copyBibtex: actions.copyBibtex === true });
  if (!settings.downloadPdf && !settings.copyBibtex) return { errors: [], inactive: true };
  const article = fromMeta(meta, url);
  const errors = [];
  let bibtex;
  let filename;
  if (settings.copyBibtex || article.authorsFromBibtex) {
    try {
      const response = await fetch(article.bibtexUrl, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`BibTeX HTTP ${response.status}`);
      const text = await response.text();
      if (article.authorsFromBibtex) article.authors = article.authorsFromBibtex(text);
      if (settings.copyBibtex) bibtex = rewriteBibtex(text, article, settings.citationKeyFormat);
    } catch (error) {
      errors.push(`BibTeX: ${errorMessage(error, settings.language)}`);
    }
  }
  if (settings.downloadPdf) {
    try {
      if (article.authorsFromBibtex && !article.authors.length) throw localizedError('missingAuthors');
      filename = buildFilename(article, settings.filenameFormat, settings.downloadFolder);
      if (article.pdfTabDomain) await downloadFromTab(article, sender.tab.id, filename);
      else await chrome.downloads.download({ url: article.pdfUrl, filename, conflictAction: 'uniquify' });
    } catch (error) {
      errors.push(`PDF: ${errorMessage(error, settings.language)}`);
    }
  }
  return { bibtex, filename, errors };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  run(message, sender).then(sendResponse, (error) => sendResponse({ errors: [error.message] }));
  return true;
});
