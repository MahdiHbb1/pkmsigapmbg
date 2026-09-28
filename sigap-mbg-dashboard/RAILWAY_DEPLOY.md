# Railway Deployment Guide - SIGAP MBG Dashboard

## 📦 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Project harus sudah di push ke GitHub
3. **Railway CLI** (optional): `npm install -g @railway/cli`

---

## 🚀 Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

#### Step 1: Create New Project
1. Login ke Railway dashboard
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub
5. Select repository: `pkmsigapmbg-main`
6. Railway akan auto-detect dan deploy

#### Step 2: Add MySQL Database
1. Di project dashboard, click **New**
2. Select **Database** → **Add MySQL**
3. Railway akan provision MySQL instance
4. Database credentials akan auto-generated

#### Step 3: Configure Environment Variables
1. Click pada **backend service**
2. Go to **Variables** tab
3. Add variables berikut:

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}
PORT=3000
NODE_ENV=production
```

**Railway Variable References:**
- `${{MySQL.MYSQLHOST}}` = auto-filled dari MySQL service
- Copy exact variable names dari MySQL service di Railway

#### Step 4: Initialize Database Schema
1. Open **MySQL service** di Railway
2. Click **Query** tab
3. Copy & paste `backend/migrations/init.sql`
4. Run query untuk create tables

Atau via Railway CLI:
```bash
railway connect MySQL
# Paste SQL dari init.sql
```

#### Step 5: Deploy!
1. Railway akan auto-deploy setelah env vars di-set
2. Atau trigger manual deploy: click **Deploy** button
3. Wait 2-3 minutes untuk build & start
4. Check deployment logs untuk memastikan success

---

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project (di root folder sigap-mbg-dashboard)
cd sigap-mbg-dashboard
railway link

# Add MySQL
railway add --database mysql

# Set environment variables
railway variables set DB_HOST=${{MySQL.MYSQLHOST}}
railway variables set DB_USER=${{MySQL.MYSQLUSER}}
railway variables set DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
railway variables set DB_NAME=${{MySQL.MYSQLDATABASE}}
railway variables set DB_PORT=${{MySQL.MYSQLPORT}}
railway variables set NODE_ENV=production

# Deploy
railway up
```

---

## 🔗 Access Your App

After deployment:
1. Railway generates public URL: `https://your-app.up.railway.app`
2. Find it di **Settings** → **Domains**
3. Click **Generate Domain**

**Default routes:**
- Homepage: `https://your-app.up.railway.app/`
- Overview: `https://your-app.up.railway.app/overview`
- Alerts: `https://your-app.up.railway.app/alerts`
- API: `https://your-app.up.railway.app/api/devices`

---

## 🧪 Test Deployment

### 1. Check API Health
```bash
curl https://your-app.up.railway.app/api/devices
# Expected: [] (empty array jika belum ada data)
```

### 2. POST Test Data (via curl)
```bash
curl -X POST https://your-app.up.railway.app/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "SIGAP-MBG-01",
    "timestamp": "2026-09-27T22:30:00Z",
    "mq135_mean": 95.2,
    "mq135_std": 5.3,
    "mq135_slope": 0.05,
    "mq136_mean": 18.5,
    "mq136_std": 1.8,
    "mq136_slope": 0.02,
    "temp_mean": 25.3,
    "humidity_mean": 62.5,
    "prediction": "Layak",
    "confidence": 0.95
  }'
```

**Expected response:**
```json
{
  "success": true,
  "id": 1,
  "device_id": "SIGAP-MBG-01",
  "prediction": "Layak"
}
```

### 3. Check Dashboard
Open `https://your-app.up.railway.app/overview` di browser:
- ✅ Stats cards show: Total 1, Layak 1
- ✅ Device card tampil dengan badge hijau
- ✅ No console errors

---

## 📝 Update Firmware ESP32

After deployment, update ESP32 firmware dengan production URL:

```cpp
// Di firmware/esp32/main.cpp
const char* serverUrl = "https://your-app.up.railway.app/api/readings";
```

Replace `your-app` dengan actual Railway domain.

---

## 🐛 Troubleshooting

### Issue 1: Build Failed
**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Railway dashboard → Settings → Custom Build Command
cd backend && npm install
```

### Issue 2: Database Connection Error
**Error:** `ECONNREFUSED` atau `ER_ACCESS_DENIED`

**Solution:**
1. Check MySQL service is running (green status)
2. Verify environment variables format:
   - Use `${{MySQL.VARIABLE}}` syntax (double curly braces)
   - Pastikan nama service MySQL match (case-sensitive)
3. Restart deployment

### Issue 3: Port Already in Use
**Error:** `EADDRINUSE :::3000`

**Solution:**
- Railway auto-assigns PORT via env var
- App.js sudah handle: `process.env.PORT || 3000`
- No action needed, Railway manages ports

### Issue 4: Static Files Not Loading
**Symptom:** CSS/JS tidak load, 404 errors

**Solution:**
Check `app.js` static path:
```javascript
app.use(express.static(path.join(__dirname, '../../frontend/public')));
```
Path relatif harus benar dari `backend/src/app.js` ke `frontend/public`.

### Issue 5: Database Tables Not Found
**Error:** `Table 'sigap_mbg.devices' doesn't exist`

**Solution:**
Run `init.sql` manually:
```bash
railway connect MySQL
# Paste SQL dari migrations/init.sql
```

---

## 💰 Railway Free Tier Limits

✅ **Included:**
- 500 execution hours/month (enough untuk 1 app 24/7)
- 1GB RAM
- 1GB disk
- MySQL database included

⚠️ **Limits:**
- Setelah 500 hours, app sleep hingga next month
- Untuk production 24/7, upgrade ke Hobby plan ($5/month)

**Estimation:**
- 1 backend service = ~720 hours/month (24/7)
- Free tier = 500 hours = ~20 days uptime
- Untuk kompetisi/demo: more than enough

---

## 🔒 Security Checklist

Before production:
- [x] `.env` file di-gitignore (don't commit secrets)
- [x] Database credentials via Railway env vars
- [x] CORS enabled di `app.js`
- [ ] Optional: Add rate limiting untuk API endpoints
- [ ] Optional: Add authentication untuk dashboard access

---

## 📊 Monitoring

**Railway Dashboard provides:**
- Real-time logs (click service → **Logs** tab)
- Metrics: CPU, Memory, Network
- Deployment history
- Database queries (MySQL tab)

**Monitor app health:**
```bash
# Check logs
railway logs

# Check recent deployments
railway status
```

---

## 🔄 Update & Redeploy

Railway auto-deploys on every `git push` to main branch.

**Manual trigger:**
1. Push changes ke GitHub
2. Railway detects commit → auto build & deploy
3. Or manual: Railway dashboard → **Deploy** button

**Rollback:**
1. Dashboard → **Deployments**
2. Click previous deployment → **Redeploy**

---

## 📞 Support

**Railway:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**SIGAP MBG:**
- Docs: `docs/VALIDASI_BACKEND_FRONTEND.md`
- Issues: Check logs di Railway dashboard

---

**Deployment Status:** Ready to deploy ✅  
**Last Updated:** 2026-09-27  
**Railway Config:** `railway.json` ✅  
**Database Schema:** `backend/migrations/init.sql` ✅
