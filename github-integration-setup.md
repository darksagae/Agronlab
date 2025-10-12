# GitHub Integration for Coolify - Complete Setup Guide

## 🚀 GitHub Integration Overview

This setup will enable automatic deployments of your AGROF platform whenever you push code to GitHub.

## 📋 Prerequisites

✅ **Coolify Dashboard**: Accessible at `http://10.0.0.1:8000`
✅ **GitHub Repository**: Your AGROF code repository
✅ **STI Server**: Connected and ready
✅ **SSH Keys**: Generated and configured

## 🔧 Step 1: Configure GitHub Repository

### Option A: Create New GitHub Repository
```bash
# Initialize git repository
cd /home/darksagae/Desktop/agrof-up
git init
git add .
git commit -m "Initial AGROF platform commit"

# Create GitHub repository (via web interface)
# Then connect local repository
git remote add origin https://github.com/YOUR_USERNAME/agrof-platform.git
git branch -M main
git push -u origin main
```

### Option B: Use Existing Repository
```bash
# If you already have a GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 🔗 Step 2: Coolify GitHub Integration Setup

### 2.1 Access Coolify Dashboard
1. **Open browser**: `http://10.0.0.1:8000`
2. **Login**: `admin@coolify.local` / `coolify123`

### 2.2 Configure Git Provider
1. **Go to**: Settings → Git Providers
2. **Click**: "Add Git Provider"
3. **Select**: GitHub
4. **Configure**:
   - **Provider**: GitHub
   - **Name**: GitHub-AGROF
   - **Personal Access Token**: (Create below)

### 2.3 Create GitHub Personal Access Token
1. **Go to**: [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. **Click**: "Generate new token (classic)"
3. **Configure**:
   - **Note**: `Coolify-AGROF-Integration`
   - **Expiration**: `No expiration` (or 1 year)
   - **Scopes**: Select:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `admin:repo_hook` (Full control of repository hooks)
     - ✅ `read:user` (Read user profile data)
     - ✅ `user:email` (Access user email addresses)
4. **Generate token** and copy it
5. **Paste token** in Coolify Git Provider settings

## 🏗️ Step 3: Create Coolify Projects

### 3.1 AGROF API Project
1. **Go to**: Projects → New Project
2. **Select**: "From Git Repository"
3. **Configure**:
   - **Name**: `agrof-api`
   - **Git Provider**: GitHub-AGROF
   - **Repository**: `YOUR_USERNAME/agrof-platform`
   - **Branch**: `main`
   - **Build Pack**: `Docker`
   - **Dockerfile Path**: `agrof-main/src/api/Dockerfile`

### 3.2 AGROF Store Project
1. **Create another project**:
   - **Name**: `agrof-store`
   - **Git Provider**: GitHub-AGROF
   - **Repository**: `YOUR_USERNAME/agrof-platform`
   - **Branch**: `main`
   - **Build Pack**: `Docker`
   - **Dockerfile Path**: `store-backend/Dockerfile`

## ⚙️ Step 4: Configure Environment Variables

### 4.1 API Service Environment
```env
# AGROF API Environment Variables
GEMINI_API_KEY=AIzaSyBE2b1nKpQd6LseRIVXfh10O_O3Pm0fvM0
FLASK_ENV=production
PORT=5000
DATABASE_URL=postgresql://agrof_user:agrof2024@postgres:5432/agrof_db
```

### 4.2 Store Service Environment
```env
# AGROF Store Environment Variables
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://agrof_user:agrof2024@postgres:5432/agrof_db
```

### 4.3 Database Service Environment
```env
# PostgreSQL Environment Variables
POSTGRES_DB=agrof_db
POSTGRES_USER=agrof_user
POSTGRES_PASSWORD=agrof2024
```

## 🔄 Step 5: Enable Auto-Deploy

### 5.1 Configure Webhooks
1. **In each project settings**:
   - **Enable**: "Auto Deploy"
   - **Branch**: `main`
   - **Trigger**: "On Push"

### 5.2 Test Auto-Deploy
1. **Make a small change** to your code
2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. **Watch** Coolify automatically build and deploy

## 📊 Step 6: Configure Services and Networking

### 6.1 Service Configuration
- **API Service**: Port 5000
- **Store Service**: Port 3000
- **Database**: Port 5432
- **Network**: Internal Docker network

### 6.2 Health Checks
- **API Health**: `/health`
- **Store Health**: `/api/products`
- **Database**: Connection test

## 🔍 Step 7: Monitoring and Logs

### 7.1 View Deployment Logs
1. **Go to**: Projects → [Project Name] → Logs
2. **Monitor**: Build and deployment progress
3. **Debug**: Any issues or failures

### 7.2 Set Up Notifications
1. **Go to**: Settings → Notifications
2. **Configure**: Email/Slack notifications
3. **Set alerts**: For deployment failures

## 🎯 GitHub Actions Alternative (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Coolify
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Trigger Coolify Deployment
      run: |
        curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}"
```

## ✅ Verification Checklist

- [ ] GitHub repository created/connected
- [ ] Personal Access Token generated
- [ ] Coolify Git Provider configured
- [ ] Projects created for API and Store
- [ ] Environment variables set
- [ ] Auto-deploy enabled
- [ ] Webhooks configured
- [ ] Test deployment successful

## 🚨 Troubleshooting

### Common Issues:
1. **Token Permissions**: Ensure all required scopes are selected
2. **Repository Access**: Verify repository is accessible
3. **Docker Build**: Check Dockerfile paths are correct
4. **Environment Variables**: Verify all required vars are set
5. **Network Issues**: Check firewall and port configurations

### Debug Steps:
1. **Check Coolify logs** for detailed error messages
2. **Verify GitHub webhooks** in repository settings
3. **Test manual deployment** first
4. **Check server resources** (CPU, memory, disk)

---

**Ready to set up GitHub integration!** Follow the steps above to enable automatic deployments.
