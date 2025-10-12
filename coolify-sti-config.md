# STI to Coolify Integration Guide

## Method 1: Self-Hosted Coolify on STI Server

Your Coolify is already running on your STI server (102.209.111.210). To connect them:

### 1. Access Coolify Dashboard
- URL: http://10.0.0.1:8000 (via WireGuard)
- Login: admin@coolify.local / coolify123

### 2. Add Your STI Server as a Resource
1. Go to "Resources" → "Servers"
2. Click "Add New Server"
3. Fill in:
   - **Name**: STI-Server-Production
   - **Host**: localhost (or 127.0.0.1)
   - **Port**: 22
   - **User**: root (or your SSH user)
   - **SSH Key**: Use your existing SSH keys

### 3. Configure Server Settings
- **Docker**: Enable Docker management
- **Network**: Use host network for better integration
- **Storage**: Configure persistent volumes

## Method 2: External Coolify Instance

If you want to run Coolify on a different server:

### 1. Install Coolify on External Server
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

### 2. Add STI Server as Remote Resource
1. In Coolify dashboard → Resources → Servers
2. Add your STI server (102.209.111.210)
3. Use SSH key authentication
4. Configure Docker daemon access

## Method 3: GitHub Integration

### 1. Connect GitHub Repository
1. Go to Coolify → Settings → Git Providers
2. Add GitHub integration
3. Authorize Coolify to access your repositories

### 2. Auto-Deploy from GitHub
1. Create new project from GitHub repo
2. Select your STI server as deployment target
3. Configure build and deployment settings

## Current Setup Status

✅ Coolify running on STI server
✅ Docker services working
✅ WireGuard VPN configured
✅ AGROF platform ready for deployment

## Next Steps

1. Access Coolify dashboard
2. Configure server resources
3. Deploy AGROF applications
4. Set up monitoring and logging
