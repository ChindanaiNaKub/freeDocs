// Adaptive adapter registry for parsing Google Docs & similar HTML variants
// Each adapter exposes: { name, detect($), process($, opts) }
// detect returns a numeric score (higher = better). Fallback used if all below threshold.

const cheerio = require('cheerio');

const adapters = [
  require('./googleBasic'),
  require('./googleCopyPaste'),
  require('./docxHtml'),
  require('./fallbackPlain')
];

function loadDom(html) {
  return cheerio.load(html, {
    decodeEntities: false,
    _useHtmlParser2: true,
    normalizeWhitespace: false
  });
}

function selectAdapter(html, opts = {}) {
  const $ = loadDom(html);
  const scored = adapters.map(a => ({ adapter: a, score: safeDetect(a, $) }))
    .sort((a, b) => b.score - a.score);
  const threshold = opts.threshold != null ? opts.threshold : 1; // minimal confidence
  const chosen = scored[0];
  const effective = chosen && chosen.score >= threshold ? chosen.adapter : require('./fallbackPlain');
  return { $, chosen: effective, scores: Object.fromEntries(scored.map(s => [s.adapter.name, s.score])) };
}

function safeDetect(adapter, $) {
  try { return Number(adapter.detect($)) || 0; } catch { return 0; }
}

function parseUniversal(html, opts = {}) {
  const { $, chosen, scores } = selectAdapter(html, opts);
  let struct, error;
  try {
    struct = chosen.process($, opts) || {};
  } catch (e) {
    error = e.message;
    const fallback = require('./fallbackPlain');
    struct = fallback.process($, { ...opts, priorError: e.message }) || {};
  }
  return {
    ...struct,
    diagnostics: opts.debug ? { adapter: chosen.name, scores, error } : undefined,
    schemaVersion: 1
  };
}

module.exports = { parseUniversal, selectAdapter };
