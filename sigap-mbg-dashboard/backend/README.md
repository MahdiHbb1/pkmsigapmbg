# SIGAP MBG Dashboard - Backend

Backend REST API untuk SIGAP MBG Food Freshness Monitoring System.

## Prerequisites

- Node.js >= 16
- MySQL >= 8.0

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Database

Edit `.env` file dengan kredensial MySQL Anda:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sigap_mbg
DB_PORT=3306
PORT=3000
```

### 3. Initialize Database

**Option A: Via MySQL Command Line**
```bash
mysql -u root -p < migrations/init.sql
```

**Option B: Via MySQL Workbench / phpMyAdmin**
- Buka file `migrations/init.sql`
- Copy semua isi file
- Paste dan execute di MySQL client

Database `sigap_mbg` akan dibuat dengan 3 tabel:
- `devices` - daftar ESP32 device
- `readings` - history sensor readings & predictions
- `users` - (optional) untuk authentication

### 4. Start Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## API Endpoints

### 1. POST /api/readings
Receive sensor data from ESP32.

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "id": 123,
  "device_id": "SIGAP-MBG-01",
  "prediction": "Perlu Diperiksa"
}
```

### 2. GET /api/devices
List all devices with latest status.

**Response:**
```json
[
  {
    "device_id": "SIGAP-MBG-01",
    "location_name": "SPPG Universitas Brawijaya",
    "reading_timestamp": "2026-09-19T10:15:00Z",
    "prediction": "Layak",
    "confidence": 0.95,
    "temp_mean": 25.3,
    "humidity_mean": 65.2
  }
]
```

### 3. GET /api/devices/:device_id/latest
Get latest reading for specific device.

**Example:** `GET /api/devices/SIGAP-MBG-01/latest`

### 4. GET /api/devices/:device_id/readings?limit=100
Get reading history for specific device.

**Query Parameters:**
- `limit` (optional, default: 100) - number of readings to return

### 5. GET /api/alerts?status=Tidak%20Layak&limit=50
Get critical readings (Perlu Diperiksa or Tidak Layak).

**Query Parameters:**
- `status` (optional) - filter by prediction: "Layak", "Perlu Diperiksa", "Tidak Layak"
- `since` (optional) - ISO datetime, filter readings after this time
- `limit` (optional, default: 50) - number of alerts to return

## Testing with Dummy Data

Use curl or Postman to send test data:

```bash
curl -X POST http://localhost:3000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## Frontend Routes

- `GET /` - Redirect to overview
- `GET /overview` - Dashboard overview (all devices)
- `GET /device/:device_id` - Device detail page
- `GET /alerts` - Alerts page

## Database Schema

See `migrations/init.sql` for complete schema.

**Key Tables:**
- `devices(id, device_id, location_name, created_at)`
- `readings(id, device_id, reading_timestamp, 8 sensor fields, prediction, confidence, created_at)`

## Troubleshooting

### MySQL Connection Error
- Pastikan MySQL service running
- Cek kredensial di `.env` sudah benar
- Test koneksi: `mysql -u root -p`

### Port Already in Use
- Ubah PORT di `.env` ke port lain (misal 3001)
- Atau kill process yang pakai port 3000

### Auto-create Device Not Working
- Pastikan foreign key constraint aktif
- Device otomatis dibuat saat POST pertama kali dari device_id baru

## License

PKM-KC SIGAP MBG 2026
