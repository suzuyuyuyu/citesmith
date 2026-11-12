import { localizedError } from '../i18n.js';
import { fromMeta as arxiv } from './arxiv.js';
import { fromMeta as nature } from './nature.js';
import { fromMeta as springer } from './springer.js';
import { fromMeta as wiley } from './wiley.js';
import { fromMeta as sciencedirect } from './sciencedirect.js';

export function fromMeta(meta, url) {
  const hostname = new URL(url).hostname;
  if (hostname === 'arxiv.org') return arxiv(meta, url);
  if (hostname === 'www.nature.com') return nature(meta, url);
  if (hostname === 'link.springer.com') return springer(meta, url);
  if (hostname === 'onlinelibrary.wiley.com') return wiley(meta, url);
  if (hostname === 'www.sciencedirect.com') return sciencedirect(meta, url);
  throw localizedError('unsupportedSite');
}
