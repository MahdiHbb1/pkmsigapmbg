# SIGAP MBG - Implementation Checklist

## Status: COMPLETED ✓

Tanggal: 2026-09-19

---

## Tahap 1: Analisis ✓

- [x] Baca dokumen `ML_Pipeline_SIGAP_MBG.md` lengkap
- [x] Pahami arsitektur MLP (8→12→8→3)
- [x] Pahami 8 fitur input (mean/std/slope dari sensor)
- [x] Identifikasi asumsi eksplisit (format CSV, rentang nilai, dll)
- [x] Konfirmasi dengan user sebelum coding

**Asumsi yang diambil:**
- Format CSV: timestamp, mq135, mq136, temp, humidity, label
- Rentang sensor: MQ-135 (50-500), MQ-136 (10-100), Temp (20-35°C), RH (40-90%)
- 300 window dummy (100 per kelas, seimbang)
- Window size: 240 data point = 5 menit
- Slope pakai least-squares regression terhadap index 0-239

---

## Tahap 2: Eksekusi Pipeline ✓

### 2.1 Setup Struktur Folder ✓
- [x] Buat folder: data/, models/, src/, firmware/, notebooks/
- [x] Buat subfolders sesuai spec dokumen
- [x] Buat requirements.txt

**Output:**
- Struktur 23 files/folders
- requirements.txt (6 dependencies)

### 2.2 Generate Data Dummy ✓
- [x] Script: `src/data_collection/generate_dummy_data.py`
- [x] 300 windows (100 per kelas)
- [x] Pola realistis per kelas (gas rendah/sedang/tinggi + slope)
- [x] Test: jalankan dan validasi output

**Output:**
- data/raw/dummy_sensor_data.csv (72,000 rows, 6.9 MB)
- Label balance: 24,000 rows per kelas

### 2.3 Ekstraksi Fitur ✓
- [x] Script: `src/feature_extraction/extract_features.py`
- [x] Windowing 240 data → 1 baris fitur
- [x] Hitung mean, std, slope (least-squares) untuk MQ-135 & MQ-136
- [x] Hitung mean untuk temp & humidity
- [x] Test: verifikasi 300 windows → 300 rows fitur

**Output:**
- data/processed/feature_dataset.csv (300 rows × 9 cols)
- 8 fitur + 1 label, balance 100/100/100

### 2.4 Normalisasi & Split ✓
- [x] Script: `src/preprocessing/normalize.py`
- [x] Train/test split 80/20 stratified
- [x] Fit Min-Max scaler pada train set ONLY
- [x] Simpan scaler params ke JSON
- [x] Transform train & test, simpan normalized CSV
- [x] Test: cek distribusi label tetap seimbang

**Output:**
- data/processed/train_normalized.csv (240 rows)
- data/processed/test_normalized.csv (60 rows)
- models/scaler_params.json (8 fitur × min/max)

### 2.5 Training Model ✓
- [x] Script: `src/model/train.py`
- [x] Arsitektur MLP persis sesuai spec (8→12→8→3)
- [x] Optimizer Adam (lr=0.001)
- [x] Loss: categorical_crossentropy
- [x] Batch size 16, max epoch 100
- [x] EarlyStopping (patience=15, monitor val_loss)
- [x] One-hot encoding label
- [x] Validation split 20% dari train set
- [x] Test: train sampai konvergen

**Output:**
- models/sigap_mbg_mlp.h5 (34 KB)
- Train accuracy: 100%, Val accuracy: 100%
- Total params: 239
- Training time: ~2 menit, 100 epochs

### 2.6 Evaluasi Model ✓
- [x] Script: `src/model/evaluate.py`
- [x] Classification report (precision/recall/F1 per kelas)
- [x] Confusion matrix
- [x] CEK KHUSUS: Recall "Tidak Layak" = 100%
- [x] Plot confusion matrix, simpan PNG
- [x] Test: jalankan evaluasi pada test set

**Output:**
- models/confusion_matrix.png
- Test accuracy: 100% (60/60)
- Recall "Tidak Layak": 100% (20/20) ✓ CRITICAL METRIC

### 2.7 Konversi TFLite ✓
- [x] Script: `src/model/convert_tflite.py`
- [x] Convert Keras → TFLite dengan quantization (DEFAULT)
- [x] Convert TFLite → C array header
- [x] Verifikasi TFLite inference dengan dummy input
- [x] Test: cek ukuran file <5KB, inference jalan

**Output:**
- models/sigap_mbg_mlp.tflite (3.07 KB) ✓
- firmware/esp32/model_data.h (19.9 KB, 3144 bytes array)
- TFLite inference verified: input [8] → output [3] softmax

### 2.8 Verifikasi End-to-End ✓
- [x] Script: `verify_pipeline.py`
- [x] Cek semua 8 files exist
- [x] Cek scaler params lengkap (8 fitur)
- [x] Cek dataset statistics (300 windows, balance)
- [x] Cek model architecture (239 params)
- [x] Test TFLite inference 3 sampel
- [x] Cek C header valid
- [x] Test: jalankan full verification

**Output:**
- [OK] All files present
- [OK] Pipeline complete end-to-end
- [OK] Ready for ESP32 deployment

### 2.9 Firmware ESP32 ✓
- [x] File: `firmware/esp32/main.cpp` (15.6 KB)
- [x] File: `firmware/esp32/platformio.ini`
- [x] File: `firmware/esp32/README.md`
- [x] Sensor reading (MQ-135, MQ-136, SHT31)
- [x] Windowing buffer 240 samples
- [x] Feature extraction on-device (mean/std/slope)
- [x] Normalization dengan scaler params hardcoded
- [x] Inference stub (placeholder untuk TFLite Micro)
- [x] LED control (3 LED untuk 3 kelas)
- [x] WiFi + HTTP POST JSON ke server
- [x] Serial monitoring untuk debug

**Status:**
- Code complete (stub inference, perlu integrasi TFLite Micro library)
- Belum test hardware (no ESP32 available)
- Dokumentasi lengkap di README.md

---

## Tahap 3: Dokumentasi ✓

- [x] README.md proyek (comprehensive guide)
- [x] firmware/esp32/README.md (deployment guide)
- [x] Inline comments di semua script Python
- [x] Inline comments di firmware C++
- [x] Checklist ini

---

## Summary Metrics

### Dataset
- Raw data: 72,000 rows (300 windows × 240 points)
- Features: 300 rows × 8 features
- Train: 240 samples (80%)
- Test: 60 samples (20%)
- Classes: Balanced 1:1:1

### Model Performance
- Architecture: MLP 8→12→8→3 (239 params)
- Train accuracy: 100%
- Test accuracy: 100%
- Recall "Tidak Layak": 100% ✓
- Model size (Keras): 34 KB
- Model size (TFLite): 3.07 KB ✓

### Files Generated
- Python scripts: 7 files
- Data files: 4 CSV (7 MB total)
- Model files: 4 files (h5, tflite, json, png)
- Firmware: 4 files (cpp, h, ini, md)
- Documentation: 3 MD files
- Total: 23 files

### Code Stats
- Python code: ~1,500 lines
- C++ code: ~450 lines
- Documentation: ~600 lines

---

## Known Issues / TODO

### Critical (Blocker untuk production)
- [ ] Data dummy → ganti dengan sensor asli
- [ ] TFLite Micro inference → integrasi EloquentTinyML
- [ ] Hardware testing → belum ada ESP32 fisik

### Important (Perlu sebelum deploy)
- [ ] Server backend → REST API + MySQL
- [ ] Dashboard monitoring → web interface
- [ ] NTP sync → timestamp akurat
- [ ] Kalibrasi sensor → MQ-135/136 ke ppm absolut

### Nice to Have
- [ ] K-fold cross-validation
- [ ] Hyperparameter tuning
- [ ] Model ensemble
- [ ] Power optimization (deep sleep)
- [ ] OTA firmware update

---

## Next Actions

### Immediate (Tim PKM)
1. **Data Collection**: Kumpulkan data asli dari 9 sampel makanan
   - Pantau kontinu segar → busuk (minimal 5 window per sampel)
   - Label konsisten (2+ orang independen)
   - Simpan ke `data/raw/sensor_data_YYYYMMDD.csv`

2. **Re-train Model**: Jalankan ulang pipeline step 3-7 dengan data asli
   - Cek performa drop jadi ~85-95% (normal untuk data real)
   - Kalau recall "Tidak Layak" < 80%, tuning hyperparameter

3. **Hardware Integration**: Test firmware di ESP32
   - Pasang sensor MQ-135, MQ-136, SHT31
   - Upload firmware, monitor serial output
   - Validasi feature extraction sama dengan Python

### Later (Post-testing)
4. **TFLite Integration**: Ganti stub dengan EloquentTinyML
5. **Backend Setup**: Deploy server + database
6. **Field Testing**: Test distribusi MBG nyata

---

## Verification

Pipeline COMPLETE dan VERIFIED:
```
[OK] All 8 required files present
[OK] Scaler parameters complete (8 features)
[OK] Dataset: 300 windows total (100 per class)
[OK] Model: 239 parameters, 3.07 KB TFLite
[OK] TFLite inference working
[OK] C header ready for ESP32
[OK] PIPELINE COMPLETE - Ready for ESP32 deployment
```

**Status:** ✓ READY FOR DATA COLLECTION & HARDWARE TESTING

---

Generated: 2026-09-19T07:32:00Z
ML Pipeline Developer: Kiro AI Agent
