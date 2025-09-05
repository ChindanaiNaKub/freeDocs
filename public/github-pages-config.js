// GitHub Pages configuration
// This file configures the frontend to work with GitHub Pages deployment

// Configuration for GitHub Pages deployment
const GITHUB_PAGES_CONFIG = {
    // Repository name (will be part of the URL path)
    repoName: 'freeDocs',
    
    // Base URL for GitHub Pages (username.github.io/repo-name)
    baseUrl: '/freeDocs',
    
    // API endpoint configuration
    // Backend deployed on Render
    apiEndpoints: {
        // Replace 'your-app-name' with your actual Render app name
        base: 'https://freedocs-api.onrender.com',
        archive: 'https://freedocs-api.onrender.com/api/archive',
        parse: 'https://freedocs-api.onrender.com/api/parse',
        health: 'https://freedocs-api.onrender.com/api/health'
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GITHUB_PAGES_CONFIG;
} else {
    window.GITHUB_PAGES_CONFIG = GITHUB_PAGES_CONFIG;
}