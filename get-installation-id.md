# 🔍 How to Get Your GitHub App Installation ID

## Quick Method: Check GitHub Settings

### **Step 1: Go to Your Installations**
Open this URL in your browser:
```
https://github.com/settings/installations
```

### **Step 2: Find AGROF-Integration**
You should see your app "AGROF-Integration" in the list. Click on it.

### **Step 3: Check the URL**
After clicking, look at the browser's address bar. The URL will look like:
```
https://github.com/settings/installations/XXXXXXXX
```

The number at the end (`XXXXXXXX`) is your **Installation ID**.

---

## Alternative: Via GitHub Organization (if installed on an org)

### **Step 1: Go to Organization Settings**
```
https://github.com/organizations/YOUR_ORG_NAME/settings/installations
```

### **Step 2: Click on AGROF-Integration**
Find your app and click on it.

### **Step 3: Get the ID from URL**
Same as above - the number in the URL is your Installation ID.

---

## Alternative: Via GitHub API

If you have the private key working, you can use the API:

```bash
# First, generate a JWT token (this is complex, easier to use the web method above)
# But if you want to try:

# Install a JWT tool
npm install -g jsonwebtoken

# Create a script to generate JWT (requires Node.js)
node -e "
const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync('/home/darksagae/Desktop/agrof-up/github-private-key.pem');
const payload = {
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 60),
  iss: '2103126'
};
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
console.log(token);
"
```

Then use that token:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/app/installations
```

---

## Once You Have the Installation ID

### **Update Coolify via Terminal:**
```bash
# Replace XXXXXXXX with your actual Installation ID
sudo docker exec coolify php artisan tinker --execute="\$app = \App\Models\GithubApp::find(2); \$app->installation_id = 'XXXXXXXX'; \$app->save(); echo 'Installation ID updated to: ' . \$app->installation_id . PHP_EOL;"
```

### **Verify the Update:**
```bash
sudo docker exec coolify php artisan tinker --execute="\$app = \App\Models\GithubApp::find(2); echo 'App ID: ' . \$app->app_id . PHP_EOL; echo 'Installation ID: ' . \$app->installation_id . PHP_EOL;"
```

---

## What If You Haven't Installed the App Yet?

If you haven't installed the GitHub App to your account/organization yet:

### **Step 1: Go to Your App**
```
https://github.com/apps/agrof-integration
```

### **Step 2: Click "Install"**
- Choose where to install (your personal account or an organization)
- Select repositories (all or specific ones)
- Click "Install"

### **Step 3: After Installation**
You'll be redirected to a URL that contains the Installation ID, or you can find it in:
```
https://github.com/settings/installations
```

---

## Example URLs to Check

1. **Your GitHub App**: https://github.com/apps/agrof-integration
2. **Your Installations**: https://github.com/settings/installations
3. **App Settings**: https://github.com/settings/apps/agrof-integration

---

**Next Step**: Once you have the Installation ID, update it in Coolify and then sync your repositories!

