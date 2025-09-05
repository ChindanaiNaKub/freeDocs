// GitHub Pages configuration
// This file configures the frontend to work with GitHub Pages deployment

// Configuration for GitHub Pages deployment
const GITHUB_PAGES_CONFIG = {
    // Repository name (will be part of the URL path)
    repoName: 'freeDocs',
    
    // Base URL for GitHub Pages (username.github.io/repo-name)
    baseUrl: '/freeDocs',
    
    // API endpoint configuration
    // For GitHub Pages, you'll need to either:
    // 1. Deploy API separately (e.g., Vercel, Netlify Functions, Railway)
    // 2. Use a CORS proxy service
    // 3. Implement client-side only functionality
    
    // Example API endpoints (replace with your deployed API)
    apiEndpoints: {
        // If you deploy the API elsewhere:
        // archive: 'https://your-api-domain.com/api/archive',
        // parse: 'https://your-api-domain.com/api/parse'
        
        // For now, using CORS proxy (not recommended for production)
        archive: 'https://cors-anywhere.herokuapp.com/https://web.archive.org',
        parse: '/api/parse' // This won't work on GitHub Pages without backend
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GITHUB_PAGES_CONFIG;
} else {
    window.GITHUB_PAGES_CONFIG = GITHUB_PAGES_CONFIG;
}