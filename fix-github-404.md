# 🔧 Fix GitHub App 404 Error - Update Repositories

The 404 error when clicking "Update Repositories" usually means the GitHub App doesn't have the correct permissions or hasn't been properly installed.

## 🔍 Diagnosis

Your GitHub App configuration in Coolify looks correct:
- ✅ App ID: 2103126
- ✅ Installation ID: 89712232
- ✅ Client ID: Set
- ✅ Client Secret: Set
- ✅ Webhook Secret: Set
- ✅ Private Key: Linked

## 🛠️ Solutions to Try

### **Solution 1: Verify GitHub App Permissions**

1. Go to your GitHub App settings:
   ```
   https://github.com/settings/apps/agrof-integration
   ```

2. Click on **"Permissions & events"** tab

3. Ensure these **Repository permissions** are set to **"Read-only"** or **"Read & write"**:
   - ✅ **Contents**: Read-only (minimum) or Read & write
   - ✅ **Metadata**: Read-only (automatically included)
   - ✅ **Pull requests**: Read & write (if you want PR deployments)
   - ✅ **Webhooks**: Read & write (for auto-deploy)

4. If you made changes, click **"Save changes"** at the bottom

5. **Important**: After changing permissions, you may need to **reinstall the app**:
   - Go to: https://github.com/settings/installations/89712232
   - Click **"Configure"**
   - Scroll down and click **"Save"** (even if nothing changed)

### **Solution 2: Verify App Installation**

1. Go to your installations:
   ```
   https://github.com/settings/installations/89712232
   ```

2. Make sure:
   - ✅ The app is installed (not suspended)
   - ✅ Repository access is set to:
     - Either **"All repositories"**
     - Or **"Only select repositories"** with your `agrof-up` repo selected

3. If needed, click **"Configure"** and update repository access

### **Solution 3: Check GitHub App Installation in Coolify**

The issue might be that Coolify is trying to access the wrong endpoint. Let's verify:

```bash
# Check if we can test the GitHub connection
sudo docker exec coolify php artisan tinker --execute="
\$app = \App\Models\GithubApp::find(2);
try {
    \$client = new \GuzzleHttp\Client();
    \$response = \$client->get('https://api.github.com/app/installations/' . \$app->installation_id, [
        'headers' => [
            'Authorization' => 'Bearer ' . \$app->app_id,
            'Accept' => 'application/vnd.github.v3+json'
        ]
    ]);
    echo 'GitHub API Response: ' . \$response->getStatusCode() . PHP_EOL;
} catch (\Exception \$e) {
    echo 'Error: ' . \$e->getMessage() . PHP_EOL;
}
"
```

### **Solution 4: Use Personal Access Token Instead (Alternative)**

If the GitHub App continues to have issues, you can use a Personal Access Token:

1. Go to: https://github.com/settings/tokens/new

2. Create a token with these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (if using organization)
   - ✅ `admin:repo_hook` (for webhooks)

3. In Coolify dashboard:
   - Go to **Settings** → **Sources**
   - Click **"+ Add"**
   - Choose **"GitHub"** (not GitHub App)
   - Paste your Personal Access Token
   - Save

### **Solution 5: Recreate GitHub Source**

Let's try creating a new GitHub source with correct settings:

```bash
# Delete the problematic GitHub App entry (ID 5 which has no credentials)
sudo docker exec coolify php artisan tinker --execute="\$app = \App\Models\GithubApp::find(5); if (\$app) { \$app->delete(); echo 'Deleted empty GitHub App (ID 5)' . PHP_EOL; }"
```

### **Solution 6: Check Coolify Version**

```bash
# Check Coolify version
sudo docker exec coolify php artisan --version

# If outdated, update Coolify
cd /data/coolify/source && sudo docker compose pull && sudo docker compose up -d
```

## 🧪 Test the Connection

After trying the above solutions, test the GitHub connection:

```bash
# Generate a JWT token and test GitHub API
sudo docker exec coolify php artisan tinker --execute="
\$app = \App\Models\GithubApp::find(2);
\$privateKey = \$app->privateKey->private_key ?? null;
if (\$privateKey) {
    echo 'Private key found, attempting GitHub API test...' . PHP_EOL;
    echo 'Installation ID: ' . \$app->installation_id . PHP_EOL;
} else {
    echo 'Private key not found!' . PHP_EOL;
}
"
```

## 📝 Expected Behavior

After fixing the permissions, when you click "Update Repositories" in Coolify:
1. Coolify generates a JWT token using the private key
2. Calls GitHub API: `GET /app/installations/{installation_id}/repositories`
3. Returns list of accessible repositories
4. Displays them in Coolify UI

## 🔄 Alternative: Manual Repository Addition

If "Update Repositories" still doesn't work, you can manually add your repository by:

1. In Coolify, go to your project → environment
2. Click **"+ New Resource"** → **"Application"**
3. Instead of selecting from list, you can manually enter:
   - **Git Repository URL**: `https://github.com/YOUR_USERNAME/agrof-up.git`
   - **Branch**: `main`
   - Then configure Dockerfile and deploy

## 🆘 If Nothing Works

Contact me with:
1. Screenshot of the 404 error
2. GitHub App permissions screenshot
3. Output of:
   ```bash
   sudo docker logs coolify --tail 100 | grep -A 5 -B 5 "404"
   ```

---

**Most Common Fix**: Go to GitHub App settings → Permissions & events → Ensure "Contents" is set to at least "Read-only" → Save → Reinstall the app

