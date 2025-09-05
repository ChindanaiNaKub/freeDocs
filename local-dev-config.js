// Local development configuration
// This file configures the frontend to work with local development server

const LOCAL_DEV_CONFIG = {
    // Repository name
    repoName: 'freeDocs',
    
    // Base URL for local development
    baseUrl: '',
    
    // API endpoint configuration for local development
    apiEndpoints: {
        base: 'http://localhost:3000',
        archive: 'http://localhost:3000/api/archive',
        parse: 'http://localhost:3000/api/parse',
        health: 'http://localhost:3000/api/health'
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LOCAL_DEV_CONFIG;
} else {
    window.LOCAL_DEV_CONFIG = LOCAL_DEV_CONFIG;
}
