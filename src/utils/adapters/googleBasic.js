// Google Docs standard export (mobile / published) adapter
const { normalizeStructure } = require('./shared');

module.exports = {
  name: 'googleBasic',
  detect: ($) => {
    let score = 0;
    const bodyHtml = $('body').html() || '';
    if (/docs-internal-guid-/.test(bodyHtml)) score += 3; // internal spans
    if (/class="c\d+"/.test(bodyHtml)) score += 2; // gdocs classes
    if ($('meta[content*="Google Docs"]').length) score += 4;
    if ($('img[src*="=w"], img[src*="=h"]').length > 2) score += 1; // sizing params
    return score;
  },
  process: ($, opts) => normalizeStructure($, { source: 'googleBasic', opts })
};
