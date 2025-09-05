# Local Development Setup Guide

## Problem Solved

You were experiencing network errors during local testing because your frontend was trying to fetch from the production API endpoints (https://freedocs.onrender.com) instead of your local development server.

## Solution Implemented

### 1. Created Local Development Configuration
- **File**: `local-dev-config.js`
- **Purpose**: Provides local API endpoints for development
- **Endpoints**: Points to `http://localhost:3000` instead of production

### 2. Modified Frontend Code
- **File**: `script.js`
- **Change**: Added environment detection logic
- **Logic**: Automatically detects if running locally and uses appropriate config

### 3. Updated HTML Files
- **Files**: `index.html` and `public/index.html`
- **Change**: Added local-dev-config.js script inclusion
- **Order**: Loads local config first, then GitHub Pages config

## How It Works

### Environment Detection
The frontend now automatically detects the environment:

```javascript
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === '';
```

### Configuration Priority
1. **Local Development**: Uses `LOCAL_DEV_CONFIG` when hostname is localhost/127.0.0.1
2. **GitHub Pages**: Uses `GITHUB_PAGES_CONFIG` when deployed
3. **Fallback**: Uses relative URLs if no config available

## Running Locally

### 1. Start Backend Server
```bash
cd /home/prab/freeDocs
npm start
```
This starts the Express server on http://localhost:3000

### 2. Access Frontend
Open your browser and go to: http://localhost:3000

### 3. Test the Application
- The frontend will automatically use local API endpoints
- Network requests will go to localhost:3000 instead of production
- All API calls will be handled by your local server

## Development vs Production

| Environment | API Base URL | Configuration File |
|-------------|--------------|-------------------|
| Local Development | http://localhost:3000 | local-dev-config.js |
| GitHub Pages | https://freedocs.onrender.com | github-pages-config.js |

## Troubleshooting

### If you still get network errors:
1. **Check Backend Server**: Ensure `npm start` is running and shows "Server running on http://localhost:3000"
2. **Check Browser Console**: Open DevTools and check for any JavaScript errors
3. **Verify Configuration**: Ensure local-dev-config.js is loaded before github-pages-config.js
4. **Clear Browser Cache**: Hard refresh (Ctrl+F5) to ensure latest code is loaded

### Common Issues:
- **Port Already in Use**: If port 3000 is busy, the server will show an error
- **CORS Issues**: Should not occur since frontend and backend are on same origin
- **Missing Dependencies**: Run `npm install` if packages are missing

## Development Scripts

```bash
# Start production server
npm start

# Start development server with auto-restart
npm run dev

# Run tests
npm test

# Deploy to GitHub Pages
npm run deploy
```

## File Structure
```
/home/prab/freeDocs/
├── local-dev-config.js          # Local development configuration
├── github-pages-config.js       # Production configuration
├── script.js                    # Frontend JavaScript (with environment detection)
├── index.html                   # Main HTML file
├── src/
│   ├── server.js                # Express backend server
│   └── routes/
│       └── api.js               # API routes
└── public/
    ├── local-dev-config.js      # Copy for static serving
    ├── github-pages-config.js   # Copy for static serving
    ├── script.js                # Copy for static serving
    └── index.html               # Copy for static serving
```

The network error issue has been resolved. Your application now properly detects the environment and uses the correct API endpoints for local development.
