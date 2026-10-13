# SIGAP MBG Dashboard

Dashboard monitoring untuk sistem deteksi kesegaran makanan SIGAP MBG.

## Status Implementasi

✅ **Tahap 2 - Backend & Frontend SELESAI:**
- Backend REST API (Express + MySQL)
- 5 endpoint API sesuai spec
- 3 halaman dashboard (Overview, Device Detail, Alerts)
- Auto-polling 10 detik
- Responsive design

⏳ **Tahap 3 - Validasi ML ↔ Web:**
- Belum dijalankan (perlu MySQL setup dulu)
- Test script sudah siap: `backend/test-dummy-data.js`

## Arsitektur

```
ESP32 (sensor) → POST /api/readings → MySQL → GET endpoints → Dashboard (browser)
```

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MySQL 8.0
- **Frontend**: EJS + Vanilla JS + Chart.js
- **Styling**: Custom CSS (responsive)

## Quick Start

### 1. Setup MySQL

Pastikan MySQL running, lalu jalankan:

```sql
mysql -u root -p < backend/migrations/init.sql
```

Ini akan create:
- Database `sigap_mbg`
- Tabel `devices`, `readings`, `users`
- Sample device: SIGAP-MBG-01

### 2. Configure Environment

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sigap_mbg
DB_PORT=3306
PORT=3000
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start Server

```bash
npm run dev
```

Server berjalan di: http://localhost:3000

## API Endpoints

### POST /api/readings
Terima data dari ESP32.

**Payload:**
```json
{
  "device_id": "SIGAP-MBG-01",
  "timestamp": "2026-09-19T10:15:00Z",
  "mq135_mean": 245.3,
  "mq135_std": 12.1,
  "mq135_slope": 0.85,
  "mq136_mean": 18.7,
  "mq136_std": 2.3,
  "mq136_slope": 0.12,
  "temp_mean": 29.4,
  "humidity_mean": 68.2,
  "prediction": "Perlu Diperiksa",
  "confidence": 0.87
}
```

### GET /api/devices
List semua device + status terakhir.

### GET /api/devices/:device_id/latest
Latest reading untuk 1 device.

### GET /api/devices/:device_id/readings?limit=100
History pembacaan (untuk grafik).

### GET /api/alerts?status=X&limit=50
List alert kritis (Perlu Diperiksa / Tidak Layak).

## Dashboard Pages

1. **Overview** (`/overview`)
   - Grid card semua device
   - Badge warna per status (hijau/kuning/merah)
   - Auto-refresh 10 detik

2. **Device Detail** (`/device/:device_id`)
   - Status terkini
   - Grafik Chart.js (gas sensors, temp/humidity)
   - Tabel history

3. **Alerts** (`/alerts`)
   - List reading kritis
   - Filter by status
   - Sort terbaru dulu

## Testing (Tahap 3)

### Test dengan Dummy Data

```bash
node backend/test-dummy-data.js
```

Script ini kirim 3 payload:
1. SIGAP-MBG-01: "Layak" (confidence 95%)
2. SIGAP-MBG-01: "Perlu Diperiksa" (confidence 87%)
3. SIGAP-MBG-02: "Tidak Layak" (confidence 92%)

### Verifikasi

**1. Check Database:**
```sql
USE sigap_mbg;
SELECT * FROM readings ORDER BY id DESC LIMIT 3;
SELECT * FROM devices;
```

**2. Check Overview Page:**
- Buka http://localhost:3000/overview
- Harus tampil 2 device cards
- SIGAP-MBG-01: badge hijau "Layak" (reading terakhir)
- SIGAP-MBG-02: badge merah "Tidak Layak"

**3. Check Alerts Page:**
- Buka http://localhost:3000/alerts
- Harus tampil 2 alerts (Perlu Diperiksa + Tidak Layak)
- TIDAK tampil "Layak"

**4. Check Device Detail:**
- Click card SIGAP-MBG-01
- Badge warna match prediction
- Grafik tampil (jika ≥2 readings)
- Sensor values match payload yang dikirim

**5. Check Color Badges:**
- Hijau (Layak) → `.status-layak`
- Kuning (Perlu Diperiksa) → `.status-perlu-diperiksa`
- Merah (Tidak Layak) → `.status-tidak-layak`

### Test dengan curl

```bash
# Test Layak
curl -X POST http://localhost:3000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "SIGAP-MBG-01",
    "timestamp": "2026-09-19T08:00:00Z",
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

# Test Tidak Layak
curl -X POST http://localhost:3000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "SIGAP-MBG-03",
    "timestamp": "2026-09-19T08:05:00Z",
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

## Validasi ML ↔ Web Connection

### Schema Compatibility Check

**ML Payload (dari `ML_Pipeline_SIGAP_MBG.md` section 12):**
```json
{
  "device_id": "SIGAP-MBG-01",
  "timestamp": "2026-09-18T10:15:00Z",
  "mq135_mean": 245.3, "mq135_std": 12.1, "mq135_slope": 0.85,
  "mq136_mean": 18.7, "mq136_std": 2.3, "mq136_slope": 0.12,
  "temp_mean": 29.4, "humidity_mean": 68.2,
  "prediction": "Perlu Diperiksa",
  "confidence": 0.87
}
```

**Web Database Schema:**
```sql
device_id VARCHAR(50),
reading_timestamp DATETIME,  -- dari "timestamp" field
mq135_mean FLOAT, mq135_std FLOAT, mq135_slope FLOAT,
mq136_mean FLOAT, mq136_std FLOAT, mq136_slope FLOAT,
temp_mean FLOAT, humidity_mean FLOAT,
prediction ENUM('Layak', 'Perlu Diperiksa', 'Tidak Layak'),
confidence FLOAT
```

✅ **100% COMPATIBLE** - semua field nama & tipe match.

## Project Structure

```
sigap-mbg-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── readings.js      ✅ POST + GET readings
│   │   │   ├── devices.js       ✅ GET devices + latest + history
│   │   │   └── alerts.js        ✅ GET alerts
│   │   ├── db/
│   │   │   └── connection.js    ✅ MySQL pool
│   │   └── app.js               ✅ Express setup
│   ├── migrations/
│   │   ├── init.sql             ✅ Database schema
│   │   └── test.sql             ✅ Test queries
│   ├── test-dummy-data.js       ✅ Integration test
│   ├── package.json
│   ├── .env
│   └── README.md
├── frontend/
│   ├── views/
│   │   ├── overview.ejs         ✅ Device grid
│   │   ├── device-detail.ejs    ✅ Charts + history
│   │   └── alerts.ejs           ✅ Critical alerts
│   └── public/
│       ├── css/
│       │   └── style.css        ✅ Responsive design
│       └── js/
│           ├── overview.js      ✅ Polling + render devices
│           ├── device-detail.js ✅ Charts (Chart.js)
│           └── alerts.js        ✅ Filter alerts
└── README.md                    ✅ This file
```

## Features Implemented

✅ Auto-create device saat POST pertama kali
✅ Validasi payload (required fields, enum prediction, number types)
✅ Badge warna sesuai 3 kelas (hijau/kuning/merah)
✅ Auto-polling 10 detik (configurable)
✅ Responsive design (mobile-friendly)
✅ Chart.js grafik tren sensor
✅ Filter alerts by status
✅ Timestamp relative ("5m ago") + absolute
✅ Error handling + loading states

## Known Limitations

- ⚠️ **MySQL harus di-setup manual** (tidak auto-install)
- ⚠️ **Belum ada authentication** (skip untuk MVP)
- ⚠️ **Polling only** (bukan websocket real-time)
- ⚠️ **No pagination** (limit fix di query)
- ⚠️ **No device management UI** (edit location manual via SQL)

## Next Steps

### Immediate
1. ✅ Setup MySQL + run init.sql
2. ✅ Start server: `npm run dev`
3. ✅ Run test: `node test-dummy-data.js`
4. ✅ Verify dashboard: buka http://localhost:3000

### Integration dengan Hardware
1. ESP32 firmware (dari ML pipeline) kirim POST ke `/api/readings`
2. Configure WiFi credentials di firmware
3. Set `SERVER_URL` ke IP server (bukan localhost)
4. Monitor serial output ESP32 untuk debug
5. Check dashboard real-time saat ESP32 kirim data

### Production Deployment
1. Setup MySQL di production server
2. Update `.env` dengan production credentials
3. Run `npm start` (bukan npm run dev)
4. Setup reverse proxy (nginx) kalau perlu HTTPS
5. Consider: PM2 untuk process management

## Troubleshooting

### MySQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
→ MySQL belum running. Start service: `net start MySQL` (Windows) atau `sudo service mysql start` (Linux).

### Port 3000 Already in Use
```
Error: listen EADDRINUSE :::3000
```
→ Ubah PORT di `.env` ke port lain, misal 3001.

### POST /api/readings Returns 400
```
{ "error": "Missing required fields: device_id, timestamp, prediction" }
```
→ Check payload JSON lengkap. Field wajib: device_id, timestamp, prediction.

### Dashboard Tidak Refresh
→ Check browser console untuk error fetch. Pastikan server running di port yang benar.

### Chart Tidak Muncul
→ Minimal 2 readings diperlukan untuk render chart. Kirim lebih banyak data dummy.

## License

PKM-KC SIGAP MBG 2026 - Universitas Negeri Semarang

## Contact

Untuk pertanyaan teknis dashboard, hubungi maintainer repo.
