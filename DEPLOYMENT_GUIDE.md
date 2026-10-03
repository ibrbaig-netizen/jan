# 🚀 JAN CHEMIST - Complete Custom Domain & Backend Server Deployment Guide

This guide provides step-by-step instructions to deploy the **Jan Chemist Superstore & Pharmacy** website and mobile PWA on your own custom domain (e.g., `janchemist.com` or `www.janchemist.com`) with a production-grade full-stack Node.js + Express + React Vite backend.

---

## 🏗️ Architecture Overview

- **Frontend**: React 19 + TypeScript + Tailwind CSS (Vite SPA)
- **Backend API**: Node.js + Express (serving customer orders, prescription uploads, Google Product Search AI, image proxy, and store configuration)
- **Database / Persistence**: Server-side JSON storage in `/data` (prescriptions, orders, store configs) + client-side storage cache
- **Process Manager**: PM2 (keeps Node.js running 24/7 with automatic restart upon crashes or server reboots)
- **Web Server / Reverse Proxy**: Nginx (listens on ports 80 & 443, handles SSL certificates, proxies traffic to Node.js on port 3000)
- **SSL / Security**: Let's Encrypt Free Automated TLS/SSL Certificates (A+ rating)
- **Mobile Experience**: Progressive Web App (PWA) + Android WebAPK (Digital AssetLinks supported)

---

## 📋 Prerequisites Checklist

Before you begin, make sure you have:
1. **A Custom Domain**: Purchased from GoDaddy, Namecheap, Google Domains/Squarespace, Cloudflare, etc.
2. **A Linux Server / VPS**: Running **Ubuntu 22.04 LTS or 24.04 LTS** (e.g. DigitalOcean Droplet, Hetzner, AWS EC2, Linode, or Contabo with at least 1 GB RAM).
3. **Server Root / Sudo Access**: SSH credentials to your server (`ssh root@YOUR_SERVER_IP`).
4. **Gemini API Key**: (Optional but recommended) For the Google Search AI Product Enricher.

---

## 🌐 STEP 1: Point Your Domain DNS to Your Server IP

Log in to your domain registrar's DNS Management panel (e.g., Namecheap, Cloudflare, GoDaddy) and add these two DNS records:

| Type | Name / Host | Target / Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (or leave blank) | `YOUR_SERVER_IP` (e.g., `142.93.120.45`) | Auto / 300s | Points `janchemist.com` to your VPS |
| **CNAME** | `www` | `janchemist.com` (or `@`) | Auto / 300s | Points `www.janchemist.com` to your domain |

> ⏳ *DNS propagation typically takes between 2 to 30 minutes. You can verify it by opening your terminal and running:*
> ```bash
> ping yourdomain.com
> ```

---

## 🖥️ STEP 2: Prepare Your Ubuntu Server

Connect to your server via SSH:
```bash
ssh root@YOUR_SERVER_IP
```

### 1. Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20 LTS & Build Tools
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx build-essential
```

Verify installations:
```bash
node -v   # Should be v20.x.x
npm -v    # Should be v10.x.x
nginx -v  # Should show nginx version
```

### 3. Install PM2 (Process Manager) Globally
```bash
sudo npm install -g pm2
```

---

## 📦 STEP 3: Clone Codebase & Build Application

### 1. Create Web Directory and Clone App
```bash
sudo mkdir -p /var/www/janchemist
sudo chown -R $USER:$USER /var/www/janchemist
cd /var/www/janchemist

# Clone your project repository (or transfer files via SCP/Git)
git clone <YOUR_GIT_REPO_URL> .
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Create the Production Environment File (`.env`)
```bash
nano .env
```
Paste the following values (replace with your domain and keys):
```ini
# Production Environment
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com

# Optional Gemini API key for Google Search Auto-enrichment
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
Press `Ctrl + O`, `Enter` to save, and `Ctrl + X` to exit.

### 4. Build the Production Frontend
```bash
npm run build
```
This compiles the high-performance Vite React frontend into the `dist/` directory.

---

## ⚡ STEP 4: Start Backend Server with PM2

Start the Node.js/Express server using PM2 so it stays alive forever:

```bash
# Start server
pm2 start server.ts --name "janchemist" --interpreter ./node_modules/.bin/tsx

# Enable PM2 auto-start on system boot
pm2 startup
# (Run the command displayed in terminal if prompted)
pm2 save
```

Verify server status:
```bash
pm2 status
pm2 logs janchemist --lines 20
```
Your backend is now running locally on `http://127.0.0.1:3000`.

---

## 🛡️ STEP 5: Configure Nginx as Reverse Proxy

Nginx will receive incoming traffic on standard ports 80 (HTTP) and 443 (HTTPS) and proxy it to your Node.js app on port 3000. It also allows large prescription photo uploads.

### 1. Create Nginx Configuration File
```bash
sudo nano /etc/nginx/sites-available/janchemist
```

Paste the following configuration (replace `yourdomain.com` with your real domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # High body size limit for customer prescription photo uploads
    client_max_body_size 50M;

    # Gzip compression for high performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|webp)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 2. Enable Site and Test Configuration
```bash
# Remove default Nginx welcome page
sudo rm -f /etc/nginx/sites-enabled/default

# Enable your Jan Chemist site
sudo ln -s /etc/nginx/sites-available/janchemist /etc/nginx/sites-enabled/

# Test Nginx syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

Now visiting `http://yourdomain.com` in your browser will load your website!

---

## 🔒 STEP 6: Install Free SSL Certificate (HTTPS)

Secure your website with a free Let's Encrypt SSL certificate via Certbot:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- When prompted, enter your email address for renewal notices.
- Agree to terms of service.
- Choose option `2` to automatically redirect all HTTP traffic to secure HTTPS.

### Test Automatic SSL Renewal
Let's Encrypt certificates renew automatically every 60 days. Test renewal with:
```bash
sudo certbot renew --dry-run
```

---

## 📱 STEP 7: Customer vs. Admin Separation in Production

- **Customer Website**: `https://yourdomain.com/`
  - 100% pure shopping experience: All 9+ departments, WhatsApp instant orders, prescription upload, cart, and delivery tracking.
  - No internal backend buttons are displayed to shoppers.
- **Admin & Inventory Portal**: `https://yourdomain.com/admin`
  - Direct URL access protected with owner 4-digit PIN (default: `1234`).
  - Full product inventory management, Excel upload/export, Google Search product auto-enricher, prescription verification, order status updates, and store settings.

---

## ☁️ ALTERNATIVE: 1-Click Serverless Cloud Run Deployment

If you prefer not to manage a Linux server, you can deploy Jan Chemist to Google Cloud Run:

1. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy janchemist \
     --source . \
     --port 3000 \
     --allow-unauthenticated \
     --region asia-southeast1
   ```
2. **Map Custom Domain**:
   - Go to **Google Cloud Console > Cloud Run > Manage Custom Domains**.
   - Click **Add Mapping**, enter `yourdomain.com`.
   - Google will provide DNS records (CNAME/A) to add in your domain registrar. Google provisions SSL automatically!

---

## 🛠️ Maintenance & Useful Commands

| Task | Command |
| :--- | :--- |
| **Check server status** | `pm2 status` |
| **View live logs** | `pm2 logs janchemist` |
| **Restart server** | `pm2 restart janchemist` |
| **Deploy code updates** | `git pull && npm run build && pm2 restart janchemist` |
| **Check Nginx status** | `sudo systemctl status nginx` |
| **Restart Nginx** | `sudo systemctl restart nginx` |
| **Backup data files** | `tar -czvf backup_$(date +%F).tar.gz /var/www/janchemist/data` |

---
**With us it's original** — JAN CHEMIST Superstore & Certified Pharmacy
