# STI to Coolify Integration - Complete Setup Guide

## ✅ SSH Key Generated Successfully!

**Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINORqX+3fh0eqy6lgDpxBwJacG03wanMa1eYC+INwn8d coolify-sti-integration
```

**Key Fingerprint:** SHA256:0NzldvDjPpC1/fgTcz5xxZk0uJOl6ZJRMBkl9C+PoOA

## 🚀 Step-by-Step Integration Process

### Step 1: Access Coolify Dashboard
1. **Open your browser**
2. **Go to:** `http://10.0.0.1:8000`
3. **Login with:**
   - Email: `admin@coolify.local`
   - Password: `coolify123`

### Step 2: Add STI Server as Resource
1. **Navigate to:** Resources → Servers
2. **Click:** "Add New Server"
3. **Fill in the details:**
   - **Name:** `STI-Production-Server`
   - **Host:** `localhost` (or `127.0.0.1`)
   - **Port:** `22`
   - **User:** `root`
   - **SSH Key:** Select "Use existing key" or paste the public key above

### Step 3: Configure Server Settings
1. **Enable Docker Management:** ✅
2. **Network Mode:** Host
3. **Storage:** Persistent volumes
4. **Test Connection:** Click "Test Connection"

### Step 4: Create AGROF Project
1. **Go to:** Projects → New Project
2. **Select:** "From Git Repository"
3. **Repository:** Your AGROF repository
4. **Branch:** `main` or `master`
5. **Build Pack:** Auto-detect or select:
   - **API Service:** Python/Docker
   - **Store Backend:** Node.js/Docker

### Step 5: Deploy Applications
1. **API Service Configuration:**
   - **Name:** `agrof-api`
   - **Port:** `5000`
   - **Environment Variables:**
     - `GEMINI_API_KEY=AIzaSyBE2b1nKpQd6LseRIVXfh10O_O3Pm0fvM0`
     - `FLASK_ENV=production`

2. **Store Backend Configuration:**
   - **Name:** `agrof-store`
   - **Port:** `3000`
   - **Environment Variables:**
     - `NODE_ENV=production`

### Step 6: Database Setup
1. **Add PostgreSQL Service:**
   - **Name:** `agrof-postgres`
   - **Port:** `5432`
   - **Environment Variables:**
     - `POSTGRES_DB=agrof_db`
     - `POSTGRES_USER=agrof_user`
     - `POSTGRES_PASSWORD=agrof2024`

## 🔧 Troubleshooting

### If Connection Fails:
1. **Check SSH Key Permissions:**
   ```bash
   sudo chmod 600 /root/.ssh/id_ed25519
   sudo chmod 644 /root/.ssh/id_ed25519.pub
   ```

2. **Verify Docker Access:**
   ```bash
   sudo docker ps
   ```

3. **Test SSH Connection:**
   ```bash
   sudo ssh -i /root/.ssh/id_ed25519 root@localhost
   ```

## 📊 Current Status

✅ **SSH Keys:** Generated and ready
✅ **Coolify:** Running on http://10.0.0.1:8000
✅ **STI Server:** 102.209.111.210 accessible
✅ **WireGuard VPN:** Active
✅ **Docker Services:** Running (API + Store + PostgreSQL)
✅ **AGROF Platform:** Ready for deployment

## 🎯 Next Steps

1. **Complete the Coolify setup** using the steps above
2. **Deploy your AGROF applications**
3. **Configure custom domains** (optional)
4. **Set up SSL certificates** (optional)
5. **Configure monitoring and logging**

## 🌐 Access URLs (After Deployment)

- **Coolify Dashboard:** http://10.0.0.1:8000
- **AGROF API:** http://10.0.0.1:5000
- **AGROF Store:** http://10.0.0.1:3000
- **PostgreSQL:** localhost:5432

---

**Ready to proceed!** Open your browser and start the integration process.
