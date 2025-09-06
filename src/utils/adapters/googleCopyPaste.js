// Google Docs copy-paste fragment adapter (often contains <!--StartFragment-->)
const { normalizeStructure } = require('./shared');

module.exports = {
  name: 'googleCopyPaste',
  detect: ($) => {
    let score = 0;
    const html = $.html();
    if (/StartFragment/.test(html)) score += 3;
    if (/EndFragment/.test(html)) score += 2;
    if (/font-size:\s*1\d+pt/.test(html)) score += 1; // inline font sizes
    if (/MsoNormal/.test(html)) score -= 1; // more likely Word than copy fragment
    return score;
  },
  process: ($, opts) => normalizeStructure($, { source: 'googleCopyPaste', opts })
};
