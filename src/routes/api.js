const express = require('express');
const { validateGoogleDocsUrl, extractDocId } = require('../utils/urlValidator');
const { getArchiveSnapshot } = require('../utils/archiveClient');
const { parseArchivedContent } = require('../utils/contentParser');
const { parseUniversal } = require('../utils/formatParser');

const router = express.Router();

// GET /api/status - Check service status
router.get('/status', (req, res) => {
  // Get circuit breaker states from archive client
  const archiveClient = require('../utils/archiveClient');
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      'archive.org': {
        name: 'Internet Archive',
        priority: 1,
        status: 'available'
      },
      'direct': {
        name: 'Direct Fetch (Fallback)',
        priority: 2,
        status: 'available'
      }
    },
    features: {
      multiServiceFallback: true,
      caching: true,
      circuitBreaker: true,
      rateLimitHandling: true
    }
  });
});

// GET /api/render?url=<googleDocsUrl>&extractImages=<boolean>
router.get('/render', async (req, res) => {
  try {
    const { url, extractImages } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL parameter is required'
      });
    }

    // Validate and normalize URL
    if (!validateGoogleDocsUrl(url)) {
      return res.status(422).json({
        error: 'Invalid Google Docs URL'
      });
    }

    const docId = extractDocId(url);
    if (!docId) {
      return res.status(422).json({
        error: 'Could not extract document ID from URL'
      });
    }

    const mobileBasicUrl = `https://docs.google.com/document/d/${docId}/mobilebasic`;

    // Get archive snapshot with fallback services
    const archiveResult = await getArchiveSnapshot(mobileBasicUrl);
    if (!archiveResult || !archiveResult.url) {
      return res.status(502).json({
        error: 'Failed to create or retrieve archive snapshot'
      });
    }

    // Parse archived content with image extraction option
    const parseOptions = {
      extractImages: extractImages === 'true'
    };
    const { html } = await parseArchivedContent(archiveResult.url, parseOptions);

    res.json({
      html,
      archiveUrl: archiveResult.url,
      mobileBasicUrl,
      meta: {
        service: archiveResult.service,
        cached: archiveResult.cached,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in /api/render:', error);
    
    if (error.message.includes('archive')) {
      return res.status(502).json({
        error: 'Archive service error',
        details: error.message,
        suggestion: 'There was an issue with the archive services. Please try again.'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /api/parse?url=<googleDocsUrl>&autoDetectCode=<boolean>&showDeletions=<boolean>&extractImages=<boolean>
router.get('/parse', async (req, res) => {
  try {
    const { url, autoDetectCode, showDeletions, extractImages } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL parameter is required'
      });
    }

    // Parse boolean parameters
    const parseOptions = {
      autoDetectCode: autoDetectCode === 'true',
      showDeletions: showDeletions === 'true',
      extractImages: extractImages === 'true'
    };

    // Validate and normalize URL
    if (!validateGoogleDocsUrl(url)) {
      return res.status(422).json({
        error: 'Invalid Google Docs URL'
      });
    }

    const docId = extractDocId(url);
    if (!docId) {
      return res.status(422).json({
        error: 'Could not extract document ID from URL'
      });
    }

    const mobileBasicUrl = `https://docs.google.com/document/d/${docId}/mobilebasic`;

    // Get archive snapshot with fallback services
    const archiveResult = await getArchiveSnapshot(mobileBasicUrl);
    if (!archiveResult || !archiveResult.url) {
      return res.status(502).json({
        error: 'Failed to create or retrieve archive snapshot'
      });
    }

    // Parse archived content into structured blocks with options
    const { blocks } = await parseArchivedContent(archiveResult.url, parseOptions);

    res.json({
      archiveUrl: archiveResult.url,
      mobileBasicUrl,
      blocks,
      meta: {
        service: archiveResult.service,
        cached: archiveResult.cached,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in /api/parse:', error);
    
    // Handle archive-specific errors with appropriate status codes
    if (error.message.includes('rate limited')) {
      return res.status(429).json({
        error: 'Archive services are rate limited',
        details: error.message,
        retryAfter: 30, // seconds
        suggestion: 'Multiple archive services are experiencing high load. Please try again in 30 seconds.'
      });
    }
    
    if (error.message.includes('temporarily unavailable') || 
        error.message.includes('circuit breaker')) {
      return res.status(503).json({
        error: 'Archive services temporarily unavailable',
        details: error.message,
        suggestion: 'All archive services are currently down. Please try again in a few minutes.'
      });
    }
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Archive services timeout',
        details: error.message,
        suggestion: 'Archive services are responding slowly. Please try again.'
      });
    }
    
    if (error.message.includes('All archive services failed')) {
      return res.status(502).json({
        error: 'All archive services failed',
        details: error.message,
        suggestion: 'Multiple archive services tried but all failed. The document may not be publicly accessible.'
      });
    }
    
    if (error.message.includes('archive')) {
      return res.status(502).json({
        error: 'Archive service error',
        details: error.message,
        suggestion: 'There was an issue with the archive services. Please try again.'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /api/universal?url=<googleDocsUrl>&debug=<boolean>
// Uses the adaptive adapter-based parser to produce a normalized AST
router.get('/universal', async (req, res) => {
  try {
    const { url, debug } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    if (!validateGoogleDocsUrl(url)) {
      return res.status(422).json({ error: 'Invalid Google Docs URL' });
    }
    const docId = extractDocId(url);
    if (!docId) {
      return res.status(422).json({ error: 'Could not extract document ID from URL' });
    }
    const mobileBasicUrl = `https://docs.google.com/document/d/${docId}/mobilebasic`;
    const archiveResult = await getArchiveSnapshot(mobileBasicUrl);
    if (!archiveResult || !archiveResult.url) {
      return res.status(502).json({ error: 'Failed to create or retrieve archive snapshot' });
    }
    // Fetch raw archived HTML (cached path already handled by archive client)
    const { getArchivedContent, getCachedContent } = require('../utils/archiveClient');
    let raw = getCachedContent(archiveResult.url);
    if (!raw) raw = await getArchivedContent(archiveResult.url);
    if (!raw || typeof raw !== 'string') {
      return res.status(502).json({ error: 'Failed to fetch archived HTML content' });
    }
    const ast = parseUniversal(raw, { debug: debug === 'true' });
    res.json({
      archiveUrl: archiveResult.url,
      mobileBasicUrl,
      ast,
      meta: {
        service: archiveResult.service,
        cached: archiveResult.cached,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in /api/universal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/copy
router.post('/copy', async (req, res) => {
  try {
    const { url, mode = 'clean' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required'
      });
    }

    if (!['clean', 'additions'].includes(mode)) {
      return res.status(400).json({
        error: 'Mode must be "clean" or "additions"'
      });
    }

    // Reuse parse logic
    const parseResponse = await router.get('/parse');
    // This is simplified - in practice you'd refactor to share logic
    
    res.json({
      text: 'Copy functionality implementation pending'
    });

  } catch (error) {
    console.error('Error in /api/copy:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
