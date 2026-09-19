# SIGAP MBG - ESP32 Firmware

Firmware untuk deteksi kesegaran makanan pakai MLP TinyML di ESP32.

## Hardware Requirements

- ESP32 DevKit
- MQ-135 gas sensor (NH3/polutan)
- MQ-136 gas sensor (H2S)
- SHT31 temperature/humidity sensor
- 3x LED (hijau/kuning/merah) untuk indikator
- Resistor 220Ω untuk LED
- Powerbank/battery

## Pin Configuration

```
MQ-135:  GPIO 34 (ADC1_CH6)
MQ-136:  GPIO 35 (ADC1_CH7)
SHT31:   I2C (SDA=GPIO21, SCL=GPIO22)
LED Layak:           GPIO 25 (hijau)
LED Perlu Diperiksa: GPIO 26 (kuning)
LED Tidak Layak:     GPIO 27 (merah)
```

## Software Dependencies

Install PlatformIO, lalu:

```bash
cd firmware/esp32
pio lib install
pio run
```

Libraries (dari platformio.ini):
- Adafruit SHT31 Library
- ArduinoJson
- EloquentTinyML (untuk TFLite inference)

## Configuration

Edit `main.cpp` bagian CONFIGURATION:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://your-server.com/api/sensor-data";
const char* DEVICE_ID = "SIGAP-MBG-01";
```

## How It Works

1. **Warmup** (3 menit): MQ sensors perlu stabilisasi sebelum pembacaan akurat
2. **Data Collection**: Baca sensor tiap 5 detik, kumpulkan 240 sampel (5 menit)
3. **Feature Extraction**: Hitung 8 fitur statistik dari 240 data point
4. **Normalization**: Min-Max scaling pakai parameter dari training
5. **Inference**: Model MLP (8→12→8→3) klasifikasi ke 3 kelas
6. **Output**: 
   - Nyalakan LED sesuai hasil
   - Kirim JSON ke server via HTTP POST
7. **Repeat**: Mulai window baru

## Model Details

- File: `model_data.h` (3144 bytes)
- Architecture: MLP 8→12→8→3
- Input: 8 fitur (normalized [0,1])
- Output: 3 kelas (Layak/Perlu Diperiksa/Tidak Layak)
- Inference time: ~5-10ms di ESP32

## TFLite Integration (TODO)

Current `runInference()` adalah stub. Untuk implementasi penuh:

1. Install library TFLite Micro:
   ```
   pio lib install "https://github.com/eloquentarduino/EloquentTinyML.git"
   ```

2. Ganti stub dengan kode TFLite pattern (ada di komentar `main.cpp`)

3. Alokasi arena memory (~10KB) untuk interpreter

4. Test inference dengan data dummy sebelum deploy

## Scaler Parameters

Hardcoded di firmware dari `models/scaler_params.json` (hasil training):

```
mq135_mean:    50.48 - 499.40
mq135_std:      1.94 - 76.69
mq135_slope:   -0.32 - 1.10
mq136_mean:    10.46 - 99.90
mq136_std:      0.78 - 19.65
mq136_slope:   -0.09 - 0.27
temp_mean:     22.08 - 33.89
humidity_mean: 50.02 - 87.82
```

**CRITICAL**: Jangan ubah nilai ini kecuali re-train model. Kalau ganti, model akan prediksi salah.

## JSON Payload Format

Dikirim ke server tiap 5 menit:

```json
{
  "device_id": "SIGAP-MBG-01",
  "timestamp": 1234567890,
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

## Troubleshooting

### MQ sensors baca 0 atau nilai aneh
- Cek koneksi VCC/GND
- Tunggu warmup 3 menit
- MQ-135/136 butuh load resistor (cek datasheet)

### SHT31 not found
- Cek I2C wiring (SDA/SCL)
- Test I2C scanner: `Wire.begin(); Wire.beginTransmission(0x44);`
- Pastikan address 0x44 (bukan 0x45)

### Inference hasil aneh
- Cek scaler params match dengan training
- Pastikan feature extraction sama persis dengan `extract_features.py`
- Test dengan data dummy yang sudah divalidasi

### WiFi tidak connect
- Cek SSID/password
- ESP32 hanya support 2.4GHz (bukan 5GHz)
- Tambah delay di setup untuk stabilisasi

## Upload Firmware

```bash
pio run -t upload
pio device monitor
```

Atau via Arduino IDE: File → Open → main.cpp, pilih board ESP32 Dev Module

## Testing Checklist

- [ ] LED test saat startup (semua nyala 500ms)
- [ ] SHT31 detected (cek serial monitor)
- [ ] WiFi connected (print IP address)
- [ ] MQ sensors warmup countdown (180 detik)
- [ ] Data collection (240 sampel, print tiap sampel)
- [ ] Feature extraction (print 8 fitur raw + normalized)
- [ ] Inference (print prediction + confidence)
- [ ] LED update sesuai hasil
- [ ] HTTP POST success (server response 200)

## License & Credits

Proyek PKM-KC SIGAP MBG
Model training: Python (TensorFlow/Keras)
Firmware: Arduino/ESP32 (PlatformIO)
