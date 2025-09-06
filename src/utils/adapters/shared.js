// Shared normalization helpers for adapters producing a common AST
const crypto = require('crypto');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'section';
}

function hashFragment(text) {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 8);
}

function promoteHeadings($) {
  $('p').each((_, el) => {
    const $p = $(el); const style = $p.attr('style') || ''; const text = $p.text().trim();
    if (!text) return;
    const fontSizeMatch = style.match(/font-size:\s*(\d+)pt/);
    const bold = /font-weight:\s*(700|bold)/.test(style) || $p.find('b,strong').length > 0;
    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : null;
    if (bold && fontSize && fontSize >= 18) {
      let level = 3; if (fontSize >= 28) level = 1; else if (fontSize >= 22) level = 2;
      const h = `<h${level}>${escapeHtml(text)}</h${level}>`;
      $p.replaceWith(h);
    }
  });
}

function rebuildLists($) {
  const bulletRegex = /^[•◦▪\-*]\s+/;
  $('p').each((_, el) => {
    const $p = $(el); const txt = $p.text();
    if (bulletRegex.test(txt)) {
      // Start UL and absorb siblings until pattern breaks
      const items = [];
      let current = el;
      while (current) {
        const $c = $(current); const t = $c.text();
        if (!bulletRegex.test(t)) break;
        items.push(t.replace(bulletRegex, '').trim());
        const next = $c.next()[0];
  // Remove only after capturing; first one we'll replace later
  if ($c[0] !== el) $c.remove();
        current = next;
      }
      if (items.length) {
  const ul = $('<ul></ul>');
  items.forEach(it => ul.append(`<li>${escapeHtml(it)}</li>`));
  $(el).replaceWith(ul);
      }
    }
  });
}

function collapseSpans($) {
  $('span').each((_, el) => {
    const $el = $(el);
    // Remove empty spans
    if (!$el.text().trim()) { $el.remove(); return; }
    // Strip style attributes we don't normalize yet (keep formatting tags only after promotion)
    const style = $el.attr('style') || '';
    if (!/(bold|italic|underline|font-weight|font-style|text-decoration)/i.test(style)) {
      $el.replaceWith($el.text());
    }
  });
}

function extractStructure($, ctx = {}) {
  const sections = [];
  let current = null;
  const pushCurrent = () => { if (current) sections.push(current); };
  $('body').children().each((_, el) => {
    const tag = el.tagName && el.tagName.toLowerCase();
    if (/h[1-6]/.test(tag)) {
      pushCurrent();
      const text = $(el).text().trim();
      current = {
        id: `h:${slugify(text)}-${hashFragment(text)}`,
        heading: { level: parseInt(tag.substring(1), 10), text },
        blocks: []
      };
    } else if (tag === 'p') {
      const text = $(el).text().trim(); if (!text) return;
      if (!current) { // implicit intro section
        current = { id: `intro-${hashFragment(text)}`, heading: null, blocks: [] };
      }
      current.blocks.push({ type: 'paragraph', text });
    } else if (tag === 'ul' || tag === 'ol') {
      if (!current) current = { id: `list-${hashFragment(String(Date.now()))}`, heading: null, blocks: [] };
      const ordered = tag === 'ol';
      const items = []; $(el).find('> li').each((__, li) => { items.push($(li).text().trim()); });
      current.blocks.push({ type: 'list', ordered, items });
    } else if (tag === 'pre' || tag === 'code') {
      if (!current) current = { id: `code-${hashFragment('root')}`, heading: null, blocks: [] };
      current.blocks.push({ type: 'code', text: $(el).text() });
    }
  });
  pushCurrent();
  return { sections, source: ctx.source };
}

function normalizeStructure($, ctx) {
  collapseSpans($);
  promoteHeadings($);
  rebuildLists($);
  return extractStructure($, ctx);
}

function textFallbackStructure($, ctx) {
  // treat consecutive lines as paragraphs; headings: all-caps lines <= 60 chars
  const bodyText = $('body').text().replace(/\r\n?/g, '\n');
  const lines = bodyText.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let html = lines.map(l => `<p>${escapeHtml(l)}</p>`).join('\n');
  const $2 = require('cheerio').load(`<body>${html}</body>`);
  promoteHeadings($2);
  return extractStructure($2, ctx);
}

function escapeHtml(str) { return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

module.exports = { normalizeStructure, textFallbackStructure };
