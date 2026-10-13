# 🚀 SIGAP MBG - Repository Structure & Quick Start

Repository final setelah cleanup dan reorganisasi. Ready untuk distribution via GitHub.

---

## 📂 Struktur Repository

```
pkmsigapmbg/
├── .gitignore                  # Ignore patterns (credentials, IDE, temp files)
├── README.md                   # Dokumentasi utama (comprehensive)
├── PROJECT_STATUS.md           # Status sistem & komponen
├── requirements.txt            # Python dependencies
├── verify_pipeline.py          # ML pipeline verification script
│
├── datasettim/                 # ✅ Data asli dari tim hardware
│   ├── Baseline.xlsx           # Data kondisi fresh
│   ├── 1 Hari.xlsx            # Data 12 jam + 24 jam
│   ├── akuisisiData_MBG_arduino.ino  # Reference code
│   └── SIGAP_MBG_OPENCODE_BRIEF.md
│
├── data/                       # Processed datasets
│   └── processed/
│       ├── feature_dataset.csv
│       └── *_normalized*.csv
│
├── models/                     # ✅ Trained models
│   ├── sigap_mbg_mlp_real_b.h5      # Keras model
│   ├── sigap_mbg_mlp_real_b.tflite  # TFLite quantized
│   ├── scaler_params_real.json      # Normalization params
│   └── *.json (metrics)
│
├── src/                        # ✅ ML training pipeline
│   ├── data_collection/
│   ├── feature_extraction/
│   ├── preprocessing/
│   └── model/
│
├── firmware/esp32/             # ✅ ESP32 firmware (production ready)
│   ├── src/main.cpp            # Main firmware (3000+ lines)
│   ├── platformio.ini          # PlatformIO config
│   ├── model_data_real.h       # TFLite model embedded (3048 bytes)
│   ├── sensor_config.h         # Pin definitions
│   ├── include/
│   │   └── secrets.example.h   # Template for credentials
│   ├── test/                   # Test executables
│   ├── README.md               # Firmware docs
│   ├── README_HARDWARE_TEST.md # Hardware test guide (detailed)
│   └── HARDWARE_CHECKLIST.md   # Quick reference checklist
│
├── sigap-mbg-dashboard/        # ✅ Web dashboard (production ready)
│   ├── backend/
│   │   ├── src/                # Express app
│   │   ├── migrations/         # Database schema
│   │   ├── .env.example        # Environment template
│   │   └── package.json
│   └── frontend/
│       ├── views/              # EJS templates
│       ├── public/             # CSS, JS, assets
│       └── test-consistency.html
│
├── docs/                       # ✅ Organized documentation
│   ├── setup/                  # Setup guides
│   │   ├── SYSTEM_ANALYSIS_REPORT.md
│   │   ├── INSTALL_MYSQL_GUIDE.md
│   │   ├── COMPLETE_SETUP_SUMMARY.md
│   │   ├── SUCCESS_VALIDATION_REPORT.md
│   │   └── FINAL_SETUP_REPORT.md
│   ├── frontend/               # Frontend docs
│   │   ├── FRONTEND_FIX_COMPLETE.md
│   │   ├── CONSISTENCY_VALIDATION_REPORT.md
│   │   └── CONSISTENCY_GUARANTEE.md
│   ├── ml/                     # ML docs
│   │   └── ML_PREDICTION_CONSISTENCY.md
│   ├── ML_Pipeline_SIGAP_MBG.md
│   ├── Web_Dashboard_SIGAP_MBG.md
│   ├── VALIDATION_REPORT.md
│   └── SKILLS_INSTALLATION_SUMMARY.md
│
└── tools/                      # Utilities (empty for now)
```

---

## ✅ Status Komponen

| Komponen | Status | Keterangan |
|----------|--------|------------|
| **ML Pipeline** | ✅ Complete | 60 real readings, model trained & validated |
| **Firmware ESP32** | ✅ Ready | Compiled successfully, awaiting hardware test |
| **Backend API** | ✅ Production | 22/22 tests passed, 60 readings imported |
| **Frontend Dashboard** | ✅ Production | Responsive, validated, Indonesian labels |
| **Documentation** | ✅ Complete | Setup guides, hardware test docs, API docs |

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YourUsername/pkmsigapmbg.git
cd pkmsigapmbg
```

### 2. Setup ML Pipeline (Python)
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Verify pipeline
python verify_pipeline.py
```

### 3. Setup Backend (Node.js + MySQL)
```bash
# Install MySQL 8.0
# Create database: sigap_mbg

cd sigap-mbg-dashboard/backend
cp .env.example .env
# Edit .env: DB_PASSWORD, DB_NAME, etc.

npm install
npm start  # Server runs on port 3000
```

### 4. Setup Frontend
```bash
# Frontend served by backend
# Open browser: http://localhost:3000
```

### 5. Setup ESP32 Firmware
```bash
cd firmware/esp32
cp include/secrets.example.h include/secrets.h
# Edit secrets.h: WiFi credentials, API endpoint

pio run -t upload
pio device monitor
```

**📖 Detailed guides:**
- ML Pipeline: `README.md` (section: Cara Menjalankan)
- Backend/Frontend: `sigap-mbg-dashboard/README.md`
- ESP32 Hardware: `firmware/esp32/README_HARDWARE_TEST.md`
- Setup troubleshooting: `docs/setup/`

---

## 🔐 Security Notes

**Files yang TIDAK di-commit (sudah di .gitignore):**
- `firmware/esp32/include/secrets.h` - WiFi & API credentials
- `sigap-mbg-dashboard/backend/.env` - Database credentials
- `.opencode/`, `.specify/` - IDE files (444 MB)
- Test files, logs, temporary files

**Template yang disediakan:**
- `secrets.example.h` - Copy ke `secrets.h` dan isi credentials
- `.env.example` - Copy ke `.env` dan isi database config

**⚠️ Jangan commit credentials ke GitHub!**

---

## 📊 Data & Model Info

### Dataset
- **Source:** Tim hardware (real sensor readings)
- **Size:** 60 readings (Baseline + 1 Hari)
- **Sensors:** MQ-135 (NH₃), MQ-3 (Alcohol), HTU21D (Temp/Humidity)
- **Location:** `datasettim/` (Excel files), `data/processed/` (CSV processed)

### Model
- **Type:** MLP (Multi-Layer Perceptron)
- **Architecture:** 8 → 12 → 8 → 3
- **Parameters:** 239 total
- **Size:** 3048 bytes (TFLite quantized)
- **Classes:** layak, perlu_diperiksa, tidak_layak
- **Location:** `models/sigap_mbg_mlp_real_b.tflite`

---

## 🧪 Testing

### Verify ML Pipeline
```bash
python verify_pipeline.py
# Should output: Pipeline verification complete
```

### Test Backend API
```bash
cd sigap-mbg-dashboard/backend
node test-dummy-data.js
# Should create test readings in database
```

### Test Frontend
```bash
# Start backend first
npm start

# Open browser
# http://localhost:3000 - Should show dashboard
```

### Test ESP32 (Hardware Required)
```bash
cd firmware/esp32
pio run -t upload
pio device monitor

# Follow checklist: HARDWARE_CHECKLIST.md
```

---

## 📁 Files for Ketua Tim (Hardware Test)

**Essential files untuk test ESP32:**
1. `firmware/esp32/src/main.cpp` - Main firmware code
2. `firmware/esp32/platformio.ini` - Build configuration
3. `firmware/esp32/model_data_real.h` - Model weights
4. `firmware/esp32/include/secrets.example.h` - Credentials template
5. `firmware/esp32/README_HARDWARE_TEST.md` - **START HERE**
6. `firmware/esp32/HARDWARE_CHECKLIST.md` - Quick reference

**Panduan lengkap:** `firmware/esp32/README_HARDWARE_TEST.md`

---

## 🔄 Development Workflow

### Adding More Data
```bash
# Put new Excel files in datasettim/
# Run import script (if exists) or manual CSV conversion
# Re-train model:
python src/feature_extraction/extract_features.py
python src/preprocessing/normalize.py
python src/model/train.py
python src/model/convert_tflite.py
```

### Updating Firmware
```bash
cd firmware/esp32
# Edit main.cpp or model_data_real.h
pio run -t upload
```

### Updating Dashboard
```bash
cd sigap-mbg-dashboard/backend
# Edit src/ files
npm start  # Auto-restart with nodemon if configured
```

---

## 🐛 Troubleshooting

### ML Pipeline Issues
- Missing dependencies: `pip install -r requirements.txt`
- TensorFlow errors: Check Python version (3.8-3.11 recommended)
- Data not found: Check `data/processed/` directory

### Backend Issues
- MySQL connection failed: Verify `.env` credentials
- Port 3000 in use: Change PORT in `.env`
- Migrations failed: Check `migrations/init.sql`

### Frontend Issues
- Dashboard not loading: Verify backend running on port 3000
- No data shown: Check if database has readings
- CORS errors: Backend and frontend must be on same origin

### ESP32 Issues
- Upload failed: Press BOOT button, check USB driver
- WiFi not connecting: Verify SSID/password, use 2.4GHz
- Sensors not reading: Check wiring, VCC voltages (5V for MQ, 3.3V for HTU21D)

**Detailed troubleshooting:** `firmware/esp32/README_HARDWARE_TEST.md`

---

## 📞 Support

**Documentation:**
- Main README: `README.md`
- Setup guides: `docs/setup/`
- ML docs: `docs/ml/`
- Hardware test: `firmware/esp32/README_HARDWARE_TEST.md`

**Contact:**
- Tim PKM-KC SIGAP MBG
- Developer: Mahdi Habibi

---

## 📝 License

Proyek PKM-KC 2026

---

**Repository ready untuk GitHub distribution! 🎉**

Sistem complete dari sisi software. Hardware test adalah next blocker.
