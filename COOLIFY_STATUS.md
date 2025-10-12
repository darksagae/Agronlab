# 🎉 Coolify Configuration Status

## ✅ Successfully Configured

### 1. **Project Setup**
- **Project Name**: My first project
- **Project UUID**: `ek8kwosksoc44cs8gwgsoc8c`
- **Environment**: production (`fsw4oo08ccgkw04oc8cos4kc`)

### 2. **Server Infrastructure**
- **Localhost**: `host.docker.internal` (Coolify's own server)
- **STI Server**: `102.209.111.68` (worrisome-wombat-cw0gowskgsg4cc8woksc8w04)
  - User: `darksagae`

### 3. **GitHub App Integration** ✅
- **Name**: AGROF-Integration
- **App ID**: `2103126` ✅
- **Client ID**: `Iv2313qWUPwLyuEEpb` ✅
- **Client Secret**: Configured ✅
- **Webhook Secret**: Configured ✅
- **Private Key**: Linked (ID: 2) ✅

### 4. **Services Status**
- **Coolify**: Running at `http://10.0.0.1:8000`
- **WireGuard VPN**: Active
- **Docker**: Running

---

## ⚠️ Action Required: Get Real Installation ID

The GitHub App Installation ID is currently set to a placeholder (`1234567890`). You need to get the **real Installation ID** from GitHub:

### **How to Find Installation ID:**

#### **Method 1: Via GitHub Settings (Easiest)**
1. Go to: https://github.com/settings/installations
2. Click on **"AGROF-Integration"** (or your GitHub App name)
3. Look at the URL - it will be something like:
   ```
   https://github.com/settings/installations/12345678
   ```
   The number at the end (`12345678`) is your **Installation ID**

#### **Method 2: Via GitHub API**
```bash
# Replace YOUR_APP_ID with 2103126
# Replace YOUR_INSTALLATION_TOKEN with a token from your app
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/app/installations
```

### **Update Installation ID in Coolify:**
Once you have the real Installation ID, run:
```bash
sudo docker exec coolify php artisan tinker --execute="\$app = \App\Models\GithubApp::find(2); \$app->installation_id = 'YOUR_REAL_INSTALLATION_ID'; \$app->save(); echo 'Installation ID updated!' . PHP_EOL;"
```

---

## 🚀 Next Steps After Getting Installation ID

### **Step 1: Update Repositories in Coolify**
1. Go to: `http://10.0.0.1:8000`
2. Login with: `admin@coolify.local` / `coolify123`
3. Navigate to: **Settings > Source > AGROF-Integration**
4. Click **"Update Repositories"**
5. You should now see your GitHub repositories

### **Step 2: Create Your First Application**
1. Go to your project: **My first project**
2. Go to environment: **production**
3. Click **"+ New Resource"**
4. Select **"Application"**
5. Choose **"AGROF-Integration"** as the source
6. Select your repository (e.g., `agrof-up`)
7. Configure:
   - **Branch**: `main`
   - **Build Pack**: Auto-detect or Dockerfile
   - **Port**: 5000 (for API) or 3000 (for Store)

### **Step 3: Deploy Your Services**

#### **For Python AI API:**
- **Name**: AGROF API
- **Repository**: Your repo
- **Branch**: main
- **Dockerfile Path**: `agrof-main/src/api/Dockerfile`
- **Port**: 5000
- **Environment Variables**:
  ```
  PORT=5000
  GEMINI_API_KEY=your_key_here
  ```

#### **For Node.js Store Backend:**
- **Name**: AGROF Store
- **Repository**: Your repo
- **Branch**: main
- **Dockerfile Path**: `store-backend/Dockerfile`
- **Port**: 3000
- **Environment Variables**:
  ```
  PORT=3000
  DATABASE_URL=postgres://user:password@postgres:5432/agrof_db
  ```

#### **For PostgreSQL Database:**
- Click **"+ New Resource"**
- Select **"Database"**
- Choose **"PostgreSQL"**
- Configure credentials

---

## 📋 Coolify Terminal Commands Reference

### **Check Configuration:**
```bash
# List all projects
sudo docker exec coolify php artisan tinker --execute="\App\Models\Project::all(['id', 'name', 'uuid'])->each(function(\$p) { echo 'ID: ' . \$p->id . ' | Name: ' . \$p->name . ' | UUID: ' . \$p->uuid . PHP_EOL; });"

# List all GitHub Apps
sudo docker exec coolify php artisan tinker --execute="\App\Models\GithubApp::all(['id', 'name', 'app_id', 'installation_id'])->each(function(\$g) { echo 'ID: ' . \$g->id . ' | Name: ' . \$g->name . ' | App ID: ' . \$g->app_id . ' | Installation ID: ' . \$g->installation_id . PHP_EOL; });"

# List all applications
sudo docker exec coolify php artisan tinker --execute="\App\Models\Application::all(['id', 'name', 'uuid'])->each(function(\$a) { echo 'ID: ' . \$a->id . ' | Name: ' . \$a->name . ' | UUID: ' . \$a->uuid . PHP_EOL; });"

# List all servers
sudo docker exec coolify php artisan tinker --execute="\App\Models\Server::all(['id', 'name', 'ip'])->each(function(\$s) { echo 'ID: ' . \$s->id . ' | Name: ' . \$s->name . ' | IP: ' . \$s->ip . PHP_EOL; });"
```

### **Reset Admin Password:**
```bash
sudo docker exec coolify php artisan root:reset-password
```

### **Check Deployment Queue:**
```bash
sudo docker exec coolify php artisan check:deployment-queue
```

### **View Horizon Status (Job Queue):**
```bash
sudo docker exec coolify php artisan horizon:status
```

---

## 🔐 Important Credentials

### **Coolify Dashboard:**
- **URL**: `http://10.0.0.1:8000`
- **Email**: `admin@coolify.local`
- **Password**: `coolify123`

### **WireGuard VPN:**
- **Client Config**: `/home/darksagae/Desktop/agrof-up/coolify-client.conf`
- **Server IP**: `10.0.0.1`
- **Client IP**: `10.0.0.3`

### **GitHub App:**
- **App ID**: `2103126`
- **URL**: https://github.com/apps/agrof-integration

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                  (agrof-up codebase)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ GitHub App Integration
                     │ (Webhooks, Auto-deploy)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Coolify Platform                        │
│          (Running on STI Server: 102.209.111.68)        │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ AGROF API   │  │ AGROF Store  │  │ PostgreSQL DB  │ │
│  │ (Port 5000) │  │ (Port 3000)  │  │ (Port 5432)    │ │
│  │ Python Flask│  │ Node.js      │  │                │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────┘
                     │
                     │ WireGuard VPN Tunnel
                     │ (10.0.0.1 ↔ 10.0.0.3)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Your Local Machine                      │
│              (Access via 10.0.0.1:8000)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Current Status: 90% Complete!

### ✅ **Completed:**
1. Coolify installed and running
2. WireGuard VPN configured
3. Project and environment created
4. STI server connected
5. GitHub App created and configured
6. Private key uploaded and linked

### ⏳ **Remaining:**
1. Get real GitHub Installation ID
2. Update Installation ID in Coolify
3. Sync repositories
4. Create application resources
5. Deploy services
6. Configure domains and SSL (optional)

---

## 🆘 Troubleshooting

### **Can't access Coolify dashboard:**
```bash
# Check if Coolify is running
sudo docker ps | grep coolify

# Check WireGuard status
sudo wg show

# Restart Coolify if needed
cd /data/coolify/source && sudo docker compose restart
```

### **GitHub App not syncing:**
```bash
# Check GitHub App configuration
sudo docker exec coolify php artisan tinker --execute="\$app = \App\Models\GithubApp::find(2); print_r(\$app->toArray());"
```

### **Deployment issues:**
```bash
# Check deployment queue
sudo docker exec coolify php artisan check:deployment-queue

# View logs
sudo docker logs coolify -f
```

---

## 📚 Useful Links

- **Coolify Docs**: https://coolify.io/docs/
- **STI Console**: https://console.sti.go.ug/
- **GitHub Apps**: https://github.com/settings/apps
- **Your GitHub App**: https://github.com/apps/agrof-integration

---

**Last Updated**: October 12, 2025
**Status**: Ready for Installation ID and Deployment 🚀

