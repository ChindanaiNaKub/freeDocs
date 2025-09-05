# GitHub Pages Deployment Guide

This guide explains how to deploy the FreeDocs frontend to GitHub Pages.

## Prerequisites

1. Your code should be pushed to a GitHub repository
2. You should have Node.js and npm installed locally
3. Install the `gh-pages` package: `npm install`

## Deployment Steps

### Option A: Automatic Deployment with gh-pages

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

   This will:
   - Copy files from `public/` to the root
   - Create a `gh-pages` branch
   - Push the static files to GitHub Pages

### Option B: Manual GitHub Pages Setup

1. **Go to your GitHub repository**
2. **Navigate to Settings > Pages**
3. **Select source:**
   - Source: "Deploy from a branch"
   - Branch: "gh-pages" (after running `npm run deploy`)
   - Folder: "/ (root)"

4. **Your site will be available at:**
   ```
   https://YOUR_USERNAME.github.io/freeDocs
   ```

## Important Notes

### Backend Limitations
GitHub Pages only supports static sites. The Express.js backend won't work directly. You have several options:

1. **Deploy API separately:**
   - Use services like Vercel, Netlify Functions, or Railway
   - Update `public/github-pages-config.js` with your API URL

2. **Client-side only approach:**
   - Modify the frontend to work without the backend
   - Use CORS proxies for Internet Archive access (not recommended for production)

3. **Hybrid approach:**
   - Keep the frontend on GitHub Pages
   - Deploy the backend on a separate service

### File Structure for GitHub Pages
After deployment, your GitHub Pages site will serve files from the `public/` directory:
- `index.html` (main page)
- `styles.css` (styling)
- `script.js` (JavaScript functionality)
- `github-pages-config.js` (configuration)

## Troubleshooting

### Common Issues:

1. **404 Error:** Make sure GitHub Pages is enabled in repository settings
2. **Broken styles/scripts:** Check that file paths are correct for the subdirectory
3. **API calls failing:** Remember that the backend won't work on GitHub Pages

### Testing Locally
Before deploying, test the static version:
```bash
# Copy public files to root
npm run build:gh-pages

# Serve locally (you can use any static server)
npx serve .
```

## Alternative Deployment Platforms

If you need full-stack functionality, consider these alternatives:
- **Vercel**: Supports both frontend and serverless functions
- **Netlify**: Similar to Vercel with great GitHub integration
- **Railway**: Great for full Node.js applications
- **Heroku**: Traditional platform for full-stack apps

## Next Steps

1. Run `npm run deploy` to deploy your site
2. Check your GitHub Pages URL
3. Consider deploying the API to a separate service if needed
4. Update the frontend configuration to point to your API endpoint