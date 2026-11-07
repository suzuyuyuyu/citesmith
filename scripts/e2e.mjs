// Usage: node scripts/e2e.mjs <article URL>... (HEADFUL=1 to show the window). Loads this extension into a throwaway Chrome profile, clicks the button, prints label, clipboard and downloaded files.
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const ext = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const base = (await import('node:os')).homedir() + '/tmp/citesmith-e2e/';
const dl = base + 'downloads', profile = base + 'profile';
rmSync(dl, { recursive: true, force: true }); rmSync(profile, { recursive: true, force: true });
mkdirSync(dl, { recursive: true });
// Use Chrome's own download pref instead of CDP setDownloadBehavior, which may override extension-chosen names.
mkdirSync(profile + '/Default', { recursive: true });
writeFileSync(profile + '/Default/Preferences', JSON.stringify({ download: { default_directory: dl, prompt_for_download: false } }));
const headless = process.env.HEADFUL ? [] : ['--headless=new'];
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  ...headless, '--remote-debugging-pipe', '--enable-unsafe-extension-debugging',
  `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });

let id = 0, buf = '';
const pending = new Map();
chrome.stdio[4].on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\0')) >= 0) {
    const msg = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  }
});
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const m = { id: ++id, method, params, ...(sessionId && { sessionId }) };
  pending.set(m.id, (r) => r.error ? rej(new Error(`${method}: ${r.error.message}`)) : res(r.result));
  chrome.stdio[3].write(JSON.stringify(m) + '\0');
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const { id: extId } = await send('Extensions.loadUnpacked', { path: ext });
  console.log('extension loaded:', extId);

  for (const url of process.argv.slice(2)) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const ev = (expression) => send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId).then((r) => r.result.value);
    await send('Browser.grantPermissions', { origin: new URL(url).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
    await send('Page.navigate', { url }, sessionId);
    let info;
    for (let t = 0; t < 30 && !info; t++) {
      await sleep(500);
      info = await ev(`(() => { const b = document.getElementById('citesmith-button'); if (!b) return null;
        b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2, parent: b.parentElement.className || b.parentElement.tagName, fixed: b.style.position === 'fixed' }; })()`);
    }
    console.log(`\n## ${url}\nbutton:`, info);
    if (!info) continue;
    await send('Page.bringToFront', {}, sessionId);
    // A real user dismisses the cookie banner first; emulate by removing it.
    await ev(`document.querySelectorAll('.cc-banner').forEach(e => e.remove())`);
    console.log('element at point:', await ev(`(() => { const e = document.elementFromPoint(${info.x}, ${info.y}); return e && (e.id || e.className || e.tagName) + ' / closest dialog: ' + (e.closest('[role=dialog],dialog,[class*=cookie],[class*=consent]')?.className || '-'); })()`));
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: info.x, y: info.y, button: 'left', clickCount: 1 }, sessionId);
    }
    let label;
    for (let t = 0; t < 40; t++) {
      await sleep(250);
      label = await ev(`(() => { const b = document.getElementById('citesmith-button'); return b.textContent.trim() + (b.title ? ' | ' + b.title : ''); })()`);
      if (!label.startsWith('処理中') && t > 1) break;
    }
    console.log('label after click:', label);
    const clip = await ev(`navigator.clipboard.readText().catch(e => 'readText failed: ' + e.message)`);
    console.log('clipboard head:', JSON.stringify(clip.slice(0, 160)));
  }
  await sleep(5000);
  console.log('\ndownloads dir:', readdirSync(dl));
} catch (e) {
  console.error('E2E failed:', e.message);
} finally {
  chrome.kill();
}
