# Setup Testing Manual - SIGAP MBG Dashboard

**Tanggal:** 2026-09-27  
**Status Sistem:** MySQL belum terinstall, Node.js v24.16.0 ready  
**Tujuan:** Testing backend-frontend integration step-by-step

---

## Status Saat Ini

### ✅ Yang Sudah Ada
- Node.js v24.16.0 installed
- Backend code complete (5 API endpoints)
- Frontend code complete (3 pages)
- Footer universitas sudah diperbaiki

### ❌ Yang Belum Ada (Blocker)
- MySQL belum terinstall
- File `.env` belum dibuat
- `node_modules` belum diinstall
- Database belum di-initialize

---

## Opsi Testing

Karena MySQL belum terinstall, ada 2 opsi:

### Opsi A: Install MySQL Penuh (Recommended untuk Development)
**Waktu:** ~15 menit  
**Kelebihan:** Database persistent, bisa development lanjut  
**Kekurangan:** Perlu install software

### Opsi B: Pakai SQLite (Quick Test)
**Waktu:** ~5 menit  
**Kelebihan:** No installation, langsung test  
**Kekurangan:** Perlu modifikasi backend code sedikit

---

## OPSI A: Install MySQL & Full Testing

### Step 1: Install MySQL

#### Windows:
1. Download MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Pilih: **mysql-installer-community-8.0.XX.msi**
3. Install type: **Developer Default**
4. Set root password: **catat password ini!**
5. Finish installation

#### Verify Installation:
```powershell
# Test MySQL installed
Get-Service -Name "*mysql*"

# Harusnya muncul:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  MySQL80            MySQL80
```

### Step 2: Initialize Database

```powershell
# Login ke MySQL
mysql -u root -p
# Enter password: [password yang tadi diset]
```

Di MySQL prompt:
```sql
-- Jalankan init.sql
source C:/nitipmehdi/pkmsigapmbg-main/pkmsigapmbg-main/sigap-mbg-dashboard/backend/migrations/init.sql

-- Verify database created
SHOW DATABASES;
-- Harusnya muncul: sigap_mbg

-- Verify tables created
USE sigap_mbg;
SHOW TABLES;
-- Harusnya muncul: devices, readings, users

-- Insert sample device
INSERT INTO devices (device_id, location_name) 
VALUES ('SIGAP-MBG-01', 'SPPG Universitas Negeri Semarang');

-- Exit
EXIT;
```

### Step 3: Setup Backend Environment

```powershell
cd C:\nitipmehdi\pkmsigapmbg-main\pkmsigapmbg-main\sigap-mbg-dashboard\backend

# Copy .env.example ke .env
Copy-Item .env.example .env

# Edit .env (buka dengan notepad)
notepad .env
```

Edit file `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password_here  # Ganti dengan password MySQL Anda
DB_NAME=sigap_mbg
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

Save dan close.

### Step 4: Install Dependencies

```powershell
# Masih di folder backend
npm install
```

Expected output:
```
added 50 packages, and audited 51 packages in 10s
found 0 vulnerabilities
```

### Step 5: Start Backend Server

```powershell
npm run dev
```

Expected output:
```
[SERVER] SIGAP MBG Dashboard running on http://localhost:3000
[SERVER] Environment: development
[DB] MySQL connected successfully
```

**✅ Jika muncul output di atas: Backend SUCCESS!**  
**❌ Jika error:** Cek logs, kemungkinan password salah di `.env`

### Step 6: Test POST Data (New Terminal)

Buka PowerShell baru:

```powershell
# Test 1: Layak
Invoke-RestMethod -Uri "http://localhost:3000/api/readings" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "device_id": "TEST-01",
    "timestamp": "2026-09-27T17:45:00Z",
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

Expected response:
```
success   : True
id        : 1
device_id : TEST-01
prediction: Layak
```

```powershell
# Test 2: Tidak Layak
Invoke-RestMethod -Uri "http://localhost:3000/api/readings" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "device_id": "TEST-02",
    "timestamp": "2026-09-27T17:46:00Z",
    "mq135_mean": 425.8,
    "mq135_std": 35.2,
    "mq135_slope": 2.15,
    "mq136_mean": 82.3,
    "mq136_std": 8.7,
    "mq136_slope": 1.25,
    "temp_mean": 32.1,
    "humidity_mean": 75.8,
    "prediction": "Tidak Layak",
    "confidence": 0.92
  }'
```

Expected response:
```
success   : True
id        : 2
device_id : TEST-02
prediction: Tidak Layak
```

### Step 7: Verify Database

```powershell
mysql -u root -p
```

```sql
USE sigap_mbg;

-- Check devices
SELECT * FROM devices;
-- Expected: 3 rows (SIGAP-MBG-01, TEST-01, TEST-02)

-- Check readings
SELECT device_id, prediction, confidence, temp_mean, humidity_mean
FROM readings
ORDER BY id DESC;
-- Expected: 2 rows dengan data yang match payload

EXIT;
```

### Step 8: Test Frontend (Browser)

1. **Buka browser:** Chrome/Firefox/Edge
2. **Navigasi ke:** http://localhost:3000/overview

**Expected:**
- ✅ Page load tanpa error
- ✅ 3 device cards tampil
- ✅ TEST-01: Badge HIJAU "Layak"
- ✅ TEST-02: Badge MERAH "Tidak Layak"
- ✅ SIGAP-MBG-01: "No readings yet" (karena belum ada data)

3. **Test auto-refresh:**
   - Buka Developer Tools (F12)
   - Tab: Network
   - Wait 10 detik
   - Harusnya muncul request baru ke `/api/devices`

4. **Click device card TEST-01:**
   - Navigate ke `/device/TEST-01`
   - Badge HIJAU
   - Latest reading tampil
   - Temperature: 25.3°C
   - Humidity: 62.5%
   - Chart tidak muncul (perlu ≥2 readings)

5. **Send 1 more reading untuk TEST-01:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/readings" `
     -Method POST `
     -ContentType "application/json" `
     -Body '{
       "device_id": "TEST-01",
       "timestamp": "2026-09-27T17:50:00Z",
       "mq135_mean": 98.5,
       "mq135_std": 6.1,
       "mq135_slope": 0.08,
       "mq136_mean": 19.2,
       "mq136_std": 2.1,
       "mq136_slope": 0.03,
       "temp_mean": 26.1,
       "humidity_mean": 63.8,
       "prediction": "Layak",
       "confidence": 0.93
     }'
   ```

6. **Refresh detail page:**
   - Chart sekarang muncul (ada 2 readings)
   - Gas sensors chart (MQ-135, MQ-136)
   - Temp & Humidity chart

7. **Test Alerts page:**
   - Navigate ke: http://localhost:3000/alerts
   - Expected: 1 alert (TEST-02 "Tidak Layak")
   - NOT showing TEST-01 "Layak"
   - Filter dropdown works

### Step 9: Badge Color Visual Check

**Inspect element di browser:**

Right-click badge TEST-01 → Inspect:
```html
<span class="status-badge status-layak">Layak</span>
```

Check computed styles:
- `background-color: rgb(220, 252, 231)` = #dcfce7 (light green) ✅
- `color: rgb(22, 101, 52)` = #166534 (dark green) ✅

Right-click badge TEST-02 → Inspect:
```html
<span class="status-badge status-tidak-layak">Tidak Layak</span>
```

Check computed styles:
- `background-color: rgb(254, 226, 226)` = #fee2e2 (light red) ✅
- `color: rgb(153, 27, 27)` = #991b1b (dark red) ✅

### Step 10: Responsive Design Test

**Desktop view (≥1024px):**
- Device cards: 3 columns grid
- Charts side by side

**Tablet view (768-1023px):**
- Resize browser window ke ~800px
- Device cards: 2 columns grid

**Mobile view (<768px):**
- Resize browser window ke ~400px
- Device cards: 1 column (stacked)
- No horizontal overflow
- Navbar still readable

---

## OPSI B: Quick Test dengan Mock Database (No MySQL)

Jika tidak ingin install MySQL, bisa test dengan in-memory data:

### Step 1: Buat Mock Backend

```powershell
cd C:\nitipmehdi\pkmsigapmbg-main\pkmsigapmbg-main\sigap-mbg-dashboard\backend\src
```

Create file `mock-server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory storage
let devices = [
  {
    device_id: 'SIGAP-MBG-01',
    location_name: 'SPPG Universitas Negeri Semarang',
    reading_timestamp: '2026-09-27T17:30:00Z',
    prediction: 'Layak',
    confidence: 0.95,
    temp_mean: 25.3,
    humidity_mean: 62.5
  }
];

let readings = [];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../frontend/views'));

// GET /api/devices
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

// POST /api/readings
app.post('/api/readings', (req, res) => {
  const data = req.body;
  readings.push(data);
  
  // Update devices list
  const existingIndex = devices.findIndex(d => d.device_id === data.device_id);
  if (existingIndex >= 0) {
    devices[existingIndex] = {
      device_id: data.device_id,
      location_name: devices[existingIndex].location_name,
      reading_timestamp: data.timestamp,
      prediction: data.prediction,
      confidence: data.confidence,
      temp_mean: data.temp_mean,
      humidity_mean: data.humidity_mean
    };
  } else {
    devices.push({
      device_id: data.device_id,
      location_name: null,
      reading_timestamp: data.timestamp,
      prediction: data.prediction,
      confidence: data.confidence,
      temp_mean: data.temp_mean,
      humidity_mean: data.humidity_mean
    });
  }
  
  res.status(201).json({ success: true, id: readings.length, device_id: data.device_id });
});

// GET /api/alerts
app.get('/api/alerts', (req, res) => {
  const alerts = devices.filter(d => 
    d.prediction === 'Tidak Layak' || d.prediction === 'Perlu Diperiksa'
  );
  res.json(alerts);
});

// Frontend routes
app.get('/', (req, res) => res.redirect('/overview'));
app.get('/overview', (req, res) => res.render('overview', { title: 'Overview - SIGAP MBG' }));
app.get('/alerts', (req, res) => res.render('alerts', { title: 'Alerts - SIGAP MBG' }));

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
```

### Step 2: Install Minimal Dependencies

```powershell
cd C:\nitipmehdi\pkmsigapmbg-main\pkmsigapmbg-main\sigap-mbg-dashboard\backend

# Jika belum ada package-lock.json
npm install express cors ejs
```

### Step 3: Run Mock Server

```powershell
node src/mock-server.js
```

### Step 4: Test (sama seperti Opsi A Step 6-10)

Lanjut ke Opsi A Step 6 untuk test POST data dan frontend.

---

## Troubleshooting

### Error: MySQL connection refused
**Cause:** MySQL service tidak running  
**Solution:**
```powershell
# Start MySQL service
Start-Service MySQL80

# Atau via Services.msc
# Cari MySQL80 → Right-click → Start
```

### Error: Port 3000 already in use
**Cause:** Ada aplikasi lain di port 3000  
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (ganti <PID> dengan PID dari output di atas)
taskkill /PID <PID> /F

# Atau ganti PORT di .env ke 3001
```

### Error: Cannot find module 'express'
**Cause:** Dependencies belum diinstall  
**Solution:**
```powershell
cd backend
npm install
```

### Error: ER_ACCESS_DENIED_ERROR
**Cause:** Password MySQL salah di `.env`  
**Solution:**
1. Verify password: `mysql -u root -p` (test login)
2. Update `.env` dengan password yang benar

### Frontend: Badge colors tidak muncul
**Cause:** CSS tidak load atau class name salah  
**Solution:**
1. Hard refresh: Ctrl+Shift+R
2. Check browser console untuk error
3. Verify file `public/css/style.css` exists

### Frontend: Charts tidak render
**Cause:** Kurang dari 2 readings  
**Solution:**
Send at least 2 readings untuk device yang sama (lihat Opsi A Step 8 point 5)

---

## Hasil Testing yang Diharapkan

### ✅ Backend API (5 endpoints)
- POST /api/readings: Accept data, auto-create device ✅
- GET /api/devices: List devices dengan latest status ✅
- GET /api/devices/:id/latest: Latest reading 1 device ✅
- GET /api/devices/:id/readings: History untuk charts ✅
- GET /api/alerts: Filter critical status ✅

### ✅ Frontend Dashboard (3 pages)
- Overview page: Device cards, badge colors, auto-refresh ✅
- Device detail: Latest status, charts, history table ✅
- Alerts page: Filter dropdown, critical only ✅

### ✅ Integration
- ML payload → Backend: 100% compatible ✅
- Backend → Frontend: Badge colors match prediction ✅
- Auto-polling: 10 seconds interval ✅
- Responsive: Desktop/tablet/mobile ✅

---

## Next Steps Setelah Testing Berhasil

### 1. Integration dengan ESP32
- Update firmware WiFi credentials
- Update `SERVER_URL` ke IP server
- Deploy firmware ke ESP32
- Monitor serial output untuk POST requests

### 2. Production Deployment
- Setup MySQL di server production
- Deploy backend (Railway/Render/Server kampus)
- Update firmware dengan production URL
- Field testing di SPPG

### 3. Documentation
- User manual untuk petugas distribusi
- Installation guide untuk tim
- Troubleshooting guide

---

**Document Generated:** 2026-09-27T17:44:00Z  
**Testing Guide:** Kiro AI Agent  
**Project:** PKM-KC SIGAP MBG 2026 - Universitas Negeri Semarang
