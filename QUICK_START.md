# 🚀 AGROF Coolify Quick Start Guide

## ✅ What's Already Done

- ✅ Coolify installed and running
- ✅ WireGuard VPN configured  
- ✅ GitHub App created with all credentials
- ✅ Private key uploaded and linked
- ✅ Project "My first project" created
- ✅ Environment "production" set up
- ✅ STI server connected

## 🎯 What You Need to Do NOW

### **Step 1: Get Your GitHub App Installation ID** ⚠️

1. Open browser and go to: https://github.com/settings/installations
2. Click on **"AGROF-Integration"**
3. Look at the URL - the number at the end is your Installation ID
   Example: `https://github.com/settings/installations/12345678`
   → Your Installation ID is `12345678`

### **Step 2: Update the Installation ID**

Run this command (replace `XXXXXXXX` with your real ID):
```bash
sudo docker exec coolify php artisan tinker --execute="\$app = \App\Models\GithubApp::find(2); \$app->installation_id = 'XXXXXXXX'; \$app->save(); echo 'Updated to: ' . \$app->installation_id . PHP_EOL;"
```

### **Step 3: Access Coolify Dashboard**

```bash
# Open in browser:
http://10.0.0.1:8000

# Login with:
Email: admin@coolify.local
Password: coolify123
```

### **Step 4: Sync GitHub Repositories**

In Coolify dashboard:
1. Go to **Settings** → **Sources**
2. Click on **"AGROF-Integration"**
3. Click **"Update Repositories"** button
4. Your GitHub repos should now appear!

### **Step 5: Create Your First Application**

1. Go to **Projects** → **"My first project"** → **production**
2. Click **"+ New Resource"** → **"Application"**
3. Select **"AGROF-Integration"** as source
4. Choose your `agrof-up` repository
5. Configure:
   - **Name**: AGROF API
   - **Branch**: main
   - **Build Pack**: Dockerfile
   - **Dockerfile Path**: `agrof-main/src/api/Dockerfile`
   - **Port**: 5000
6. Add environment variables:
   ```
   PORT=5000
   GEMINI_API_KEY=your_key_here
   ```
7. Click **"Save"** → **"Deploy"**

## 📋 Useful Commands

### Check Configuration:
```bash
# View GitHub App status
sudo docker exec coolify php artisan tinker --execute="\$app = \App\Models\GithubApp::find(2); echo 'App ID: ' . \$app->app_id . PHP_EOL; echo 'Installation ID: ' . \$app->installation_id . PHP_EOL;"

# List all projects
sudo docker exec coolify php artisan tinker --execute="\App\Models\Project::all(['name'])->each(function(\$p) { echo \$p->name . PHP_EOL; });"

# Check Coolify status
sudo docker ps | grep coolify
```

### Troubleshooting:
```bash
# Restart Coolify
cd /data/coolify/source && sudo docker compose restart

# View logs
sudo docker logs coolify -f

# Check WireGuard
sudo wg show
```

## 🆘 Need Help?

- **Can't access dashboard?** Make sure WireGuard is running: `sudo wg show`
- **GitHub not syncing?** Check Installation ID is correct
- **Deployment failing?** Check Docker logs: `sudo docker logs coolify -f`

## 📚 Full Documentation

- See `COOLIFY_STATUS.md` for complete configuration details
- See `get-installation-id.md` for detailed Installation ID instructions
- See `complete-coolify-deployment.md` for full deployment guide

---

**You're 90% done! Just need the Installation ID to complete setup! 🎉**
