# SIGAP MBG: Brief untuk OpenCode Plan Agent

> Kamu adalah **Plan Agent** di OpenCode. Tugas utamamu di sesi ini adalah **membuat rencana kerja yang komprehensif**, bukan langsung menulis atau mengubah kode. Baca seluruh file ini sebelum melakukan apa pun.

Lingkungan: **Windows, PowerShell** (bukan bash). Bahasa komunikasi dengan user: **Bahasa Indonesia**. Istilah teknis boleh tetap berbahasa Inggris.

---

## 0. Aturan kerja (wajib)

1. **Jangan menebak.** Kalau ada informasi yang belum jelas, tanyakan ke user (lihat bagian 8). Kalau ada langkah gagal, laporkan pesan error aslinya.
2. **Verifikasi sendiri semua klaim di file ini terhadap data dan repo yang sebenarnya.** Angka dan struktur dataset di bawah adalah ringkasan awal dari user dan asisten lain. Itu titik awal, bukan kebenaran mutlak.
3. **Jangan mengarang metrik.** Setiap angka akurasi, F1, ukuran model, atau latensi yang dilaporkan harus berasal dari eksekusi nyata.
4. **Perubahan bersifat bedah (surgical).** Ubah seminimal mungkin file yang sudah ada. Jangan refactor di luar tujuan. Jangan hapus atau menimpa dataset asli.
5. **Jangan commit atau menyimpan secret** (password Wi-Fi, token API, kredensial broker). Pakai file konfigurasi yang masuk `.gitignore` dan sediakan file contoh (`secrets.example.h`, `.env.example`).
6. **Sebelum perintah yang mengubah isi folder project** (misalnya `specify init`), minta konfirmasi user dan sarankan `git commit` terlebih dahulu supaya mudah dibatalkan.
7. Sesi ini berhenti setelah **rencana disetujui user**. Eksekusi dilakukan setelah itu, bukan di sesi planning.

---

## 1. Skills yang wajib dipakai

Jalankan `/skills` dan **gunakan semua skill yang tersedia dan relevan** untuk menunjang pekerjaan ini. Tiga yang wajib secara eksplisit:

| Skill | Cara memakainya |
|-------|-----------------|
| `antislop` | Terapkan pada semua teks yang kamu tulis: rencana, dokumentasi, komentar kode, pesan commit, dan README. Tulisan harus padat, spesifik, tanpa basa-basi dan tanpa frasa generik khas AI. |
| `karpathy-guidelines` (andrej-karpathy-skills) | Pegang empat prinsipnya: **think before coding** (nyatakan asumsi, tanyakan bila ragu), **simplicity first** (solusi paling sederhana yang cukup), **surgical changes** (sentuh hanya yang perlu), **goal-driven execution** (tiap tugas punya kriteria sukses yang bisa diverifikasi). |
| `spec-kit` (`speckit.*`) | Susun pekerjaan dengan alur spec-driven development: `/speckit.constitution` → `/speckit.specify` → `/speckit.plan` → `/speckit.tasks`. `/speckit.implement` hanya dijalankan setelah user menyetujui. |

Catatan:
- Cek dulu apakah folder `.specify/` sudah ada di project. Kalau belum, `specify init --here --ai opencode --script ps` mengubah isi folder, jadi **minta konfirmasi user dulu**. Jangan pakai `--force` atau `--offline` tanpa persetujuan.
- Kalau nama skill di `/skills` sedikit berbeda dari tabel di atas, pakai yang paling cocok dan sebutkan nama aslinya di laporanmu.

---

## 2. Konteks proyek

**SIGAP MBG / Smart MBG Lid** (PKM-KC): modul yang dipasang di **tutup ompreng** program Makan Bergizi Gratis (MBG). Modul membaca gas dan kondisi lingkungan di dalam ompreng, mengklasifikasikan kesegaran makanan **langsung di perangkat (TinyML / edge inference)**, lalu mengirim hasilnya ke **dashboard IoT secara realtime**.

Alur target:

```
Sensor gas + suhu/kelembapan -> ESP32 (preprocess + inferensi ML on-device)
        -> kirim hasil via Wi-Fi -> backend/broker -> web dashboard (realtime)
```

Perangkat keras final (dikonfirmasi tim, 11 Okt 2026): **ESP32-WROOM**, sensor gas **MQ-135** (kolom `NH3`) dan **MQ-3** (kolom `Alkohol`), serta **GY-21 (HTU21D)** untuk suhu dan kelembapan sebagai pengganti SHT21 di proposal. **Tidak ada MQ-136 dan tidak ada SHT31.** Model hanya boleh memakai 4 fitur yang ada di dataset (`NH3`, `Alkohol`, `Temp`, `Humid`).

Kelas keluaran yang direncanakan: **Layak / Perlu Diperiksa / Tidak Layak**, dengan model MLP kecil.

Repo proyek (ML + web dashboard + firmware): https://github.com/MahdiHbb1/pkmsigapmbg.git. Repo mungkin sudah ada di folder kerja sekarang. **Jelajahi struktur repo terlebih dahulu** (read-only): kode ML yang ada, dashboard web, firmware, README, dan dependensi.

---

## 3. Dataset (folder `dataset/`)

Baca file di folder `dataset/` sendiri dengan pandas/openpyxl. Jangan mengandalkan ringkasan ini saja.

### 3.1 File dan sheet

| File | Sheet berguna | Keterangan dari user |
|------|---------------|----------------------|
| `Baseline.xlsx` | `Baseline` | Kondisi awal sekali, makanan belum diapa-apain dan belum basi |
| `1_Hari.xlsx` | `hari 1` | Makanan setelah **24 jam** |
| `1_Hari.xlsx` | `12 jam` | Makanan setelah **12 jam** |

Sheet `Data In`, `Data Out`, `Settings`, `Manifest` adalah artefak Excel Data Streamer (sumber: `USB-Enhanced-SERIAL CH9102 (COM5)`, baud 115200). `Data In` berisi data yang sama dengan sheet utama **plus timestamp**. `Data Out`, `Settings`, `Manifest` bukan data latih.

Kolom: `NH3`, `Alkohol`, `Temp`, `Humid`. Kolom pertama di sheet `Baseline` kosong. Di sheet `hari 1` kolom pertama adalah timestamp berformat serial Excel.

### 3.1a Konfirmasi dari tim (11 Okt 2026)

- Sensor: `NH3` = MQ-135, `Alkohol` = MQ-3. Perangkat final: ESP32-WROOM, MQ-135, MQ-3, GY-21 (HTU21D, pengganti SHT21). Tanpa MQ-136.
- Kode Arduino pengambil data **sudah diterima**: `akuisisiData_MBG_arduino.ino`. Ringkasannya ada di 3.1b. Baca file aslinya.
- Wadah sama di semua sesi, direkam di ruangan tertutup, makanan disimpan dalam kondisi tertutup.
- **Sesi Baseline dan sesi 24 jam berasal dari satu batch makanan yang sama. Sesi 12 jam berasal dari batch lain** (batch 12 jam terlewat dibuat, jadi direkam dari batch terpisah).
- Sensor sudah dikalibrasi selama sekitar 2 hari. Menurut tim, setelah terkalibrasi, pemanasan 30 menit sudah cukup untuk sesi berikutnya. Belum jelas apakah sensor menyala terus di antara sesi.
- Label ditentukan **murni dari lama penyimpanan sejak selesai dimasak**, bukan dari bau, tampilan, atau uji lab. Baseline = Layak sudah dikonfirmasi. Nama kelas untuk 12 jam dan 24 jam (Perlu Diperiksa dan Tidak Layak) masih asumsi.
- **Tim tidak berencana mengambil data tambahan.** Rencanakan dengan 3 sesi ini saja.

### 3.1b Cara data direkam (dari `akuisisiData_MBG_arduino.ino`)

Pastikan file `.ino` itu ada di project (misalnya di folder dataset). Baca file aslinya. Ringkasan ini hanya penunjuk, dan kalau ada beda, file asli yang benar.

- Keluaran serial 115200 baud berupa CSV 4 kolom per baris: CH1 NH3 (**ppm**, 2 desimal), CH2 Alkohol (**mg/L**, 3 desimal), CH3 suhu (°C, 2 desimal), CH4 kelembapan (%RH, 2 desimal). Nilai di dataset sudah dibulatkan seperti itu.
- Pin: MQ-135 di GPIO34, MQ-3 di GPIO35 (keduanya ADC1), ADC 12-bit. Keluaran modul gas (0 sampai 5 V) turun ke ADC lewat pembagi tegangan R1 = 1 kΩ dan R2 = 2 kΩ, lalu dikalikan 1,5 lagi di kode. GY-21 lewat I2C (SDA GPIO21, SCL GPIO22), library `Adafruit_HTU21DF`.
- Rs = ((5 − Vsensor) / Vsensor) × RL, dengan RL MQ-135 = 0,86 kΩ dan RL MQ-3 = 1,0 kΩ. Vsensor dibatasi 0,01 sampai 4,99 V. Ro hasil kalibrasi: MQ-135 = 14,1 dan MQ-3 = 1,3.
- Konversi per sampel: NH3 (ppm) = 102,2 × (Rs/Ro)^−2,473 dan Alkohol (mg/L) = 0,40 × (Rs/Ro)^−1,431.
- **Satu baris dataset** = 1000 sampel dalam sekitar 3 detik (jeda 2,8 ms per sampel). Tiap sampel **dikonversi ke ppm atau mg/L dulu, baru dirata-rata** (bukan rata-rata ADC lalu konversi). Suhu dan kelembapan dibaca **sekali** per siklus dan tidak dirata-rata. Itu sebabnya interval antar baris sekitar 3,09 detik.
- Tidak ada filter atau smoothing lain, dan tidak ada jeda pemanasan (warm-up) di kode.
- Nilai ppm dan mg/L berasal dari kurva umum datasheet dengan Ro hasil kalibrasi, jadi anggap sebagai indeks relatif antar-kondisi, bukan pengukuran absolut yang akurat. Data ADC mentah tidak ada di dataset.

**Konsekuensi untuk inferensi di ESP32:** firmware harus mereplikasi siklus ini persis (1000 sampel, konversi per sampel, rata-rata, nilai Ro dan koefisien yang sama, pembulatan yang sama). Kalau tidak, nilai fitur bergeser dari data latih. Ro bergantung pada unit sensor fisik, jadi kalau sensor diganti atau dikalibrasi ulang, model harus dicek ulang.

### 3.2 Ringkasan awal (hasil inspeksi cepat, **verifikasi ulang**)

Tiap kondisi punya **1000 baris**, tanpa nilai kosong, interval sampling nyata sekitar **3,09 detik** (bukan 150 ms seperti di `Settings`), sehingga satu sesi rekaman sekitar 51 menit.

| Kondisi | NH3 (mean ± std) | Alkohol (mean) | Temp °C (mean) | Humid % (mean) | Waktu rekam |
|---------|------------------|----------------|----------------|----------------|-------------|
| Baseline | 1,74 ± 0,07 | 0,001 | 33,5 | 56,4 | 2026-10-07 22:11 s.d. 23:02 |
| 12 jam | 2,98 ± 0,40 | 0,002 | 35,5 | 48,5 | 2026-10-09 14:05 s.d. 14:56 |
| 24 jam (`hari 1`) | 16,2 ± 9,8 | 0,006 | 33,3 | 88,8 | 2026-10-08 19:03 s.d. 19:54 |

### 3.3 Risiko data yang harus masuk ke rencana

1. **Hanya 3 sesi rekaman, satu sesi per kelas.** Model bisa belajar "ini sesi yang mana" (suhu ruangan hari itu, kondisi sensor) dan bukan "makanan ini segar atau basi". Split acak per baris akan **membocorkan data** dan memberi akurasi mendekati 100% yang menyesatkan.
2. **Temp dan Humid kemungkinan bercampur dengan kondisi lingkungan.** Humid 12 jam (48%) lebih rendah dari baseline (56%) padahal NH3-nya lebih tinggi, jadi polanya tidak monoton terhadap umur makanan. Suhu 12 jam juga paling tinggi (35,5 °C). Lakukan ablation: model dengan semua fitur versus hanya fitur gas.
3. **Sesi 12 jam berasal dari batch makanan yang berbeda** (dikonfirmasi tim). Jadi data tidak membentuk satu urutan penuaan yang bersih: Baseline dan 24 jam satu batch, 12 jam terpisah dan direkam setelahnya dengan kondisi ruangan yang berbeda (suhu paling tinggi, humid paling rendah). Perbedaan 12 jam terhadap kelas lain bercampur antara efek umur makanan dan efek batch/ruangan. Perlakukan 12 jam sebagai kelas yang paling rapuh, beri peringatan jelas di hasil evaluasi, dan cantumkan sebagai keterbatasan terbuka. Tim tidak berencana merekam ulang, jadi jangan menjadikannya syarat.
4. **Sesi 24 jam tidak stasioner.** NH3 mulai sekitar 55 lalu turun ke kisaran 15 sampai 20 dalam satu sesi (rata-rata 100 baris pertama 22,1 vs 100 baris terakhir 15,2). Humid juga turun dari sekitar 95% ke 84%. Tim menyebut sensor sudah dikalibrasi sekitar 2 hari dan pemanasan 30 menit dianggap cukup, jadi pemanasan sensor bukan penjelasan yang pasti. Selidiki apakah ini efek adaptasi sensor terhadap kelembapan tinggi (Humid 95%), wadah yang baru dibuka, atau perubahan nyata. Putuskan dengan data cara menanganinya (misalnya membuang segmen awal), dan catat alasannya.
5. **Resolusi Alkohol kasar** (0,001 sampai 0,011 mg/L) karena kolom ini dicetak dengan 3 desimal, jadi hampir terkuantisasi. Hati-hati dengan scaling dan fitur turunan. Untuk paritas, firmware sebaiknya membulatkan fitur ke desimal yang sama dengan data latih (NH3 2, Alkohol 3, Temp 2, Humid 2).
6. **Pipeline konversi sensor sudah diketahui (3.1b), tapi bergantung pada unit sensor fisik.** Ro dan koefisien hanya valid untuk sensor yang dikalibrasi tim. Kode inferensi di ESP32 wajib memakai konversi dan rata-rata yang **identik** dengan saat data direkam.
7. **Ukuran sampel kecil.** 3000 baris yang sangat berkorelasi dalam waktu, efektifnya jauh lebih sedikit. Model kecil dan sederhana lebih masuk akal daripada model besar.

---

## 4. Tujuan dan deliverables

Rencanamu harus mencakup enam deliverable berikut, masing-masing dengan kriteria sukses yang bisa diverifikasi.

**D1. Eksplorasi dan validasi data**
Muat dataset, bersihkan, verifikasi ringkasan di bagian 3, buat plot (distribusi per kelas, deret waktu per sesi), dan putuskan perlakuan untuk risiko di 3.3. Simpan data bersih dalam format yang mudah dibaca skrip (CSV), tanpa mengubah file asli.

**D2. Penyesuaian kode ML dan training**
Sesuaikan kode ML yang sudah ada di repo (jangan menulis ulang dari nol kecuali terbukti perlu). Persyaratan:
- Label: ditentukan dari lama penyimpanan sejak selesai dimasak. Baseline = **Layak** (dikonfirmasi). 12 jam = **Perlu Diperiksa** dan 24 jam = **Tidak Layak** masih asumsi nama kelas. Buat pemetaan label mudah diganti lewat satu konfigurasi.
- **Split berbasis blok waktu**, bukan acak per baris. Gunakan misalnya segmen waktu yang tidak tumpang-tindih (contoh: 60% awal latih, 20% validasi, 20% akhir uji per sesi, dengan jeda/gap antar blok) dan/atau cross-validation berbasis blok. Jelaskan keterbatasannya terang-terangan karena tiap kelas hanya punya satu sesi.
- Fitur: nilai mentah ditambah fitur jendela (rolling mean, std, slope untuk window sekitar 10 sampai 20 sampel, kira-kira 30 sampai 60 detik). Satu baris dataset sudah rata-rata 1000 pembacaan, jadi window dihitung di atas baris-baris itu. Bandingkan dengan dan tanpa `Temp`/`Humid`.
- Bandingkan beberapa model kecil (misalnya logistic regression, decision tree kecil, MLP kecil), laporkan akurasi, F1 per kelas, confusion matrix, ukuran model, dan estimasi latensi. Pilih yang paling sederhana yang cukup.
- Tangani kemungkinan model perlu kelas "tidak yakin" bila confidence rendah.
- Semua hasil bisa direproduksi (seed tetap, versi dependensi dicatat).

**D3. Ekspor model untuk mikrokontroler**
Konversi model terpilih ke bentuk yang berjalan di ESP32 (misalnya TFLite Micro untuk MLP, atau generasi kode C untuk model berbasis pohon). Sertakan scaler/normalisasi sebagai konstanta di kode. Verifikasi bahwa keluaran model di PC dan di versi yang diekspor **sama** pada set sampel uji (paritas), dan laporkan penggunaan flash dan RAM.

**D4. Firmware ESP32 siap inject**
Kode yang bisa diunggah ke sensor/ESP32 (Arduino IDE atau PlatformIO, ikuti yang sudah dipakai di repo). Cakupan:
- Baca MQ-135 (GPIO34), MQ-3 (GPIO35), dan GY-21 (HTU21D, I2C GPIO21/22) lewat library `Adafruit_HTU21DF`. Firmware lama di repo memakai MQ-136 dan SHT31, jadi bagian itu **diganti**. Pin gas tetap di ADC1 (aman dipakai bersama Wi-Fi). Tambahkan waktu pemanasan sensor gas (sekitar 30 menit menurut tim) dan penanganan kegagalan baca.
- Replikasi siklus akuisisi di 3.1b persis (1000 sampel, konversi per sampel, rata-rata, Ro dan koefisien yang sama, pembulatan sama), lalu windowing identik dengan training.
- Inferensi on-device dan keluaran kelas + confidence.
- Koneksi Wi-Fi dengan reconnect otomatis, dan buffer data saat offline bila memungkinkan.
- Pengiriman hasil realtime ke dashboard (bagian D5).
- Konfigurasi (SSID, kredensial, device ID, interval kirim) dipisah dari logika.
- Indikator status sederhana di perangkat (LED/serial log) untuk debugging.

**D5. Integrasi dashboard realtime**
Pelajari dashboard web yang sudah ada, lalu bandingkan opsi transport di rencana (MQTT, HTTP POST, WebSocket/SSE, atau layanan realtime seperti Firebase/Supabase) berdasarkan stack yang sudah ada, kemudahan deploy, dan kebutuhan demo (termasuk demo via GitHub Pages bila tetap dipakai). Rekomendasikan satu dan jelaskan alasannya. Dashboard minimal menampilkan: status kesegaran terkini (Layak/Perlu Diperiksa/Tidak Layak) beserta confidence, nilai sensor realtime, grafik tren, riwayat, dan status koneksi perangkat.

Contoh payload awal (boleh disesuaikan di rencana):

```json
{
  "device_id": "sigap-lid-01",
  "ts": "2026-10-11T08:30:00Z",
  "nh3": 1.74,
  "alcohol": 0.001,
  "temp_c": 33.5,
  "humidity_pct": 56.4,
  "label": "layak",
  "confidence": 0.93,
  "probs": {"layak": 0.93, "perlu_diperiksa": 0.06, "tidak_layak": 0.01},
  "fw_version": "0.1.0"
}
```

**D6. Pengujian dan dokumentasi**
Uji end-to-end (simulasi data tanpa perangkat dulu, lalu dengan perangkat nyata), uji paritas model, dan uji ketahanan koneksi (Wi-Fi putus, broker mati). Perbarui README: kerangka ML, kerangka web, alur data ke dashboard, dan diagram arsitektur.

---

## 5. Alur kerja untuk sesi ini

**Fase 0: eksplorasi (read-only).** Telusuri repo, baca dataset, jalankan inspeksi yang tidak mengubah apa pun. Catat apa yang sudah ada dan apa yang belum.

**Fase 1: klarifikasi.** Rangkum asumsi dan pertanyaan terbuka (bagian 8) dan tanyakan ke user. Jangan melanjutkan ke rencana final dengan asumsi yang bisa mengubah desain secara besar.

**Fase 2: spec-driven.** Setelah klarifikasi, susun artefak lewat `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` (dengan konfirmasi user bila perlu `specify init`).

**Fase 3: rencana final untuk persetujuan.** Sajikan rencana dengan format di bagian 7, lalu **berhenti dan tunggu persetujuan user**.

---

## 6. Prinsip desain

- Mulai dari yang paling sederhana yang memenuhi tujuan. Ini PKM dengan dataset kecil: model kecil yang jujur dievaluasi lebih berharga daripada model rumit dengan akurasi 100% yang tidak bisa dipertanggungjawabkan.
- Pisahkan tiga lapisan: pelatihan di PC, model yang diekspor, dan firmware. Format fitur dan preprocessing harus satu sumber kebenaran (satu definisi yang dipakai di training dan firmware).
- Setiap tugas di rencana punya **kriteria sukses yang bisa dicek** (perintah yang dijalankan atau angka yang diukur).
- Sebutkan secara eksplisit apa yang **belum bisa divalidasi** dengan data yang ada (generalisasi ke batch makanan lain, jenis menu lain, suhu ruangan lain, dan kelas 12 jam yang berasal dari batch berbeda). Tim tidak akan mengambil data tambahan, jadi tulis ini sebagai keterbatasan yang jujur dan jangan menjadikan data baru sebagai syarat. Pilihan desain yang membantu: keluaran dengan confidence dan kelas "tidak yakin", serta menyatakan hasil sebagai uji awal prototipe.

---

## 7. Format rencana final (output yang diminta)

1. **Ringkasan temuan**: kondisi repo, validasi dataset, dan koreksi atas ringkasan di bagian 3 bila ada.
2. **Asumsi dan keputusan** yang sudah dikonfirmasi user.
3. **Arsitektur** end-to-end (diagram teks atau Mermaid) dan pilihan transport realtime beserta alasannya.
4. **Rencana per deliverable (D1 sampai D6)**: langkah, file yang akan dibuat/diubah, kriteria sukses, dan risiko.
5. **Daftar tugas berurutan** dengan dependensi (keluaran `/speckit.tasks`), dan tandai mana yang bisa dikerjakan tanpa perangkat fisik.
6. **Strategi evaluasi** model dan batasan kejujurannya.
7. **Daftar perubahan yang akan menyentuh file existing**, supaya user bisa meninjau cakupan perubahan.
8. **Risiko dan keterbatasan** (hal yang belum bisa divalidasi), tanpa mensyaratkan data baru.

Tulis dengan skill `antislop`: ringkas, spesifik, tanpa pengulangan.

---

## 8. Status pertanyaan dan hal yang masih terbuka

**Sudah terjawab (11 Okt 2026):** perangkat keras final (ESP32-WROOM, MQ-135, MQ-3, GY-21, tanpa MQ-136), pemetaan kolom ke sensor, kode akuisisi dan rumus konversi (3.1b), filtering (rata-rata 1000 sampel per sekitar 3 detik), dasar label (lama penyimpanan sejak selesai dimasak), batch tiap sesi, kalibrasi sensor, dan tidak ada data tambahan.

**Masih terbuka.** Tanyakan hanya yang belum bisa kamu simpulkan dari repo. Kalau user belum tahu, catat sebagai asumsi terbuka di rencana.

1. **Stack dashboard dan hosting:** Express + MySQL + EJS sudah ada di repo. Apakah dijalankan lokal atau sudah di-hosting (Railway/Render, dll.)? Perlu diketahui sebelum memilih transport realtime.
2. **Konektivitas dan daya** di skenario penggunaan nyata: ada Wi-Fi atau tidak, dan sumber dayanya apa?
3. **Nama kelas** untuk 12 jam dan 24 jam (asumsi: Perlu Diperiksa dan Tidak Layak) bila user ingin mengubahnya.

---

## 9. Definition of done (untuk fase eksekusi nanti)

- Training bisa dijalankan ulang dari nol dengan satu perintah terdokumentasi dan menghasilkan metrik yang sama.
- Model terekspor lolos uji paritas terhadap versi PC.
- Firmware ter-compile tanpa error dan berjalan di ESP32 (atau tersimulasi, bila perangkat belum tersedia), dengan ukuran flash/RAM yang dilaporkan.
- Data dari perangkat (atau simulator) tampil di dashboard secara realtime, termasuk status koneksi.
- README diperbarui, tidak ada secret yang ter-commit, dan semua klaim performa punya bukti eksekusi.