/**
 * Enhanced format parser for preserving Bold, Underline, and Link formatting from Google Docs
 */

/**
 * Parses HTML content while preserving inline formatting
 * @param {Object} $ - Cheerio instance
 * @param {Object} $el - Element to parse
 * @returns {Object} - Formatted content with preserved formatting
 */
function parseFormattedContent($, $el) {
  const html = $el.html();
  if (!html) return { text: $el.text().trim(), html: '', hasFormatting: false };

  // Check if element contains formatting
  const hasFormatting = containsFormatting($el);
  
  if (!hasFormatting) {
    return {
      text: $el.text().trim(),
      html: $el.text().trim(),
      hasFormatting: false
    };
  }

  // Parse and preserve formatting
  const formattedHtml = parseInlineFormatting($, $el);
  
  return {
    text: $el.text().trim(),
    html: formattedHtml,
    hasFormatting: true
  };
}

/**
 * Checks if an element contains formatting that should be preserved
 * @param {Object} $el - Cheerio element
 * @returns {boolean} - True if formatting found
 */
function containsFormatting($el) {
  // Check for direct formatting tags
  const formatTags = $el.find('b, strong, i, em, u, a, span[style*="font-weight"], span[style*="text-decoration"], span[style*="font-style"]');
  if (formatTags.length > 0) return true;

  // Check for Google Docs specific formatting classes
  const gdocsFormatSelectors = [
    '.c1', '.c2', '.c3', '.c4', '.c5', // Common Google Docs formatting classes
    '[style*="font-weight:bold"]',
    '[style*="font-weight: bold"]',
    '[style*="text-decoration:underline"]',
    '[style*="text-decoration: underline"]',
    '[style*="font-style:italic"]',
    '[style*="font-style: italic"]'
  ];

  for (const selector of gdocsFormatSelectors) {
    if ($el.find(selector).length > 0) return true;
  }

  return false;
}

/**
 * Parses inline formatting and converts to standard HTML
 * @param {Object} $ - Cheerio instance
 * @param {Object} $el - Element to parse
 * @returns {string} - HTML with preserved formatting
 */
function parseInlineFormatting($, $el) {
  let html = $el.html();
  
  // Clone the element to avoid modifying original
  const $clone = $el.clone();
  
  // Process all child elements recursively
  $clone.find('*').each((i, elem) => {
    const $elem = $(elem);
    
    // Handle links
    if (elem.tagName.toLowerCase() === 'a') {
      const href = $elem.attr('href');
      if (href && !href.startsWith('javascript:')) {
        // Keep the link as is, but clean the href if needed
        const cleanHref = cleanUrl(href);
        $elem.attr('href', cleanHref);
      } else {
        // Remove problematic links but keep the text
        $elem.replaceWith($elem.html());
      }
      return;
    }

    // Handle spans with inline styles (Google Docs formatting)
    if (elem.tagName.toLowerCase() === 'span') {
      const style = $elem.attr('style') || '';
      const className = $elem.attr('class') || '';
      
      let replacement = $elem.html();
      
      // Check for bold formatting
      if (style.includes('font-weight:bold') || style.includes('font-weight: bold') || isBoldClass(className)) {
        replacement = `<strong>${replacement}</strong>`;
      }
      
      // Check for italic formatting
      if (style.includes('font-style:italic') || style.includes('font-style: italic') || isItalicClass(className)) {
        replacement = `<em>${replacement}</em>`;
      }
      
      // Check for underline formatting
      if (style.includes('text-decoration:underline') || style.includes('text-decoration: underline') || isUnderlineClass(className)) {
        replacement = `<u>${replacement}</u>`;
      }
      
      $elem.replaceWith(replacement);
    }
    
    // Convert b tags to strong
    if (elem.tagName.toLowerCase() === 'b') {
      $elem.replaceWith(`<strong>${$elem.html()}</strong>`);
    }
    
    // Convert i tags to em
    if (elem.tagName.toLowerCase() === 'i') {
      $elem.replaceWith(`<em>${$elem.html()}</em>`);
    }
  });
  
  return $clone.html();
}

/**
 * Checks if a class name indicates bold formatting
 * @param {string} className - CSS class names
 * @returns {boolean} - True if bold formatting detected
 */
function isBoldClass(className) {
  // Common Google Docs bold classes (these may vary)
  const boldClasses = ['c1', 'c3', 'c5', 'bold', 'fw-bold'];
  return boldClasses.some(cls => className.includes(cls));
}

/**
 * Checks if a class name indicates italic formatting
 * @param {string} className - CSS class names
 * @returns {boolean} - True if italic formatting detected
 */
function isItalicClass(className) {
  // Common Google Docs italic classes
  const italicClasses = ['c2', 'c4', 'italic', 'fst-italic'];
  return italicClasses.some(cls => className.includes(cls));
}

/**
 * Checks if a class name indicates underline formatting
 * @param {string} className - CSS class names
 * @returns {boolean} - True if underline formatting detected
 */
function isUnderlineClass(className) {
  // Common Google Docs underline classes
  const underlineClasses = ['c6', 'c7', 'underline', 'text-decoration-underline'];
  return underlineClasses.some(cls => className.includes(cls));
}

/**
 * Cleans and validates URLs
 * @param {string} url - URL to clean
 * @returns {string} - Cleaned URL
 */
function cleanUrl(url) {
  // Remove javascript: URLs
  if (url.toLowerCase().startsWith('javascript:')) {
    return '#';
  }
  
  // Clean Google redirect URLs
  if (url.includes('google.com/url?')) {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const actualUrl = urlParams.get('url') || urlParams.get('q');
      if (actualUrl) {
        return decodeURIComponent(actualUrl);
      }
    } catch (e) {
      console.warn('Failed to parse Google redirect URL:', url);
    }
  }
  
  return url;
}

/**
 * Generates HTML for formatted content
 * @param {Object} content - Content object with formatting
 * @param {string} elementType - Type of HTML element (p, h1, etc.)
 * @returns {string} - Generated HTML
 */
function generateFormattedHtml(content, elementType = 'p') {
  const cssClass = `freedocs-${elementType}`;
  
  if (content.hasFormatting) {
    return `<${elementType} class="${cssClass} formatted">${content.html}</${elementType}>`;
  } else {
    return `<${elementType} class="${cssClass}">${escapeHtml(content.text)}</${elementType}>`;
  }
}

/**
 * Enhanced HTML escaping that preserves allowed formatting tags
 * @param {string} html - HTML to escape
 * @returns {string} - Escaped HTML with preserved formatting
 */
function escapeHtmlPreserveFormatting(html) {
  if (typeof html !== 'string') return html;
  
  // Temporarily replace allowed tags with placeholders
  const allowedTags = {
    '<strong>': '__STRONG_OPEN__',
    '</strong>': '__STRONG_CLOSE__',
    '<em>': '__EM_OPEN__',
    '</em>': '__EM_CLOSE__',
    '<u>': '__U_OPEN__',
    '</u>': '__U_CLOSE__'
  };
  
  let escaped = html;
  
  // Replace allowed tags with placeholders
  Object.keys(allowedTags).forEach(tag => {
    escaped = escaped.replace(new RegExp(escapeRegExp(tag), 'gi'), allowedTags[tag]);
  });
  
  // Escape all HTML
  escaped = escaped.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
  
  // Restore allowed tags
  Object.keys(allowedTags).forEach(tag => {
    escaped = escaped.replace(new RegExp(escapeRegExp(allowedTags[tag]), 'g'), tag);
  });
  
  return escaped;
}

/**
 * Escapes special regex characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Basic HTML escaping function
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Adaptive universal parser export (AST) for higher-level ingestion
const { parseUniversal } = require('./adapters/registry');

module.exports = {
  parseFormattedContent,
  containsFormatting,
  parseInlineFormatting,
  generateFormattedHtml,
  escapeHtmlPreserveFormatting,
  cleanUrl,
  isBoldClass,
  isItalicClass,
  isUnderlineClass,
  parseUniversal // new export
};
