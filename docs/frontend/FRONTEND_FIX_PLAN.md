# 🔧 ANALISIS MASALAH & RENCANA PERBAIKAN SISTEM SIGAP MBG

**Tanggal:** 14 Oktober 2026, 01:20 WIB  
**Status:** SISTEM PERLU KOREKSI MAJOR

---

## ❌ MASALAH YANG DITEMUKAN

### 1. **Data Device Tidak Sesuai**
- ❌ Device test (SIGAP-TEST-01) mengacaukan tampilan
- ✅ Device asli (SIGAP-MBG-01) belum ada data real
- Layout grid tidak proper (device test dan SIGAP-MBG-01 tercampur)

### 2. **Dataset Tim Belum Digunakan**
```
datasettim/
├── Baseline.xlsx          ❌ BELUM DIGUNAKAN
├── 1 Hari.xlsx           ❌ BELUM DIGUNAKAN  
├── akuisisiData_MBG_arduino.ino
└── SIGAP_MBG_OPENCODE_BRIEF.md (Spesifikasi lengkap)
```

### 3. **Schema Database Salah**
- Field `mq136_*` seharusnya `alcohol_mq3_*` (sensor MQ-3)
- Tidak sesuai spek: MQ-135 (NH3), MQ-3 (Alkohol), GY-21/HTU21D

### 4. **Frontend Layout Tidak Optimal**
- Grid tidak rapi
- Label tidak jelas
- Device test dan real tercampur
- Tidak responsif untuk multi-device
- Badge warna tidak konsisten

---

## ✅ RENCANA PERBAIKAN

### FASE 1: BERSIHKAN DATA TEST (IMMEDIATE)
1. Hapus reading test dari database
2. Update device SIGAP-MBG-01 dengan data proper
3. Verifikasi device list clean

### FASE 2: IMPORT DATA ASLI TIM
1. Baca Baseline.xlsx → Label "Layak"
2. Baca 1 Hari.xlsx sheet "12 jam" → Label "Perlu Diperiksa"
3. Baca 1 Hari.xlsx sheet "hari 1" → Label "Tidak Layak"
4. Convert ke format readings database
5. Import dengan device_id = "SIGAP-MBG-01"

### FASE 3: PERBAIKI FRONTEND LAYOUT
**Target Layout:**
```
┌─────────────────────────────────────────────────────┐
│ NAVBAR: SIGAP MBG - Food Freshness Monitoring      │
├────────────┬─────────────────────────┬──────────────┤
│ SIDEBAR    │  MAIN CONTENT (CENTER)  │ TEST PANEL   │
│ Summary    │  SIGAP-MBG-01           │ (Collapsible)│
│ Stats      │  [DEVICE CARD]          │              │
│            │  - Status Badge         │ Test devices │
│ Total: 1   │  - Sensor Readings      │ (for demo)   │
│ Layak: X   │  - Confidence           │              │
│ Warning: Y │  - Last Update          │              │
│ Danger: Z  │                         │              │
└────────────┴─────────────────────────┴──────────────┘
```

**Perbaikan:**
- Main content (tengah): Device produksi (SIGAP-MBG-01)
- Right sidebar (collapsible): Test devices
- Badge warna jelas: 🟢 Hijau (Layak), 🟡 Kuning (Perlu Diperiksa), 🔴 Merah (Tidak Layak)
- Label sensor: "NH3 (MQ-135)", "Alkohol (MQ-3)", "Suhu", "Kelembapan"
- Responsive: mobile stacking, tablet 2-column

### FASE 4: VALIDASI DISPLAY
- Test tampilan desktop (1920x1080, 1366x768)
- Test tampilan tablet (768px)
- Test tampilan mobile (375px)
- Verifikasi badge color consistency
- Test SSE real-time update

---

## 🎯 SPESIFIKASI FRONTEND YANG BENAR

### Device Card Layout (Main - SIGAP-MBG-01)
```
┌─────────────────────────────────────────┐
│ SIGAP-MBG-01                            │
│ SPPG Universitas Negeri Semarang       │
│ ┌─────────────────────────────────────┐ │
│ │ STATUS: LAYAK          ✓  95%       │ │ ← Badge hijau, confidence
│ └─────────────────────────────────────┘ │
│                                         │
│ Sensor Readings:                        │
│ • NH3 (MQ-135):      3.5 ppm           │
│ • Alkohol (MQ-3):    0.001 mg/L        │
│ • Suhu:              28.5 °C           │
│ • Kelembapan:        65.3 %            │
│                                         │
│ Last Update: 2 menit yang lalu         │
│ [Lihat Detail →]                       │
└─────────────────────────────────────────┘
```

### Color Coding (Consistent)
- 🟢 **Layak** → `#dcfce7` (green-50), border `#16a34a` (green-600)
- 🟡 **Perlu Diperiksa** → `#fef9c3` (yellow-100), border `#eab308` (yellow-500)
- 🔴 **Tidak Layak** → `#fee2e2` (red-100), border `#dc2626` (red-600)
- ⚪ **No Data** → `#f3f4f6` (gray-100), border `#9ca3af` (gray-400)

### Typography
- Device Name: 20px, font-weight: 600
- Location: 14px, text-muted
- Badge Label: 16px, font-weight: 700, uppercase
- Sensor readings: 14px, line-height: 1.6

---

## 📦 FILE YANG PERLU DIUBAH

### Backend
1. ❌ TIDAK PERLU UBAH - API sudah benar
2. ✅ Database: Clean test data only

### Frontend
1. `views/overview.ejs` - Fix layout & labeling
2. `public/css/style.css` - Fix grid, colors, responsive
3. `public/js/overview.js` - Fix device filtering & display logic
4. `views/device-detail.ejs` - Update labels sensor
5. `views/alerts.ejs` - Update labels sensor

### Data
1. Import script untuk Baseline.xlsx & 1 Hari.xlsx
2. Mapping ke database readings

---

## ⚠️ PRIORITAS EKSEKUSI

**HIGH PRIORITY (Do Now):**
1. ✅ Hapus data test
2. ✅ Perbaiki frontend layout (3-column proper)
3. ✅ Update CSS untuk badge & grid
4. ✅ Import data asli tim (minimal 10 sample per kelas)

**MEDIUM PRIORITY (Next):**
1. Test responsive di berbagai device
2. Verify SSE real-time
3. Update dokumentasi

**LOW PRIORITY (Optional):**
1. Chart visualization
2. Export data feature
3. Alert notification

---

## 🎯 DEFINITION OF DONE

- [ ] Data test terhapus
- [ ] SIGAP-MBG-01 tampil di center dengan data proper
- [ ] Test devices (jika ada) di right sidebar collapsible
- [ ] Badge color konsisten & jelas
- [ ] Label sensor jelas (NH3 MQ-135, Alkohol MQ-3)
- [ ] Responsive di desktop, tablet, mobile
- [ ] Data asli tim (Baseline, 12 jam, 24 jam) terimport
- [ ] SSE update working
- [ ] Screenshot tampilan final untuk validasi

---

**Apakah Anda setuju dengan rencana ini? Saya akan eksekusi bertahap.**
