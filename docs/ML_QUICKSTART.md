# SIGAP MBG - Machine Learning Pipeline

Pipeline lengkap untuk training model deteksi kesegaran makanan dan deployment ke ESP32.

## Struktur Proyek

```
sigap-mbg-ml/
├── data/
│   ├── raw/                          # Data sensor mentah (CSV time-series)
│   │   └── dummy_sensor_data.csv     # Data dummy untuk testing (72,000 rows)
│   └── processed/                    # Dataset hasil ekstraksi fitur
│       ├── feature_dataset.csv       # 300 windows × 8 fitur
│       ├── train_normalized.csv      # 240 samples (80%)
│       └── test_normalized.csv       # 60 samples (20%)
├── models/
│   ├── sigap_mbg_mlp.h5             # Model Keras (34 KB)
│   ├── sigap_mbg_mlp.tflite         # Model TFLite quantized (3 KB)
│   ├── scaler_params.json           # Min-Max params untuk normalisasi
│   └── confusion_matrix.png         # Visualisasi evaluasi
├── src/
│   ├── data_collection/
│   │   └── generate_dummy_data.py   # Generator data sintetis
│   ├── feature_extraction/
│   │   └── extract_features.py      # Windowing + ekstraksi 8 fitur
│   ├── preprocessing/
│   │   └── normalize.py             # Min-Max scaling + train/test split
│   └── model/
│       ├── train.py                 # Training MLP
│       ├── evaluate.py              # Evaluasi metrics
│       └── convert_tflite.py        # Konversi ke TFLite + C array
├── firmware/
│   └── esp32/
│       ├── main.cpp                 # Firmware ESP32 lengkap
│       ├── model_data.h             # Model TFLite sebagai C array
│       ├── platformio.ini           # Config PlatformIO
│       └── README.md                # Dokumentasi firmware
├── verify_pipeline.py               # Script verifikasi end-to-end
├── requirements.txt
└── README.md                        # Dokumen ini
```

## Quick Start

### 1. Setup Environment

```bash
# Install Python dependencies
pip install -r requirements.txt

# Verifikasi instalasi
python -c "import tensorflow; print(tensorflow.__version__)"
```

### 2. Generate Dummy Data

```bash
python src/data_collection/generate_dummy_data.py
```

Output: `data/raw/dummy_sensor_data.csv` (72,000 rows)

### 3. Extract Features

```bash
python src/feature_extraction/extract_features.py
```

Output: `data/processed/feature_dataset.csv` (300 windows)

### 4. Normalize & Split

```bash
python src/preprocessing/normalize.py
```

Output:
- `data/processed/train_normalized.csv`
- `data/processed/test_normalized.csv`
- `models/scaler_params.json`

### 5. Train Model

```bash
python src/model/train.py
```

Output: `models/sigap_mbg_mlp.h5`

Training hasil:
- Train accuracy: 100%
- Val accuracy: 100%
- Epochs: 100 (dengan EarlyStopping)

### 6. Evaluate

```bash
python src/model/evaluate.py
```

Output: `models/confusion_matrix.png`

Metrics:
- Test accuracy: 100%
- Recall "Tidak Layak": 100% (critical metric)

### 7. Convert to TFLite

```bash
python src/model/convert_tflite.py
```

Output:
- `models/sigap_mbg_mlp.tflite` (3.07 KB)
- `firmware/esp32/model_data.h` (C array)

### 8. Verify Pipeline

```bash
python verify_pipeline.py
```

Cek semua file, metrics, dan TFLite inference.

### 9. Deploy to ESP32

```bash
cd firmware/esp32
# Edit WiFi credentials di main.cpp
pio run -t upload
pio device monitor
```

## Model Specification

### Input Features (8)

| # | Feature | Source | Description |
|---|---------|--------|-------------|
| 1 | mq135_mean | MQ-135 | Rata-rata 240 pembacaan |
| 2 | mq135_std | MQ-135 | Standar deviasi |
| 3 | mq135_slope | MQ-135 | Kemiringan regresi linear (tren) |
| 4 | mq136_mean | MQ-136 | Rata-rata 240 pembacaan |
| 5 | mq136_std | MQ-136 | Standar deviasi |
| 6 | mq136_slope | MQ-136 | Kemiringan regresi linear |
| 7 | temp_mean | SHT31 | Rata-rata suhu (°C) |
| 8 | humidity_mean | SHT31 | Rata-rata kelembapan (%RH) |

### Architecture

```
Input Layer:     8 neurons
Hidden Layer 1:  12 neurons (ReLU)
Hidden Layer 2:  8 neurons (ReLU)
Output Layer:    3 neurons (Softmax)

Total parameters: 239
Model size (TFLite): 3.07 KB
```

### Output Classes (3)

0. **Layak** - Aman dikonsumsi
1. **Perlu Diperiksa** - Mulai menurun, perlu verifikasi manual
2. **Tidak Layak** - Tidak aman dikonsumsi

### Training Config

- Optimizer: Adam (lr=0.001)
- Loss: Categorical Crossentropy
- Batch size: 16
- Max epochs: 100
- EarlyStopping: patience=15, monitor=val_loss
- Split: 80% train / 20% test (stratified)
- Quantization: TFLite DEFAULT (int8)

## Data Collection Protocol

### Window Configuration

- **Sampling rate**: 5 detik per pembacaan
- **Window size**: 240 pembacaan = 5 menit
- **Sensors**: MQ-135, MQ-136, suhu, kelembapan

### Sensor Warmup

**PENTING**: MQ-135 dan MQ-136 butuh warmup 3 menit sebelum pembacaan stabil. Jangan mulai pengumpulan data sebelum warmup selesai.

### Labeling Guidelines

Untuk data asli (bukan dummy):

1. **Layak**: Makanan segar, tidak ada bau busuk, kondisi visual normal
2. **Perlu Diperiksa**: Mulai ada bau samar, perubahan warna ringan, masih borderline
3. **Tidak Layak**: Bau busuk jelas, perubahan visual signifikan, tidak layak konsumsi

Kriteria harus konsisten antar sampel. Gunakan minimal 2 orang untuk labeling independen, lalu voting jika ada konflik.

### Dataset Balance

Pastikan jumlah window per kelas seimbang (rasio 1:1:1 atau maksimal 2:1). Dataset tidak seimbang akan bias ke kelas mayoritas.

## Replacing Dummy Data

Untuk pakai data sensor asli:

1. Kumpulkan data mentah ke `data/raw/sensor_data_YYYYMMDD.csv`
2. Format CSV wajib:
   ```
   timestamp,mq135,mq136,temp,humidity,label
   2026-09-19T08:00:00,95.2,18.3,25.1,62.5,Layak
   2026-09-19T08:00:05,96.1,18.7,25.2,62.8,Layak
   ...
   ```
3. Edit path di `extract_features.py` line 72
4. Jalankan ulang pipeline dari step 3 (extract features)
5. **JANGAN ubah kode** - hanya ganti file data

## Performance Metrics

### Test Set (60 samples, balanced)

```
                  precision  recall  f1-score  support
Layak                1.0000  1.0000    1.0000       20
Perlu Diperiksa      1.0000  1.0000    1.0000       20
Tidak Layak          1.0000  1.0000    1.0000       20

accuracy                                1.0000       60
macro avg            1.0000  1.0000    1.0000       60
weighted avg         1.0000  1.0000    1.0000       60
```

**Note**: Hasil 100% karena data dummy terpisah sempurna. Data asli kemungkinan 85-95%.

### Confusion Matrix

```
                  Pred: Layak  Pred: Perlu  Pred: Tidak
True: Layak              20            0            0
True: Perlu               0           20            0
True: Tidak               0            0           20
```

## Known Limitations

1. **Dataset dummy**: Belum pakai data sensor asli dari eksperimen fisik
2. **TFLite inference**: Firmware pakai stub, perlu integrasi EloquentTinyML
3. **Timestamp**: Firmware pakai millis(), belum sync NTP
4. **Server**: Endpoint dummy, perlu backend REST API + database
5. **Kalibrasi sensor**: MQ-135/136 belum dikalibrasi ke ppm absolut
6. **Cross-food**: Model belum ditest untuk berbagai jenis makanan (karbohidrat/protein/buah)

## Next Steps

### For ML Pipeline (DONE)
- [x] Setup struktur folder
- [x] Generate dummy data
- [x] Feature extraction
- [x] Normalization + split
- [x] Training MLP
- [x] Evaluation
- [x] Convert TFLite + C array
- [x] End-to-end verification

### For Firmware (PARTIAL)
- [x] Skeleton code ESP32
- [x] Sensor reading (MQ-135, MQ-136, SHT31)
- [x] Feature extraction on-device
- [x] Normalization with scaler params
- [ ] TFLite Micro inference integration
- [ ] Test dengan hardware fisik
- [ ] Power optimization (deep sleep)

### For Deployment
- [ ] Kumpulkan data asli dari 9 sampel makanan
- [ ] Re-train dengan data asli
- [ ] Validasi cross-food (test antar kategori)
- [ ] Setup backend server + database
- [ ] Build dashboard monitoring
- [ ] Field testing distribusi MBG

## Troubleshooting

### Model overfit pada training
- Tambah dropout layer (0.2-0.3)
- Reduce epochs
- Augment data dengan noise

### Akurasi test rendah
- Cek class balance dataset
- Cek konsistensi labeling
- Cek scaler params match antara train/inference

### TFLite inference beda dengan Keras
- Cek quantization effect (test before/after)
- Cek normalisasi sama persis
- Cek input dtype (float32)

### ESP32 memory overflow
- Reduce arena size di TFLite
- Pakai PSRAM jika available
- Simplify model (6 neuron hidden)

## References

- Proposal PKM-KC SIGAP MBG
- TensorFlow Lite Micro: https://www.tensorflow.org/lite/microcontrollers
- EloquentTinyML: https://github.com/eloquentarduino/EloquentTinyML
- MQ-135 Datasheet
- MQ-136 Datasheet
- SHT31 Datasheet

## License

Proyek PKM-KC 2026
Tim SIGAP MBG

## Contact

Untuk pertanyaan teknis ML pipeline, hubungi maintainer repo ini.
