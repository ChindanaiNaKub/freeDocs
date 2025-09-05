/**
 * URL validation and normalization utilities for Google Docs
 */

const GOOGLE_DOCS_PATTERNS = [
  /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/,
  /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/
];

/**
 * Validates if a URL is a Google Docs URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid Google Docs URL
 */
function validateGoogleDocsUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check against known Google Docs patterns
  return GOOGLE_DOCS_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Extracts document ID from Google Docs URL
 * @param {string} url - The Google Docs URL
 * @returns {string|null} - The document ID or null if not found
 */
function extractDocId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  for (const pattern of GOOGLE_DOCS_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Normalizes Google Docs URL to mobilebasic format
 * @param {string} url - The original Google Docs URL
 * @returns {string|null} - The mobilebasic URL or null if invalid
 */
function normalizeTomobileBasic(url) {
  const docId = extractDocId(url);
  if (!docId) {
    return null;
  }

  return `https://docs.google.com/document/d/${docId}/mobilebasic`;
}

/**
 * Checks if URL is safe (prevents SSRF attacks)
 * @param {string} url - The URL to check
 * @returns {boolean} - True if URL is safe
 */
function isSafeUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Only allow Google Docs domains
    const allowedHosts = [
      'docs.google.com',
      'drive.google.com'
    ];
    
    return allowedHosts.includes(urlObj.hostname) && urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

module.exports = {
  validateGoogleDocsUrl,
  extractDocId,
  normalizeTomobileBasic,
  isSafeUrl
};
