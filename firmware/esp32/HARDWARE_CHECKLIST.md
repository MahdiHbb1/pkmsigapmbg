# 📋 SIGAP MBG ESP32 - Hardware Test Checklist

Quick reference checklist untuk test ESP32 SIGAP MBG. Untuk panduan lengkap, lihat `README_HARDWARE_TEST.md`.

---

## 🔧 Pre-Test Setup

### Hardware Components
- [ ] ESP32-WROOM Dev Board
- [ ] MQ-135 Gas Sensor (NH₃)
- [ ] MQ-3 Gas Sensor (Alcohol)
- [ ] GY-21 / HTU21D (Temp/Humidity)
- [ ] USB Cable
- [ ] Breadboard + Jumper wires
- [ ] Power supply 5V (min 1A recommended)

### Software Setup
- [ ] PlatformIO installed (`pio --version`)
- [ ] USB driver installed (CP2102/CH340)
- [ ] Git repository cloned
- [ ] `secrets.h` configured (WiFi credentials)

### Pin Connections Verified
- [ ] MQ-135: VCC→5V, GND→GND, AO→GPIO34
- [ ] MQ-3: VCC→5V, GND→GND, AO→GPIO35
- [ ] HTU21D: VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22
- [ ] Common ground connected
- [ ] No short circuit (check with multimeter)

---

## 🚀 Upload Process

### Build & Flash
- [ ] `pio run` - Compile successful
- [ ] `pio run -t upload` - Upload successful
- [ ] `pio device monitor -b 115200` - Serial monitor active

### Expected Boot Messages
- [ ] `[BOOT] SIGAP MBG Firmware v1.0`
- [ ] `[WiFi] Connected! IP: xxx.xxx.xxx.xxx`
- [ ] `[Sensor] HTU21D OK`
- [ ] `[Sensor] MQ sensors ready`
- [ ] `[Model] TFLite model loaded: 3048 bytes`
- [ ] `[System] Ready for data collection`

---

## 📊 Sensor Validation (First Test)

### HTU21D (Temperature & Humidity)
- [ ] Temperature reading: **20-40°C** (room temp expected: 25-30°C)
- [ ] Humidity reading: **30-90%** (comfortable range: 50-70%)
- [ ] Values stable (not fluctuating wildly)
- [ ] Responds to stimulus (warm breath increases both)

### MQ-135 (NH₃ / Ammonia)
- [ ] Reading NOT stuck at **0** (sensor disconnected)
- [ ] Reading NOT stuck at **4095** (sensor shorted)
- [ ] Baseline value: **5-50 ppm** (indoor air)
- [ ] Increases when exposed to ammonia source (cleaning product, breath)
- [ ] Returns to baseline after stimulus removed

### MQ-3 (Alcohol)
- [ ] Reading NOT stuck at **0** or **4095**
- [ ] Baseline value: **0.001-0.01 mg/L** (trace amounts)
- [ ] Increases when exposed to alcohol (hand sanitizer, perfume)
- [ ] Responds to warm breath (slight increase)

---

## 🧠 Model Inference Test

### Data Collection (5 Minutes)
- [ ] Serial shows: `[Data] Window 1/60`, `2/60`, ... `60/60`
- [ ] All 60 windows collected successfully
- [ ] No sensor read errors during collection

### Feature Extraction
- [ ] `[Features] Extracted 8 features:`
- [ ] Shows: nh3_mean, nh3_std, nh3_slope
- [ ] Shows: alcohol_mean, alcohol_std, alcohol_slope
- [ ] Shows: temp_mean, humidity_mean
- [ ] All values are reasonable (not NaN or Inf)

### Prediction Output
- [ ] `[Model] Inference complete`
- [ ] `[Model] Prediction:` **layak** / **perlu_diperiksa** / **tidak_layak**
- [ ] `[Model] Confidence:` **0.70 - 1.00** (percentage)
- [ ] Prediction makes sense (baseline air = "layak")

---

## 🌐 Backend Integration Test

### HTTP Request
- [ ] `[HTTP] Sending to backend...`
- [ ] `[HTTP] POST http://xxx.xxx.xxx.xxx:3000/api/readings`
- [ ] `[HTTP] Response: 201 Created`
- [ ] `[HTTP] Success: Reading ID xxx`
- [ ] No timeout or connection errors

### Dashboard Verification
- [ ] Open browser: `http://SERVER-IP:3000`
- [ ] Dashboard Overview page loads
- [ ] Device card shows ESP32 device_id
- [ ] Latest reading timestamp is recent (< 1 minute ago)
- [ ] Sensor values match serial output:
  - [ ] NH₃ (ppm)
  - [ ] Alcohol (mg/L)
  - [ ] Temperature (°C)
  - [ ] Humidity (%)
- [ ] Prediction badge shows correct classification
- [ ] Confidence score displayed

---

## ✅ Success Criteria

### Minimum Requirements (Pass)
- [x] Firmware uploaded without errors
- [x] WiFi connected successfully
- [x] All 3 sensors reading valid data
- [x] Model inference completes (any prediction)
- [x] HTTP POST succeeds (201 response)
- [x] Dashboard shows device online

### Ideal Performance (Excellent)
- [x] Sensor values stable (std deviation < 5% of mean)
- [x] Prediction confidence > 85%
- [x] Classification correct (baseline = "layak")
- [x] Full cycle completes in ~5 minutes
- [x] No errors in 3 consecutive cycles

---

## ⚠️ Common Issues & Quick Fixes

| Issue | Symptom | Quick Fix |
|-------|---------|-----------|
| **WiFi fail** | `Connection failed!` | Check SSID/password, use 2.4GHz WiFi |
| **MQ stuck 0** | Sensor = 0 always | Check wiring, VCC = 5V, AO connected |
| **MQ stuck 4095** | Sensor = max always | Check for short circuit, replace sensor |
| **HTU21D error** | `I2C timeout` | Check SDA/SCL pins, VCC = 3.3V |
| **Backend timeout** | `HTTP connection failed` | Verify server running, same network |
| **Upload fail** | Cannot connect | Press BOOT button during upload |
| **Low confidence** | < 70% confidence | Normal in first 24h (warmup period) |

---

## 📈 Expected Baseline Values

**Normal indoor air (food container empty):**

| Sensor | Expected Range | Typical Value |
|--------|----------------|---------------|
| NH₃ (MQ-135) | 5 - 50 ppm | ~15 ppm |
| Alcohol (MQ-3) | 0.001 - 0.01 mg/L | ~0.005 mg/L |
| Temperature | 25 - 30°C | ~27°C |
| Humidity | 50 - 70% | ~60% |
| **Prediction** | — | **layak** |
| **Confidence** | 80 - 95% | ~88% |

**After sensor warmup (24-48 hours):**
- Readings more stable (std dev decreases)
- Confidence scores increase (85-95%)
- Better discrimination between classes

---

## 📸 Documentation Requirements

Setelah test berhasil, dokumentasikan:

1. **Serial Output Screenshot**
   - Full boot sequence
   - Complete inference cycle (60 windows → prediction → HTTP)
   - Capture 2-3 consecutive cycles

2. **Hardware Photos**
   - Wiring connections (close-up)
   - Full setup (ESP32 + sensors on breadboard)
   - Power supply setup

3. **Dashboard Screenshot**
   - Overview page with device card
   - Device detail page with graphs
   - Latest reading details

4. **Test Results Table**
   ```
   Test Date: YYYY-MM-DD
   Sensor Warmup: X hours
   
   Sensor Readings (average over 3 cycles):
   - NH₃: XX.XX ppm
   - Alcohol: X.XXX mg/L
   - Temperature: XX.X °C
   - Humidity: XX.X %
   
   Model Performance:
   - Prediction: layak/perlu_diperiksa/tidak_layak
   - Confidence: XX.X%
   - Inference time: XX ms
   
   Network:
   - WiFi signal: -XX dBm
   - HTTP latency: XXX ms
   - Success rate: XX/XX (100%)
   ```

---

## 🎯 Next Actions After Successful Test

- [ ] Let sensors warmup 24-48 hours
- [ ] Run extended test (24h continuous operation)
- [ ] Test with food samples (fresh → spoiled)
- [ ] Collect production dataset (200+ readings)
- [ ] Calibrate sensors (opsional, untuk absolute values)
- [ ] Deploy to actual ompreng container

---

**Test completed?** Report hasil ke tim dengan dokumentasi lengkap! 🚀

**Need help?** Check `README_HARDWARE_TEST.md` untuk troubleshooting detail.
