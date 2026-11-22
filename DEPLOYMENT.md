# TuStudyHub — Production VPS Deployment & Integration Guide

This guide details the complete procedure for deploying TuStudyHub to your Virtual Private Server (VPS) within the 3-day launch window.

---

## 1. System Architecture Overview

```
                        ┌───────────────────────────────────────────────┐
                        │               Clients                         │
                        │  • Web Application (Desktop & Mobile)         │
                        │  • Installed Android PWA (Standalone)         │
                        │  • Desktop Electron / Webview Wrapper        │
                        └───────────────────────┬───────────────────────┘
                                                │ HTTPS (Port 443)
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │             Nginx Reverse Proxy               │
                        │      SSL Termination via Let's Encrypt        │
                        │         Static Public Asset Caching           │
                        └───────────────────────┬───────────────────────┘
                                                │ Proxy (127.0.0.1:3000)
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │        TuStudyHub Full-Stack Server           │
                        │       (Node.js 22 + Express 4.21 API)         │
                        └──────────────┬─────────────────┬──────────────┘
                                       │                 │
                Local Volume Disk      │                 │ SQL Queries
                Storage                ▼                 ▼
          ┌───────────────────────────────┐   ┌──────────────────────────┐
          │  /var/data/tustudyhub/uploads │   │  PostgreSQL 16 Database   │
          │   (PDF, PNG, JPEG, SHA-256)   │   │  (Relational Core Store) │
          └───────────────────────────────┘   └──────────────────────────┘
```

---

## 2. Server Prerequisites (Ubuntu 22.04 / 24.04 LTS)

### Step 2.1: Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx postgresql postgresql-contrib certbot python3-certbot-nginx
```

### Step 2.2: Install Node.js 22 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # Should output v22.x.x
npm -v    # Should output 10.x.x
```

### Step 2.3: Configure Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 3. PostgreSQL Database Setup

### Step 3.1: Create Database & Dedicated User
```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:
```sql
CREATE DATABASE tustudyhub;
CREATE USER tustudyhub_user WITH ENCRYPTED PASSWORD 'YourStrongDatabasePasswordHere!';
GRANT ALL PRIVILEGES ON DATABASE tustudyhub TO tustudyhub_user;
\c tustudyhub
GRANT ALL ON SCHEMA public TO tustudyhub_user;
\q
```

### Step 3.2: Run Schema Migration
From your repository root:
```bash
psql -h localhost -U tustudyhub_user -d tustudyhub -f src/server/db/schema.sql
```

---

## 4. Persistent Document Storage Directory

Create the upload directory and grant ownership to the service user:
```bash
sudo mkdir -p /var/data/tustudyhub/uploads
sudo chown -R $USER:$USER /var/data/tustudyhub/uploads
sudo chmod 750 /var/data/tustudyhub/uploads
```

---

## 5. Application Setup in VS Code / Server

### Step 5.1: Clone and Install Dependencies
```bash
cd /var/www
git clone <your-private-repo-url> tustudyhub
cd tustudyhub
npm install
```

### Step 5.2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
nano .env
```

Configure your parameters:
```env
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.edu
# 48-byte cryptographically secure Base64 secret:
JWT_SECRET=+ThWxEDe7ZJvn+2yNYUP/xw599SQxZdf6Gr27Bu/B1/vHEr9bqDHU/BMblAx3Bcy
DATABASE_URL=postgresql://tustudyhub_user:YourStrongDatabasePasswordHere!@localhost:5432/tustudyhub
STORAGE_DIR=/var/data/tustudyhub/uploads
GEMINI_API_KEY=your_gemini_api_key_from_aistudio
```

> **Generating a new 48-byte (384-bit) JWT Secret:**
> - **Windows (PowerShell):**
>   ```powershell
>   $bytes = New-Object byte[] 48
>   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
>   $rng.GetBytes($bytes)
>   $secret = [Convert]::ToBase64String($bytes)
>   $rng.Dispose()
>   $secret
>   ```
> - **Linux / macOS (Bash):**
>   ```bash
>   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
>   ```

### Step 5.3: Build Application Assets
```bash
npm run build
```

---

## 6. Process Management with PM2

Install PM2 globally to ensure TuStudyHub automatically restarts upon failure or server reboots:
```bash
sudo npm install -g pm2
pm2 start npm --name "tustudyhub" -- run start
pm2 startup
pm2 save
```

To view logs or restart:
```bash
pm2 logs tustudyhub
pm2 restart tustudyhub
```

---

## 7. Nginx Configuration & SSL (HTTPS)

Create `/etc/nginx/sites-available/tustudyhub`:
```nginx
server {
    server_name your-domain.edu www.your-domain.edu;

    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and obtain a free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/tustudyhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.edu -d www.your-domain.edu
```

*Note: Once deployed on your stable HTTPS domain (`https://your-domain.edu`), Android Chrome installs the PWA cleanly without the Google Cloud Run preview cookie errors!*

---

## 8. Automated Daily Backups

Set up automated database and file backups via cron:

```bash
crontab -e
```

Add the following daily backup job (runs at 02:00 AM):
```cron
0 2 * * * pg_dump -U tustudyhub_user -h localhost tustudyhub | gzip > /var/backups/tustudyhub_db_$(date +\%F).sql.gz
0 3 * * * rsync -av --delete /var/data/tustudyhub/uploads/ /var/backups/tustudyhub_uploads/
```
