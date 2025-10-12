# GitHub Personal Access Token Setup for Coolify

## 🔑 Create GitHub Personal Access Token

### Step 1: Access GitHub Token Settings
1. **Go to**: [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. **Click**: "Generate new token (classic)"

### Step 2: Configure Token
- **Note**: `Coolify-AGROF-Integration`
- **Expiration**: `No expiration` (recommended) or `1 year`
- **Scopes**: Select these permissions:
  - ✅ `repo` (Full control of private repositories)
  - ✅ `admin:repo_hook` (Full control of repository hooks)
  - ✅ `read:user` (Read user profile data)
  - ✅ `user:email` (Access user email addresses)
  - ✅ `read:org` (Read org and team membership)

### Step 3: Generate and Copy Token
1. **Click**: "Generate token"
2. **Copy the token** immediately (you won't see it again!)
3. **Save it securely** for Coolify configuration

## 🔗 Configure Coolify with GitHub Token

### Step 1: Access Coolify Settings
1. **Open**: `http://10.0.0.1:8000`
2. **Login**: `admin@coolify.local` / `coolify123`
3. **Go to**: Settings → Git Providers

### Step 2: Add GitHub Provider
1. **Click**: "Add Git Provider"
2. **Select**: GitHub
3. **Configure**:
   - **Name**: `GitHub-AGROF`
   - **Personal Access Token**: Paste your token here
4. **Save** the configuration

### Step 3: Test Connection
1. **Click**: "Test Connection"
2. **Verify**: GitHub repositories are accessible
3. **Confirm**: Integration is working

## 📋 Repository Information

**Repository URL**: `https://github.com/YOUR_USERNAME/agrof-platform`
**Current Branch**: `main`
**Dockerfile Locations**:
- API: `agrof-main/src/api/Dockerfile`
- Store: `store-backend/Dockerfile`

## ⚠️ Security Notes

- **Keep token secure**: Don't share or commit to git
- **Use minimal permissions**: Only select required scopes
- **Set expiration**: Consider setting token expiration
- **Rotate regularly**: Update tokens periodically

## 🎯 Next Steps

After setting up the token:
1. **Configure Coolify projects** from GitHub repositories
2. **Set up auto-deploy** on push to main branch
3. **Configure environment variables**
4. **Test deployment pipeline**

---

**Ready to create your GitHub token!** Follow the steps above to enable Coolify integration.
