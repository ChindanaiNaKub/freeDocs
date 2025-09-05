# Render Deployment Guide

This guide explains how to deploy your FreeDocs backend to Render.

## Prerequisites

1. Create a free account at [render.com](https://render.com)
2. Connect your GitHub account to Render
3. Your code should be pushed to GitHub

## Deployment Steps

### Option A: Deploy via Render Dashboard (Recommended)

1. **Go to Render Dashboard:**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New" → "Web Service"

2. **Connect Repository:**
   - Select "Build and deploy from a Git repository"
   - Connect your GitHub account if not already connected
   - Select the `freeDocs` repository

3. **Configure the Service:**
   ```
   Name: freedocs-api
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: (leave blank)
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables:**
   ```
   NODE_ENV = production
   ```

5. **Choose Plan:**
   - Free tier is sufficient for testing
   - Paid plans offer better performance and no sleep mode

6. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete (usually 2-5 minutes)

### Option B: Deploy via render.yaml (Infrastructure as Code)

The `render.yaml` file is already configured in your repository:

1. **Go to Render Dashboard**
2. **Click "New" → "Blueprint"**
3. **Connect your repository**
4. **Render will automatically use the `render.yaml` configuration**

## Your API Endpoints

Once deployed, your API will be available at:
```
https://freedocs-api.onrender.com
```

Available endpoints:
- `GET /api/health` - Health check
- `POST /api/archive` - Create Internet Archive snapshot  
- `POST /api/parse` - Parse Google Docs content
- `GET /` - Serves the main page (for testing backend directly)

## Update Frontend Configuration

The GitHub Pages frontend is already configured to use your Render API:
- Check `public/github-pages-config.js`
- API base URL: `https://freedocs-api.onrender.com`

## Important Notes

### Free Tier Limitations
- **Sleep Mode**: Free services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes 30-60 seconds
- **Build Time**: 512MB RAM during builds
- **Monthly Limits**: 750 hours/month (sufficient for most projects)

### Custom Domain (Optional)
- Add a custom domain in Render dashboard
- Update the API base URL in `github-pages-config.js`

### Environment Variables
You can add more environment variables in the Render dashboard:
- Database URLs
- API keys
- Custom configuration

## Testing Your Deployment

1. **Test the health endpoint:**
   ```bash
   curl https://freedocs-api.onrender.com/api/health
   ```

2. **Test your GitHub Pages frontend:**
   - Visit: https://chindanainaKub.github.io/freeDocs
   - The frontend should now connect to your Render backend

## Monitoring and Logs

1. **View Logs:**
   - Go to your service in Render dashboard
   - Click "Logs" tab to see real-time logs

2. **Monitor Performance:**
   - Check the "Metrics" tab for response times and uptime

## Troubleshooting

### Common Issues:

1. **Service Won't Start:**
   - Check logs for error messages
   - Verify `package.json` has correct `start` script
   - Ensure all dependencies are in `dependencies` (not `devDependencies`)

2. **CORS Issues:**
   - Your Express app already has CORS configured
   - Check the frontend is using the correct API URL

3. **Cold Starts:**
   - First request after sleep is slow (free tier limitation)
   - Consider upgrading to paid plan for production

### Updating Your Service

To update your deployed service:
1. Push changes to your GitHub repository
2. Render will automatically redeploy
3. Or manually redeploy from the Render dashboard

## Next Steps

1. **Deploy to Render** using one of the methods above
2. **Test your API endpoints** 
3. **Update frontend** if you change the service name
4. **Consider upgrading** to a paid plan for production use

## Alternative: Manual Deployment Commands

If you prefer command-line deployment, you can also use:
```bash
# Install Render CLI (optional)
npm install -g @render/cli

# Login to Render
render login

# Deploy from CLI
render deploy
```

Your backend will be live and connected to your GitHub Pages frontend!
