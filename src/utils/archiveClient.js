/**
 * Multi-service archive client with fallback support
 * Supports Internet Archive and direct fetching
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Circuit breaker state for each service
let circuitStates = {
  'archive.org': {
    isOpen: false,
    lastFailureTime: null,
    failureCount: 0,
    nextRetryTime: null
  },
  'direct': {
    isOpen: false,
    lastFailureTime: null,
    failureCount: 0,
    nextRetryTime: null
  }
};

const CIRCUIT_BREAKER_THRESHOLD = 3; // Open circuit after 3 consecutive failures
const CIRCUIT_BREAKER_TIMEOUT = 180000; // 3 minutes before trying again

// Service configurations
const SERVICES = {
  'archive.org': {
    name: 'Internet Archive',
    baseUrl: 'https://web.archive.org',
    timeout: 45000,
    priority: 1
  },
  'direct': {
    name: 'Direct Fetch',
    baseUrl: null,
    timeout: 20000,
    priority: 2
  }
};

const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES_PER_SERVICE = 2; // Reduced retries per service
const BASE_RETRY_DELAY = 1000; // 1 second
const RATE_LIMIT_DELAY = 30000; // 30 seconds for rate limit errors
const MAX_RETRY_DELAY = 60000; // 1 minute maximum delay

// Simple in-memory cache (could be replaced with Redis in production)
const contentCache = new Map();
const CACHE_TTL = 3600000; // 1 hour cache

/**
 * Generate cache key for URL
 */
function getCacheKey(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Check if cached content exists and is still valid
 */
function getCachedContent(url) {
  const key = getCacheKey(url);
  const cached = contentCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for: ${url}`);
    return cached.content;
  }
  
  if (cached) {
    contentCache.delete(key); // Remove expired cache
  }
  
  return null;
}

/**
 * Cache content for URL
 */
function setCachedContent(url, content) {
  const key = getCacheKey(url);
  contentCache.set(key, {
    content,
    timestamp: Date.now()
  });
  console.log(`Cached content for: ${url}`);
}

/**
 * Internet Archive service implementation
 */
async function submitToArchiveOrg(url) {
  try {
    console.log(`Trying Internet Archive for: ${url}`);

    // First check if snapshot already exists
    const availabilityUrl = `${SERVICES['archive.org'].baseUrl}/cdx/search/cdx?url=${encodeURIComponent(url)}&limit=1&output=json`;
    
    try {
      const availabilityResponse = await axios.get(availabilityUrl, {
        timeout: 15000
      });
      
      if (availabilityResponse.data && availabilityResponse.data.length > 1) {
        const latest = availabilityResponse.data[1]; // First row is headers
        const timestamp = latest[1];
        const archivedUrl = `${SERVICES['archive.org'].baseUrl}/web/${timestamp}/${url}`;
        console.log(`Found existing Internet Archive snapshot: ${archivedUrl}`);
        return archivedUrl;
      }
    } catch (checkError) {
      console.log('Could not check existing snapshots, proceeding with new archive...');
    }

    // Submit for archiving
    const saveUrl = `${SERVICES['archive.org'].baseUrl}/save/${url}`;
    const saveResponse = await axios.get(saveUrl, {
      timeout: SERVICES['archive.org'].timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FreeDocs/1.0)'
      }
    });

    if (saveResponse.status === 200) {
      // Internet Archive doesn't immediately return the archive URL
      // We need to wait a bit and then check for the snapshot
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Try to get the archived URL
      try {
        const checkResponse = await axios.get(availabilityUrl, { timeout: 10000 });
        if (checkResponse.data && checkResponse.data.length > 1) {
          const latest = checkResponse.data[1];
          const timestamp = latest[1];
          const archivedUrl = `${SERVICES['archive.org'].baseUrl}/web/${timestamp}/${url}`;
          console.log(`Created Internet Archive snapshot: ${archivedUrl}`);
          return archivedUrl;
        }
      } catch (checkError) {
        // Fallback: construct likely URL
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
        const fallbackUrl = `${SERVICES['archive.org'].baseUrl}/web/${timestamp}/${url}`;
        return fallbackUrl;
      }
    }

    throw new Error('Archive submission failed');

  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Internet Archive rate limited');
    }
    throw new Error(`Internet Archive error: ${error.message}`);
  }
}

/**
 * Direct fetch implementation (as fallback)
 */
async function directFetch(url) {
  try {
    console.log(`Trying direct fetch for: ${url}`);

    const response = await axios.get(url, {
      timeout: SERVICES['direct'].timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FreeDocs/1.0)'
      },
      maxRedirects: 5
    });

    if (response.status === 200 && response.data) {
      console.log(`Direct fetch successful for: ${url}`);
      setCachedContent(url, response.data);
      return url; // Return original URL since we're not archiving
    }

    throw new Error('Direct fetch failed');

  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Direct fetch rate limited');
    }
    throw new Error(`Direct fetch error: ${error.message}`);
  }
}

/**
 * Checks if circuit breaker should prevent requests for a service
 * @param {string} service - The service name
 * @returns {boolean} - True if circuit is open and should block requests
 */
function isCircuitOpen(service) {
  const state = circuitStates[service];
  if (!state || !state.isOpen) {
    return false;
  }
  
  const now = Date.now();
  if (now >= state.nextRetryTime) {
    // Reset circuit breaker after timeout
    state.isOpen = false;
    state.failureCount = 0;
    state.lastFailureTime = null;
    state.nextRetryTime = null;
    console.log(`Circuit breaker reset for ${service} - attempting service again`);
    return false;
  }
  
  return true;
}

/**
 * Records a failure for circuit breaker tracking
 * @param {string} service - The service name
 * @param {Error} error - The error that occurred
 */
function recordFailure(service, error) {
  const state = circuitStates[service] || (circuitStates[service] = { 
    isOpen: false, failureCount: 0, lastFailureTime: null, nextRetryTime: null 
  });
  
  state.failureCount++;
  state.lastFailureTime = Date.now();
  
  // Open circuit if we've hit the threshold
  if (state.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    state.isOpen = true;
    state.nextRetryTime = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
    console.warn(`Circuit breaker opened for ${service} due to ${state.failureCount} failures. Next retry in ${CIRCUIT_BREAKER_TIMEOUT / 1000}s`);
  }
}

/**
 * Records a success for circuit breaker tracking
 * @param {string} service - The service name
 */
function recordSuccess(service) {
  const state = circuitStates[service];
  if (state) {
    state.failureCount = 0;
    state.lastFailureTime = null;
    if (state.isOpen) {
      state.isOpen = false;
      state.nextRetryTime = null;
      console.log(`Circuit breaker closed for ${service} after successful request`);
    }
  }
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(attempt, isRateLimit = false) {
  if (isRateLimit) {
    const jitter = Math.random() * 5000; // 0-5 seconds of jitter
    return RATE_LIMIT_DELAY + jitter;
  }
  
  // Exponential backoff: 2^attempt * baseDelay + jitter
  const exponentialDelay = Math.pow(2, attempt - 1) * BASE_RETRY_DELAY;
  const jitter = Math.random() * 1000; // 0-1 second of jitter
  const totalDelay = exponentialDelay + jitter;
  
  return Math.min(totalDelay, MAX_RETRY_DELAY);
}

/**
 * Try a specific archive service with retries
 * @param {string} service - Service name
 * @param {string} url - URL to archive
 * @returns {Promise<string>} - Archive URL
 */
async function tryService(service, url) {
  // Check circuit breaker
  if (isCircuitOpen(service)) {
    const state = circuitStates[service];
    const waitTime = Math.round((state.nextRetryTime - Date.now()) / 1000);
    throw new Error(`${SERVICES[service].name} temporarily unavailable (circuit breaker open). Next retry in ${waitTime}s`);
  }

  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_SERVICE; attempt++) {
    try {
      console.log(`${SERVICES[service].name} attempt ${attempt}/${MAX_RETRIES_PER_SERVICE} for: ${url}`);
      
      let result;
      switch (service) {
        case 'archive.org':
          result = await submitToArchiveOrg(url);
          break;
        case 'direct':
          result = await directFetch(url);
          break;
        default:
          throw new Error(`Unknown service: ${service}`);
      }
      
      if (result) {
        recordSuccess(service);
        return result;
      }
      
      throw new Error('No result returned');
      
    } catch (error) {
      lastError = error;
      console.warn(`${SERVICES[service].name} attempt ${attempt} failed:`, error.message);
      
      if (attempt < MAX_RETRIES_PER_SERVICE) {
        const isRateLimit = error.message.includes('rate limited') || 
                           error.message.includes('429');
        const retryDelay = calculateRetryDelay(attempt, isRateLimit);
        
        console.log(`Retrying ${SERVICES[service].name} in ${Math.round(retryDelay / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  // Record failure only after all retries exhausted
  recordFailure(service, lastError);
  throw lastError;
}
/**
 * Gets archive snapshot with multi-service fallback
 * @param {string} url - The URL to archive
 * @returns {Promise<{url: string, service: string, cached: boolean}>} - Archive result
 */
async function getArchiveSnapshot(url) {
  // Check cache first
  const cached = getCachedContent(url);
  if (cached) {
    return {
      url: url,
      service: 'cache',
      cached: true
    };
  }

  // Try services in priority order
  const servicesToTry = Object.keys(SERVICES).sort((a, b) => 
    SERVICES[a].priority - SERVICES[b].priority
  );

  const errors = [];
  
  for (const service of servicesToTry) {
    try {
      console.log(`Trying ${SERVICES[service].name}...`);
      const archiveUrl = await tryService(service, url);
      
      if (archiveUrl) {
        console.log(`Successfully archived with ${SERVICES[service].name}: ${archiveUrl}`);
        return {
          url: archiveUrl,
          service: service,
          cached: false
        };
      }
    } catch (error) {
      console.warn(`${SERVICES[service].name} failed:`, error.message);
      errors.push(`${SERVICES[service].name}: ${error.message}`);
      
      // For rate limiting, don't try other services immediately
      if (error.message.includes('rate limited')) {
        console.log('Rate limited, trying next service...');
        continue;
      }
      
      // For circuit breaker, skip to next service
      if (error.message.includes('circuit breaker')) {
        console.log('Circuit breaker open, trying next service...');
        continue;
      }
    }
  }
  
  // All services failed
  const errorMessage = `All archive services failed:\n${errors.join('\n')}`;
  throw new Error(errorMessage);
}

/**
 * Get content from archived URL or cache
 * @param {string} url - The URL to get content from
 * @returns {Promise<string>} - The content
 */
async function getArchivedContent(url) {
  // Check if this is a cached direct URL
  const cached = getCachedContent(url);
  if (cached) {
    return cached;
  }
  
  // Otherwise fetch from archive URL
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FreeDocs/1.0)'
      }
    });
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to fetch archived content');
  } catch (error) {
    throw new Error(`Error fetching archived content: ${error.message}`);
  }
}

/**
 * Checks if an archive URL exists and is accessible
 * @param {string} archiveUrl - The archive URL to check
 * @returns {Promise<boolean>} - True if accessible
 */
async function isArchiveAccessible(archiveUrl) {
  try {
    const response = await axios.head(archiveUrl, {
      timeout: 10000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now();
  const expired = [];
  
  for (const [key, value] of contentCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      expired.push(key);
    }
  }
  
  expired.forEach(key => contentCache.delete(key));
  
  if (expired.length > 0) {
    console.log(`Cleared ${expired.length} expired cache entries`);
  }
}

// Clean cache every hour
setInterval(clearExpiredCache, 3600000);

module.exports = {
  getArchiveSnapshot,
  getArchivedContent,
  isArchiveAccessible,
  getCachedContent,
  setCachedContent,
  // Legacy compatibility
  submitToArchive: (url) => getArchiveSnapshot(url).then(result => result.url)
};
