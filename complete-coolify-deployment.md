# Complete Coolify Deployment Guide

## 🎯 Phase 1: GitHub Integration Setup

### Step 1: Create GitHub Personal Access Token
1. **Go to**: [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. **Click**: "Generate new token (classic)"
3. **Configure**:
   - **Note**: `Coolify-AGROF-Production`
   - **Expiration**: `No expiration`
   - **Scopes**: 
     - ✅ `repo` (Full control of private repositories)
     - ✅ `admin:repo_hook` (Full control of repository hooks)
     - ✅ `read:user` (Read user profile data)
     - ✅ `user:email` (Access user email addresses)
4. **Generate and copy** the token

### Step 2: Configure Coolify Git Provider
1. **Access**: `http://10.0.0.1:8000`
2. **Login**: `admin@coolify.local` / `coolify123`
3. **Go to**: Settings → Git Providers
4. **Add Provider**:
   - **Name**: `GitHub-AGROF`
   - **Type**: GitHub
   - **Token**: Paste your Personal Access Token
5. **Test Connection**

## 🏗️ Phase 2: Create Coolify Projects

### Project 1: AGROF API Service
1. **Go to**: Projects → New Project
2. **Select**: "From Git Repository"
3. **Configure**:
   - **Name**: `agrof-api`
   - **Git Provider**: GitHub-AGROF
   - **Repository**: `YOUR_USERNAME/agrof-platform`
   - **Branch**: `main`
   - **Build Pack**: `Docker`
   - **Dockerfile Path**: `agrof-main/src/api/Dockerfile`
   - **Port**: `5000`

### Project 2: AGROF Store Service
1. **Create New Project**:
   - **Name**: `agrof-store`
   - **Git Provider**: GitHub-AGROF
   - **Repository**: `YOUR_USERNAME/agrof-platform`
   - **Branch**: `main`
   - **Build Pack**: `Docker`
   - **Dockerfile Path**: `store-backend/Dockerfile`
   - **Port**: `3000`

### Project 3: PostgreSQL Database
1. **Create New Project**:
   - **Name**: `agrof-postgres`
   - **Type**: Database
   - **Database**: PostgreSQL
   - **Port**: `5432`

## ⚙️ Phase 3: Environment Configuration

### API Service Environment Variables
```env
GEMINI_API_KEY=AIzaSyBE2b1nKpQd6LseRIVXfh10O_O3Pm0fvM0
FLASK_ENV=production
PORT=5000
DATABASE_URL=postgresql://agrof_user:agrof2024@agrof-postgres:5432/agrof_db
CORS_ORIGINS=*
```

### Store Service Environment Variables
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://agrof_user:agrof2024@agrof-postgres:5432/agrof_db
```

### Database Environment Variables
```env
POSTGRES_DB=agrof_db
POSTGRES_USER=agrof_user
POSTGRES_PASSWORD=agrof2024
```

## 🔄 Phase 4: Enable Auto-Deploy

### Configure Webhooks
1. **For each project**:
   - **Enable**: "Auto Deploy"
   - **Branch**: `main`
   - **Trigger**: "On Push"

### Test Auto-Deploy
1. **Make test change**:
   ```bash
   echo "# Test deployment" >> README.md
   git add README.md
   git commit -m "Test auto-deploy"
   git push origin main
   ```
2. **Watch Coolify** automatically build and deploy

## 🌐 Phase 5: Configure Networking

### Service Communication
- **API Service**: Internal port 5000
- **Store Service**: Internal port 3000
- **Database**: Internal port 5432
- **External Access**: Configure reverse proxy

### Health Checks
- **API Health**: `GET /health`
- **Store Health**: `GET /api/products`
- **Database**: Connection test

## 📊 Phase 6: Deployment Verification

### Check Service Status
1. **API Service**: `curl http://localhost:5000/health`
2. **Store Service**: `curl http://localhost:3000/api/products`
3. **Database**: Test connection

### View Logs
1. **Go to**: Projects → [Project Name] → Logs
2. **Monitor**: Build and runtime logs
3. **Debug**: Any issues

## 🎉 Deployment Complete!

After completing these steps, your AGROF platform will be:
- ✅ **Automatically deployed** on code changes
- ✅ **Fully containerized** and scalable
- ✅ **Connected to production database**
- ✅ **Ready for external access**

---

**Next**: Configure domains and SSL certificates for public access.
