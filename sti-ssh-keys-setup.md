# STI IAM SSH Keys Setup Guide

## 🔗 Access STI IAM SSH Keys Management

**URL**: [https://iam.sti.go.ug/settings/ssh-keys](https://iam.sti.go.ug/settings/ssh-keys)

**Status**: ✅ Accessible (HTTP 200)

## 📋 Your Generated SSH Key

**Public Key for STI IAM:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINORqX+3fh0eqy6lgDpxBwJacG03wanMa1eYC+INwn8d coolify-sti-integration
```

**Key Details:**
- **Type**: ED25519
- **Fingerprint**: SHA256:0NzldvDjPpC1/fgTcz5xxZk0uJOl6ZJRMBkl9C+PoOA
- **Comment**: coolify-sti-integration

## 🚀 Step-by-Step Setup Process

### Step 1: Access STI IAM GUI
1. **Open your browser**
2. **Navigate to**: [https://iam.sti.go.ug/settings/ssh-keys](https://iam.sti.go.ug/settings/ssh-keys)
3. **Login** with your STI credentials if prompted

### Step 2: Add SSH Key to STI IAM
1. **Click**: "Add SSH Key" or "New Key"
2. **Fill in the details:**
   - **Name**: `Coolify-STI-Integration`
   - **Key Type**: `ssh-ed25519`
   - **Public Key**: Paste the key above
   - **Description**: `SSH key for Coolify to STI server integration`

### Step 3: Verify Key Addition
1. **Confirm** the key appears in your SSH keys list
2. **Note** the key ID or fingerprint for reference

### Step 4: Test STI Server Access
1. **Go to**: [https://console.sti.go.ug](https://console.sti.go.ug)
2. **Access your server**: `102.209.111.210`
3. **Verify** SSH key authentication works

## 🔧 Alternative Setup Methods

### Method 1: Direct SSH Key Upload
```bash
# If you have access to the server directly
ssh-copy-id -i /root/.ssh/id_ed25519.pub root@102.209.111.210
```

### Method 2: Manual Key Addition
1. **Copy the public key** from above
2. **Add to STI IAM** via the web interface
3. **Test connection** from your local machine

## 📊 Integration Status

✅ **SSH Key Generated**: Ready
✅ **STI IAM Access**: Working
✅ **Coolify Dashboard**: Accessible
✅ **Local SSH Test**: Successful

## 🎯 Next Steps After SSH Key Setup

1. **Complete STI IAM SSH key registration**
2. **Test server access** via STI console
3. **Configure Coolify** to use STI server
4. **Deploy AGROF platform** through Coolify

## 🔍 Troubleshooting

### If STI IAM Access Fails:
1. **Check browser cookies** and clear cache
2. **Try incognito/private mode**
3. **Verify STI credentials**
4. **Contact STI support** if persistent issues

### If SSH Key Doesn't Work:
1. **Verify key format** (no line breaks)
2. **Check key permissions** on server
3. **Test with different SSH client**
4. **Regenerate key** if necessary

---

**Ready to proceed!** Access the STI IAM SSH keys page and add your generated key.
