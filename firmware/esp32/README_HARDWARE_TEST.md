# 🔧 SIGAP MBG ESP32 - Hardware Test Guide

Panduan lengkap untuk test hardware ESP32 SIGAP MBG dengan sensor MQ-135, MQ-3, dan HTU21D.

---

## 📦 Required Components

### Hardware
- [x] **ESP32-WROOM Dev Board** (atau variant compatible)
- [x] **MQ-135 Gas Sensor** (NH₃ / Ammonia detection)
- [x] **MQ-3 Gas Sensor** (Alcohol detection)
- [x] **GY-21 / HTU21D** (I2C Temperature & Humidity sensor)
- [x] **USB Cable** (untuk programming dan power)
- [x] **Breadboard** (untuk prototyping)
- [x] **Jumper wires** (male-to-male, male-to-female)
- [x] **Power supply 5V** (min 500mA, disarankan 1A untuk sensor warmup)

### Software
- [x] **PlatformIO Core** atau **PlatformIO IDE** (VS Code extension)
- [x] **USB Driver** (CP2102 atau CH340 sesuai board ESP32)
- [x] **Serial Monitor** (built-in PlatformIO atau Arduino IDE)

---

## 🔌 Pin Connections

### MQ-135 (NH₃ Gas Sensor)
| MQ-135 Pin | ESP32 Pin | Keterangan |
|------------|-----------|------------|
| VCC        | 5V        | Power supply (sensor butuh 5V untuk heater) |
| GND        | GND       | Ground |
| AO (Analog)| GPIO 34   | Analog output (ADC1_CH6) |
| DO (Digital)| *Not used* | Digital output tidak dipakai |

### MQ-3 (Alcohol Gas Sensor)
| MQ-3 Pin   | ESP32 Pin | Keterangan |
|------------|-----------|------------|
| VCC        | 5V        | Power supply |
| GND        | GND       | Ground |
| AO (Analog)| GPIO 35   | Analog output (ADC1_CH7) |
| DO (Digital)| *Not used* | Digital output tidak dipakai |

### HTU21D / GY-21 (I2C Temp & Humidity)
| HTU21D Pin | ESP32 Pin | Keterangan |
|------------|-----------|------------|
| VCC        | 3.3V      | Power supply (sensor I2C butuh 3.3V) |
| GND        | GND       | Ground |
| SDA        | GPIO 21   | I2C Data line |
| SCL        | GPIO 22   | I2C Clock line |

**⚠️ PENTING:**
- MQ-135 dan MQ-3 butuh **5V** (heater internal)
- HTU21D butuh **3.3V** (I2C logic level)
- Pastikan common ground terhubung semua
- Sensor MQ-135/MQ-3 butuh **warmup 24-48 jam** untuk hasil stabil

---

## 🛠️ Setup Instructions

### 1. Install PlatformIO

**Option A: PlatformIO IDE (Recommended)**
1. Install [VS Code](https://code.visualstudio.com/)
2. Install extension "PlatformIO IDE" dari marketplace
3. Restart VS Code

**Option B: PlatformIO Core (CLI)**
```bash
# Install dengan pip
pip install platformio

# Verify installation
pio --version
```

### 2. Clone Repository & Navigate
```bash
git clone https://github.com/YourRepo/pkmsigapmbg.git
cd pkmsigapmbg/firmware/esp32
```

### 3. Configure Credentials

Copy template secrets dan edit dengan credentials WiFi & backend API:

```bash
# Copy template
cp include/secrets.example.h include/secrets.h

# Edit dengan text editor
# - WIFI_SSID: "NamaWiFiKamu"
# - WIFI_PASSWORD: "PasswordWiFi"
# - API_ENDPOINT: "http://IP-SERVER:3000/api/readings"
# - API_KEY: "your-api-key" (opsional)
```

**Contoh isi `secrets.h`:**
```cpp
#define WIFI_SSID "WiFi-Lab"
#define WIFI_PASSWORD "password123"
#define API_ENDPOINT "http://192.168.1.100:3000/api/readings"
#define API_KEY "test-key-12345"
```

### 4. Connect Hardware

1. **Pasang sensor ke breadboard** sesuai tabel pin connections di atas
2. **Hubungkan ESP32** ke breadboard dengan jumper wires
3. **Cek koneksi** (gunakan multimeter untuk verify VCC dan GND tidak short)
4. **Colokkan USB cable** ke ESP32 dan PC

### 5. Verify Port

```bash
# List available ports
pio device list

# Contoh output:
# COM3 - CP2102 USB to UART Bridge Controller
# /dev/ttyUSB0 - Silicon Labs CP210x
```

Catat port ESP32 (misal: `COM3` di Windows atau `/dev/ttyUSB0` di Linux).

### 6. Build Firmware

```bash
# Build firmware (compile)
pio run

# Expected output:
# RAM:   [==        ]  14.7% (48KB / 328KB)
# Flash: [=======   ]  71.7% (939KB / 1.3MB)
# SUCCESS
```

Jika gagal, cek error message:
- **Library not found:** PlatformIO akan auto-download saat pertama build
- **Port not found:** Cek koneksi USB dan driver
- **Compile error:** Cek syntax di `secrets.h`

### 7. Upload Firmware

```bash
# Upload ke ESP32
pio run -t upload

# Expected output:
# Connecting.....
# Writing at 0x00010000... (100%)
# Hard resetting via RTS pin...
# SUCCESS
```

**Troubleshooting upload:**
- **Failed to connect:** Tekan dan tahan tombol **BOOT** saat upload dimulai
- **Permission denied (Linux):** `sudo usermod -a -G dialout $USER` lalu logout/login
- **Wrong port:** Edit `platformio.ini`, set `upload_port = COM3` (sesuaikan)

### 8. Monitor Serial Output

```bash
# Monitor serial (baud rate 115200)
pio device monitor -b 115200

# Untuk exit: Ctrl+C
```

---

## ✅ Expected Serial Output

### Startup Sequence
```
[BOOT] SIGAP MBG Firmware v1.0
[WiFi] Connecting to WiFi-Lab...
[WiFi] Connected! IP: 192.168.1.150
[Sensor] Initializing HTU21D...
[Sensor] HTU21D OK
[Sensor] Warming up MQ sensors (10 seconds)...
[Sensor] MQ sensors ready
[Model] TFLite model loaded: 3048 bytes
[System] Ready for data collection
```

### Normal Operation (every 5 minutes)
```
[Data] Window 1/60 - NH3: 12.34 ppm, Alcohol: 0.005 mg/L, Temp: 28.5°C, Humidity: 65.2%
[Data] Window 2/60 - NH3: 12.41 ppm, Alcohol: 0.006 mg/L, Temp: 28.6°C, Humidity: 65.1%
...
[Data] Window 60/60 - NH3: 12.89 ppm, Alcohol: 0.007 mg/L, Temp: 28.7°C, Humidity: 65.3%

[Features] Extracted 8 features:
  - nh3_mean: 12.55
  - nh3_std: 0.21
  - nh3_slope: 0.009
  - alcohol_mean: 0.0061
  - alcohol_std: 0.0008
  - alcohol_slope: 0.0001
  - temp_mean: 28.6
  - humidity_mean: 65.2

[Model] Inference complete
[Model] Prediction: layak
[Model] Confidence: 0.92

[HTTP] Sending to backend...
[HTTP] POST http://192.168.1.100:3000/api/readings
[HTTP] Response: 201 Created
[HTTP] Success: Reading ID 42

[System] Sleeping for 5 minutes...
```

### Error Cases
```
# WiFi gagal connect
[WiFi] Connection failed! Retrying in 5 seconds...
[WiFi] Attempt 2/10...

# Sensor error
[Sensor] HTU21D read failed! (I2C timeout)
[Sensor] Retrying...

# Backend unreachable
[HTTP] Connection failed: timeout
[HTTP] Will retry next cycle
```

---

## 🧪 Testing Checklist

Gunakan checklist ini untuk systematic validation:

### Pre-Upload Checklist
- [ ] PlatformIO installed dan verified
- [ ] `secrets.h` configured dengan WiFi credentials
- [ ] Semua sensor terpasang sesuai pin connections
- [ ] Power supply 5V stable (cek dengan multimeter)
- [ ] USB cable connected, port detected (`pio device list`)

### Upload Process
- [ ] Firmware compiled successfully (no errors)
- [ ] Upload to ESP32 successful
- [ ] Serial monitor shows boot messages
- [ ] WiFi connected (IP address displayed)

### Sensor Validation
- [ ] HTU21D reading temperature (20-40°C range expected)
- [ ] HTU21D reading humidity (30-90% range expected)
- [ ] MQ-135 reading NH₃ values (not stuck at 0 or 4095)
- [ ] MQ-3 reading alcohol values (not stuck at 0 or 4095)
- [ ] Sensor values change when exposed to stimulus (breath, hand heat)

### Model Inference
- [ ] 60 windows collected (5 minutes)
- [ ] 8 features extracted successfully
- [ ] Model inference completed
- [ ] Prediction output: "layak", "perlu_diperiksa", atau "tidak_layak"
- [ ] Confidence score: 0.70 - 1.00

### Network & Backend
- [ ] HTTP POST request sent
- [ ] Backend response: 201 Created
- [ ] Dashboard shows device online (check browser)
- [ ] Latest reading displayed on dashboard
- [ ] Sensor values match serial output

### Expected Results (Baseline Environment)
- [ ] NH₃: 5 - 50 ppm (indoor air quality)
- [ ] Alcohol: 0.001 - 0.01 mg/L (trace amounts)
- [ ] Temp: 25 - 30°C (room temperature)
- [ ] Humidity: 50 - 70% (comfortable range)
- [ ] Classification: **layak** (untuk udara normal)
- [ ] Confidence: 80% - 95%

---

## ⚠️ Troubleshooting

### Sensor MQ Tidak Stabil
**Symptom:** Nilai MQ-135/MQ-3 berubah drastis atau stuck di 0/4095

**Solution:**
1. **Warmup tidak cukup:** Sensor MQ butuh 24-48 jam warmup pertama kali untuk heating element stabil
2. **Power supply lemah:** Gunakan power supply min 1A (sensor heater consume 150-200mA)
3. **Koneksi loose:** Cek jumper wires, pastikan tidak ada koneksi yang goyang
4. **Sensor rusak:** Coba ganti sensor baru

### WiFi Tidak Connect
**Symptom:** `[WiFi] Connection failed!` berulang

**Solution:**
1. Verify SSID dan password di `secrets.h` (case-sensitive!)
2. Pastikan WiFi 2.4GHz (ESP32 tidak support 5GHz)
3. Cek firewall/network restrictions
4. Try hotspot dari HP untuk isolasi masalah

### Backend Connection Timeout
**Symptom:** `[HTTP] Connection failed: timeout`

**Solution:**
1. Verify backend server running: `curl http://IP:3000/api/devices`
2. Pastikan ESP32 dan server di network yang sama
3. Cek firewall di server (port 3000 harus open)
4. Test dengan browser dulu: buka `http://IP:3000` dari HP/PC

### HTU21D I2C Error
**Symptom:** `[Sensor] HTU21D read failed! (I2C timeout)`

**Solution:**
1. Cek koneksi SDA/SCL (GPIO 21/22)
2. Pastikan pull-up resistor ada (biasanya sudah built-in di module GY-21)
3. Verify 3.3V power supply (bukan 5V!)
4. Try I2C scanner: `pio run -t upload` dengan I2C scan code

### Compile Error
**Symptom:** Build failed dengan error message

**Common errors:**
```cpp
// Error: secrets.h not found
// Solution: Copy secrets.example.h ke secrets.h

// Error: Adafruit library not found
// Solution: PlatformIO auto-download saat build pertama, tunggu selesai

// Error: syntax error in secrets.h
// Solution: Pastikan string di-quote dengan benar: "WiFi-Name"
```

---

## 📊 Performance Expectations

### Inference Performance
- **Window collection:** 5 minutes (60 readings @ 5 seconds interval)
- **Feature extraction:** < 100ms
- **Model inference:** ~10ms per prediction
- **HTTP POST:** 200-500ms (tergantung network)
- **Total cycle time:** ~5 minutes + 600ms overhead

### Resource Usage
- **RAM:** 48KB / 328KB (14.7%)
- **Flash:** 939KB / 1.3MB (71.7%)
- **Model size:** 3048 bytes (quantized TFLite)
- **Power consumption:** ~200mA @ 5V (dengan sensor warmup)

### Accuracy Expectations (After Warmup)
- **First 24 hours:** 60-70% reliable (sensor still stabilizing)
- **After 48 hours:** 80-90% reliable (sensor warmed up)
- **Ideal conditions:** 90-95% confidence scores

---

## 📞 Support & Contact

**Jika ada masalah hardware test:**
1. Cek troubleshooting section di atas
2. Screenshot serial output (full boot sequence)
3. Foto setup hardware (wiring connections)
4. Contact: [Mahdi Habibi] - mahdi.habibi@example.com

**Resources:**
- Firmware source: `firmware/esp32/main.cpp`
- Backend API docs: `sigap-mbg-dashboard/backend/README.md`
- Full system docs: `README.md` (root directory)
- Setup guides: `docs/setup/`

---

## 🎯 Next Steps After Successful Test

1. ✅ **Document test results** (sensor ranges, accuracy, confidence scores)
2. ✅ **Collect more data** untuk improve model (target: 200-300 readings)
3. ✅ **Calibrate sensors** (opsional, untuk nilai absolut ppm/mg/L)
4. ✅ **Deploy to production** hardware (wadah makanan ompreng)
5. ✅ **Monitor dashboard** untuk real-world performance validation

**Good luck with hardware testing! 🚀**
