// Generic DOCX (Word) saved-as-filtered-html adapter
const { normalizeStructure } = require('./shared');

module.exports = {
  name: 'docxHtml',
  detect: ($) => {
    let score = 0;
    const html = $.html();
    if (/MsoNormal/.test(html)) score += 3;
    if (/mso-style-name/.test(html)) score += 2;
    if (/<!--\[if gte mso 9\]/.test(html)) score += 3;
    return score;
  },
  process: ($, opts) => normalizeStructure($, { source: 'docxHtml', opts })
};
