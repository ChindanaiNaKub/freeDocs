// Fallback plain-text adapter (lowest confidence)
const { textFallbackStructure } = require('./shared');

module.exports = {
  name: 'fallbackPlain',
  detect: () => 0,
  process: ($, opts) => textFallbackStructure($, { source: 'fallbackPlain', opts })
};
