# 🔧 Fix GitHub App 404 Error - Required Permissions

## 🎯 The Problem

When you click "Update Repositories" in Coolify, you get a 404 error. This happens because the GitHub App doesn't have permission to read your repositories.

## ✅ The Solution: Add Repository Permissions

### **Step 1: Go to GitHub App Settings**

Open this URL in your browser:
```
https://github.com/settings/apps/agrof-integration
```

### **Step 2: Go to Permissions & Events Tab**

Click on the **"Permissions & events"** tab (second tab)

### **Step 3: Set Repository Permissions**

Scroll down to the **"Repository permissions"** section and set:

| Permission | Access Level | Why? |
|------------|--------------|------|
| **Contents** | **Read-only** | ✅ REQUIRED - Allows Coolify to list and read your repositories |
| **Metadata** | Read-only | ✅ Auto-included - Basic repo info |
| **Pull requests** | Read & write | Optional - For PR deployments |
| **Webhooks** | Read & write | ✅ Recommended - For auto-deploy on push |
| **Commit statuses** | Read & write | Optional - Show deployment status on commits |

**Most Important**: Set **"Contents"** to at least **"Read-only"**

### **Step 4: Save Changes**

1. Scroll to the bottom of the page
2. Click **"Save changes"** button
3. GitHub will show a notice that installations need to accept new permissions

### **Step 5: Update the Installation**

1. Go to your installations: https://github.com/settings/installations/89712232
2. Click **"Configure"** button
3. You should see a banner asking to accept new permissions - click **"Accept"**
4. Verify repository access:
   - Choose **"All repositories"** OR
   - Choose **"Only select repositories"** and select `agrof-up`
5. Click **"Save"**

### **Step 6: Test in Coolify**

1. Go back to Coolify: http://10.0.0.1:8000
2. Go to **Settings** → **Sources**
3. Click on **"AGROF-Integration"**
4. Click **"Update Repositories"**
5. Should work now! 🎉

---

## 🔄 Alternative: Use Personal Access Token (Simpler!)

If you continue to have issues with GitHub App, use a Personal Access Token instead:

### **Create PAT:**

1. Go to: https://github.com/settings/tokens/new
2. Settings:
   - **Note**: `Coolify Deployment`
   - **Expiration**: 90 days (or longer)
   - **Select scopes**:
     - ✅ `repo` (Full control of repositories)
     - ✅ `admin:repo_hook` (Manage webhooks)
3. Click **"Generate token"**
4. **COPY THE TOKEN IMMEDIATELY** (shown only once!)

### **Add to Coolify:**

1. In Coolify: **Settings** → **Sources** → **"+ Add Source"**
2. Select **"GitHub"** (NOT "GitHub App")
3. Paste your token
4. Name it: `GitHub PAT`
5. Save

This is simpler and works immediately!

---

## 🧪 Verify GitHub App Configuration

After adding permissions, verify it's working:

```bash
# Check GitHub App in Coolify
sudo docker exec coolify php artisan tinker --execute="
\$app = \App\Models\GithubApp::find(2);
echo 'GitHub App Status:' . PHP_EOL;
echo 'Name: ' . \$app->name . PHP_EOL;
echo 'App ID: ' . \$app->app_id . PHP_EOL;
echo 'Installation ID: ' . \$app->installation_id . PHP_EOL;
echo 'Private Key: ' . (\$app->private_key_id ? 'Linked' : 'Missing') . PHP_EOL;
echo 'API URL: ' . \$app->api_url . PHP_EOL;
"
```

---

## 📋 Summary

**Root Cause**: GitHub App created without "Contents" permission
**Fix**: Add "Contents: Read-only" permission in GitHub App settings
**Alternative**: Use Personal Access Token (PAT) instead - simpler!

**Next Step**: Once permissions are added and installation updated, try "Update Repositories" again in Coolify!
