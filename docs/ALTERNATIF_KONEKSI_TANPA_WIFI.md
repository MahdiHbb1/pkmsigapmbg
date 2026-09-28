# Alternatif Koneksi ESP32 Tanpa WiFi di SPPG

**Tanggal:** 2026-09-27  
**Konteks:** SIGAP MBG Food Freshness Monitoring System  
**Problem:** SPPG kemungkinan tidak ada WiFi untuk koneksi real-time

---

## Pertanyaan Kritis

> **"Di SPPG harus ada WiFi untuk real-time monitoring?"**

**Jawaban:** Ya, untuk real-time monitoring via dashboard web, ESP32 perlu koneksi internet (WiFi) untuk kirim data ke server.

**TAPI** ada beberapa alternatif jika WiFi tidak tersedia.

---

## Skenario & Solusi

### Skenario 1: SPPG Ada WiFi ✅ (Ideal)

**Setup:**
```
ESP32 (SPPG) --WiFi--> Router --Internet--> Server ---> Dashboard Web
```

**Kelebihan:**
- Real-time monitoring (10 detik update)
- Data langsung masuk database
- Petugas bisa pantau dari mana saja
- Cocok untuk multi-lokasi SPPG

**Kebutuhan:**
- WiFi di lokasi SPPG
- Password WiFi
- Server online (cloud atau kampus)

**Implementasi:** Sudah ada di firmware, tinggal config WiFi credentials.

---

### Skenario 2: SPPG Tidak Ada WiFi - Pakai Hotspot HP 📱

**Setup:**
```
ESP32 (SPPG) --WiFi--> Hotspot HP Petugas --4G/5G--> Server ---> Dashboard Web
```

**Cara Kerja:**
1. Petugas distribusi bawa HP dengan kuota data
2. Nyalakan hotspot HP
3. ESP32 connect ke hotspot HP (SSID & password di-hardcode di firmware)
4. Data kirim via 4G/5G HP petugas ke server

**Kelebihan:**
- Tidak perlu infrastruktur WiFi di SPPG
- Fleksibel (petugas bawa kemana-mana)
- Tetap real-time monitoring
- Murah (hanya butuh kuota data ~100MB/bulan)

**Kekurangan:**
- Petugas harus ingat nyalakan hotspot
- Konsumsi baterai HP petugas
- Tidak bisa monitoring kalau petugas pergi

**Rekomendasi:** **Solusi paling praktis untuk PKM**

**Implementasi:**
```cpp
// Firmware ESP32
const char* ssid = "Hotspot_Petugas_MBG";  // Nama hotspot HP petugas
const char* password = "password123";      // Password hotspot
const char* serverUrl = "http://103.x.x.x:3000/api/readings";  // Server IP publik
```

**Estimasi Kuota:**
- 1 data point = ~500 bytes
- Update setiap 5 menit = 12 data/jam = 288 data/hari
- 288 × 500 bytes = 144 KB/hari
- 1 bulan = **~4.2 MB** (sangat kecil)

---

### Skenario 3: Data Logging Offline + Upload Manual 💾

**Setup:**
```
ESP32 (SPPG) --SD Card--> Simpan lokal --> Upload via laptop/HP (manual)
```

**Cara Kerja:**
1. ESP32 **tidak connect WiFi**
2. Data sensor + prediction disimpan ke **SD Card Module** (tambah hardware)
3. Setiap akhir distribusi, petugas ambil SD card
4. Upload data via laptop/HP ke server (bulk upload)

**Kelebihan:**
- Tidak butuh koneksi internet di lokasi
- Data tetap tersimpan meskipun offline
- Cocok untuk lokasi remote

**Kekurangan:**
- ❌ Tidak real-time (delayed)
- Perlu tambahan hardware (SD Card Module ~Rp 10.000)
- Petugas harus manual upload
- Risiko lupa upload / SD card hilang

**Implementasi:**
- Perlu modifikasi firmware (tambah library SD card)
- Perlu endpoint baru di backend: `POST /api/readings/bulk`

**Rekomendasi:** Alternatif terakhir jika hotspot HP tidak memungkinkan.

---

### Skenario 4: ESP32 + GSM Module (Cellular Direct) 📡

**Setup:**
```
ESP32 (SPPG) --SIM800L GSM Module--> Cellular (2G/3G/4G) --> Server
```

**Cara Kerja:**
1. ESP32 dilengkapi **SIM800L GSM module** (hardware tambahan)
2. Pasang SIM card dengan kuota data
3. ESP32 kirim data via cellular network (tanpa WiFi router)

**Kelebihan:**
- Tidak butuh WiFi atau hotspot HP
- Koneksi independen (ESP32 punya koneksi sendiri)
- Real-time monitoring
- Cocok untuk deployment permanen

**Kekurangan:**
- Butuh hardware tambahan: **SIM800L module ~Rp 80.000**
- Butuh SIM card + kuota data bulanan (~Rp 10.000/bulan)
- Konsumsi daya lebih besar (perlu power supply 5V 2A)
- Firmware perlu modifikasi (library AT commands)

**Rekomendasi:** Untuk production deployment jangka panjang (bukan untuk demo PKM).

---

### Skenario 5: Mode Demo Tanpa Koneksi (Lokal Only) 💻

**Setup:**
```
ESP32 (SPPG) --USB Serial--> Laptop Petugas --> Dashboard Lokal
```

**Cara Kerja:**
1. ESP32 connect ke laptop petugas via USB
2. Data kirim via Serial Monitor (COM port)
3. Script Python/Node.js di laptop baca serial → insert ke database lokal
4. Dashboard buka di `localhost:3000`

**Kelebihan:**
- Tidak butuh internet sama sekali
- Cocok untuk demo sempro/presentasi
- Gratis (no kuota)

**Kekurangan:**
- ❌ Tidak real-time remote (harus di lokasi)
- Hanya 1 orang bisa lihat (laptop petugas)
- Tidak cocok untuk multi-SPPG

**Implementasi:**
```python
# Script bridge.py
import serial
import requests

ser = serial.Serial('COM3', 115200)  # Port ESP32
while True:
    line = ser.readline().decode()
    data = json.loads(line)
    requests.post('http://localhost:3000/api/readings', json=data)
```

**Rekomendasi:** Untuk demo sempro atau testing tanpa infrastruktur.

---

## Rekomendasi untuk PKM SIGAP MBG

### Fase Demo/Sempro (Sekarang)
**Gunakan:** **Skenario 2 - Hotspot HP** atau **Skenario 5 - Demo Lokal**

**Alasan:**
- Murah (no cost tambahan)
- Cepat setup (tidak perlu hardware tambahan)
- Cukup untuk tunjukkan proof-of-concept
- Bisa demo real-time monitoring

**Setup:**
1. Firmware ESP32 config hotspot HP petugas
2. Server deploy di laptop presentasi atau cloud (Heroku/Railway free tier)
3. Demo: nyalakan hotspot → ESP32 kirim data → dashboard live update

---

### Fase Deployment Real (Setelah PKM Lolos)
**Gunakan:** **Skenario 4 - GSM Module** atau **Koordinasi dengan SPPG untuk WiFi**

**Alasan:**
- Independen (tidak depend on petugas)
- Scalable untuk multi-SPPG
- Professional deployment

**Budget tambahan:**
- SIM800L module: Rp 80.000 per unit
- SIM card + kuota: Rp 10.000/bulan per unit
- Total: **~Rp 200.000 per unit** (one-time + 1 tahun operasional)

---

## Perbandingan Solusi

| Solusi | Real-time | Cost | Hardware Tambahan | Cocok Untuk |
|--------|-----------|------|-------------------|-------------|
| **WiFi SPPG** | ✅ Ya | Gratis | Tidak | Ideal (jika ada WiFi) |
| **Hotspot HP** | ✅ Ya | Rp 5k/bulan kuota | Tidak | **PKM Demo (RECOMMENDED)** |
| **SD Card Logging** | ❌ Tidak | Rp 10k | SD module | Lokasi remote offline |
| **GSM Module** | ✅ Ya | Rp 80k + Rp 10k/bulan | SIM800L + SIM | Production deployment |
| **Demo Lokal (USB)** | ⚠️ Lokal saja | Gratis | Tidak | **Sempro Demo (RECOMMENDED)** |

---

## Implementasi Hotspot HP (Solusi Praktis)

### Step 1: Setup Hotspot HP Petugas

**Android:**
1. Settings → Network & Internet → Hotspot & Tethering
2. Wi-Fi Hotspot → ON
3. Set nama: `SPPG_MBG` (atau apapun)
4. Set password: `sigap2026` (atau apapun)
5. Save

**iPhone:**
1. Settings → Personal Hotspot → ON
2. Set password

### Step 2: Update Firmware ESP32

```cpp
// File: firmware/esp32/config.h
const char* WIFI_SSID = "SPPG_MBG";           // Sesuaikan dengan nama hotspot
const char* WIFI_PASSWORD = "sigap2026";      // Sesuaikan dengan password
const char* SERVER_URL = "http://YOUR_SERVER_IP:3000/api/readings";
```

### Step 3: Deploy Server

**Option A: Laptop Presentasi (Demo)**
```bash
# Get IP laptop
ipconfig  # Windows
ifconfig  # Linux/Mac

# Ganti YOUR_SERVER_IP di firmware dengan IP laptop (misal: 192.168.43.1)
```

**Option B: Cloud Free Tier (Remote)**
- Railway.app (free tier)
- Render.com (free tier)
- Heroku (free tier)

Ganti `SERVER_URL` dengan URL cloud (misal: `https://sigap-mbg.railway.app/api/readings`)

### Step 4: Test Koneksi

1. Nyalakan hotspot HP
2. Upload firmware ke ESP32
3. Buka Serial Monitor → cek `WiFi Connected`
4. Lihat log: `HTTP POST Response: 201`
5. Buka dashboard → device muncul

---

## FAQ

### Q: Berapa lama baterai ESP32 bertahan dengan WiFi?
**A:** Dengan power bank 10.000mAh, ESP32 bisa bertahan **~24 jam** continuous WiFi. Untuk hemat daya, bisa pakai sleep mode (kirim data tiap 5 menit, sleep di antaranya) → bertahan **~3-5 hari**.

### Q: Apakah hotspot HP harus selalu nyala?
**A:** Ya, jika mau real-time monitoring. Tapi bisa dikombinasi dengan SD card logging: offline → simpan ke SD, kalau hotspot nyala → upload otomatis.

### Q: Bagaimana jika HP petugas kehabisan baterai?
**A:** 
1. Siapkan power bank untuk HP
2. Atau, pakai mode SD card logging sebagai backup
3. Atau, pakai GSM module (SIM800L) agar ESP32 punya koneksi sendiri

### Q: Bisakah pakai WiFi kampus untuk demo?
**A:** Bisa! Jika sempro/presentasi di kampus:
1. ESP32 connect ke WiFi kampus (UNNES-WiFi atau apapun)
2. Server deploy di laptop atau cloud
3. Dashboard bisa diakses dari laptop presentasi atau HP juri

### Q: Bagaimana cara bulk upload data dari SD card?
**A:** 
1. Baca file CSV dari SD card
2. Kirim via script Python/Node.js:
```python
import pandas as pd
import requests

df = pd.read_csv('readings.csv')
for _, row in df.iterrows():
    requests.post('http://server/api/readings', json=row.to_dict())
```

---

## Rekomendasi Final

### Untuk Demo PKM (Sekarang):
✅ **Pakai Hotspot HP** (Skenario 2)
- Paling praktis
- No hardware tambahan
- Real-time monitoring
- Biaya minimal (~Rp 5k kuota)

### Untuk Presentasi Sempro (Offline):
✅ **Pakai Demo Lokal USB Serial** (Skenario 5)
- Tidak butuh internet
- Reliable (no connection issue)
- Cukup untuk tunjukkan sistem working

### Untuk Deployment Real (Future):
✅ **Koordinasi WiFi SPPG** atau **GSM Module SIM800L**
- Professional solution
- Scalable untuk banyak SPPG
- Independent monitoring

---

**Generated:** 2026-09-27T17:42:00Z  
**Author:** Kiro AI Agent  
**Project:** PKM-KC SIGAP MBG 2026 - Universitas Negeri Semarang
