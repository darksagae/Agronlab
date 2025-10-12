# Domain and SSL Certificate Setup Guide

## 🌐 Phase 1: Domain Configuration

### Option A: Use Existing Domain
If you have a domain (e.g., `agrof.com`):
1. **Configure DNS Records**:
   ```
   Type: A
   Name: @
   Value: 102.209.111.210
   
   Type: A
   Name: api
   Value: 102.209.111.210
   
   Type: A
   Name: store
   Value: 102.209.111.210
   ```

### Option B: Get Free Domain
1. **Freenom**: Get free `.tk`, `.ml`, `.ga` domains
2. **Cloudflare**: Free DNS and domain management
3. **No-IP**: Free dynamic DNS service

### Option C: Use Subdomain Services
1. **ngrok**: `https://your-app.ngrok.io`
2. **localtunnel**: `https://your-app.loca.lt`
3. **Cloudflare Tunnel**: Free secure tunneling

## 🔒 Phase 2: SSL Certificate Setup

### Method 1: Coolify Built-in SSL (Recommended)
1. **In Coolify Dashboard**:
   - Go to: Projects → [Your Project] → Settings
   - **Enable**: "HTTPS"
   - **Select**: "Let's Encrypt" or "Custom Certificate"
   - **Domain**: Enter your domain name
   - **Auto-renew**: Enable automatic renewal

### Method 2: Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt update
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com -d store.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Method 3: Cloudflare SSL (Free)
1. **Add domain to Cloudflare**
2. **Enable SSL/TLS**: "Full (strict)"
3. **Configure Origin Certificates**
4. **Set up Cloudflare Tunnel**

## 🚪 Phase 3: Reverse Proxy Configuration

### Configure Traefik (Already Running)
Your Coolify already has Traefik running. Configure it:

```yaml
# traefik.yml
api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /data/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    exposedByDefault: false
```

### Configure Service Labels
Add labels to your Docker services:

```yaml
# API Service Labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.agrof-api.rule=Host(`api.yourdomain.com`)"
  - "traefik.http.routers.agrof-api.tls=true"
  - "traefik.http.routers.agrof-api.tls.certresolver=letsencrypt"
  - "traefik.http.services.agrof-api.loadbalancer.server.port=5000"

# Store Service Labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.agrof-store.rule=Host(`store.yourdomain.com`)"
  - "traefik.http.routers.agrof-store.tls=true"
  - "traefik.http.routers.agrof-store.tls.certresolver=letsencrypt"
  - "traefik.http.services.agrof-store.loadbalancer.server.port=3000"
```

## 🌍 Phase 4: Public Access Setup

### Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow WireGuard (if needed)
sudo ufw allow 51820/udp
```

### Configure STI Server Access
1. **Via STI Console**: [https://console.sti.go.ug](https://console.sti.go.ug)
2. **Configure Security Groups**:
   - Allow inbound HTTP (80)
   - Allow inbound HTTPS (443)
   - Allow inbound SSH (22)

## 📱 Phase 5: Mobile App Configuration

### Update API Endpoints
Update your mobile app configuration:

```javascript
// config/apiConfig.js
const API_CONFIG = {
  development: {
    API_BASE_URL: 'http://10.0.0.1:5000',
    STORE_BASE_URL: 'http://10.0.0.1:3000'
  },
  production: {
    API_BASE_URL: 'https://api.yourdomain.com',
    STORE_BASE_URL: 'https://store.yourdomain.com'
  }
};

export default API_CONFIG;
```

### Environment-based Configuration
```javascript
// App.js
import API_CONFIG from './config/apiConfig';

const environment = __DEV__ ? 'development' : 'production';
const config = API_CONFIG[environment];

// Use config.API_BASE_URL and config.STORE_BASE_URL
```

## 🔍 Phase 6: Verification and Testing

### Test SSL Certificate
```bash
# Check certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test from browser
curl -I https://yourdomain.com
```

### Test API Endpoints
```bash
# Test API
curl https://api.yourdomain.com/health

# Test Store
curl https://store.yourdomain.com/api/products
```

### Mobile App Testing
1. **Update app configuration** with new endpoints
2. **Test API connectivity** from mobile app
3. **Verify SSL certificates** are trusted
4. **Test in production mode**

## 🎯 Final URLs

After setup, your services will be accessible at:
- **API Service**: `https://api.yourdomain.com`
- **Store Service**: `https://store.yourdomain.com`
- **Coolify Dashboard**: `https://coolify.yourdomain.com` (optional)

## 🚨 Troubleshooting

### Common Issues:
1. **DNS Propagation**: Wait 24-48 hours for DNS changes
2. **Certificate Generation**: Check domain accessibility
3. **Firewall Rules**: Verify ports are open
4. **Service Labels**: Check Traefik configuration

### Debug Steps:
1. **Check Traefik logs**: `docker logs coolify-proxy`
2. **Verify DNS**: `nslookup yourdomain.com`
3. **Test connectivity**: `telnet yourdomain.com 443`
4. **Check certificates**: Browser developer tools

---

**Ready to set up domains and SSL!** Choose your preferred method and follow the steps.
