#include <Arduino.h>
#include <Wire.h>
#include "Adafruit_HTU21DF.h" // Library untuk sensor GY-21 (HTU21D)

// Inisialisasi Objek Sensor GY-21
Adafruit_HTU21DF htu = Adafruit_HTU21DF();

// Definisi Pin ADC ESP32
#define PIN_MQ135 34
#define PIN_MQ3   35

// Nilai Resistor Load (RL) standar modul sensor (kOhm)
const float RL_MQ135 = 0.86;  
const float RL_MQ3   = 1.0; 

// Nilai Resistor Rangkaian Pembagi Tegangan (kOhm)
const float R1 = 1.0; 
const float R2 = 2.0; 

// Hasil Kalibrasi Ro
const float RO_MQ135 = 14.1; 
const float RO_MQ3   = 1.3; 

// Fungsi membaca Rs sensor
float getRs(int pin, float RL) {
  int adcVal = analogRead(pin);
  
  // Tegangan pada ADC ESP32 (0 - 3.3V)
  float vAdc = (adcVal / 4095.0) * 3.3;
  
  // Tegangan asli sensor sebelum pembagi tegangan (0 - 5V)
  float vOutSensor = vAdc * ((R1 + R2) / R2);
  
  // Batas keamanan data
  if (vOutSensor <= 0) vOutSensor = 0.01;
  if (vOutSensor >= 5.0) vOutSensor = 4.99;
  
  // Rumus pembagi tegangan (dikoreksi sintaks operator -)
  return ((5.0 - vOutSensor) / vOutSensor) * RL;
}

void setup() {
  Serial.begin(115200);
  
  // Konfigurasi presisi ADC ESP32 (12-bit: 0-4095)
  analogReadResolution(12);
  
  // Inisialisasi Bus I2C ESP32 (SDA = GPIO 21, SCL = GPIO 22)
  Wire.begin(21, 22);

  // Inisialisasi Sensor GY-21
  if (!htu.begin()) {
    while (1); // Berhenti jika sensor GY-21 gagal diinisialisasi
  }
}

void loop() {
  // 1. Baca Suhu dan Kelembapan dari GY-21
  float temp     = htu.readTemperature();
  float humidity = htu.readHumidity();

  // 2. Variable Akumulasi Sampling PPM dan mg/L
  float ppm_nh3_sum     = 0;
  float mgl_alcohol_sum = 0;
  const int total_samples = 1000;

  // Sampling 1000 kali pembacaan PPM & mg/L selama total durasi ~3 detik
  for (int i = 0; i < total_samples; i++) {
    // A. Baca Rs real-time per sampel
    float rs_135 = getRs(PIN_MQ135, RL_MQ135);
    float rs_3   = getRs(PIN_MQ3, RL_MQ3);
    
    // B. Hitung Rasio Rs/Ro per sampel
    float ratio_135 = rs_135 / RO_MQ135;
    float ratio_3   = rs_3 / RO_MQ3;

    // C. Hitung & akumulasikan nilai PPM NH3 dan mg/L Alkohol per sampel (dikoreksi operator *)
    ppm_nh3_sum     += 102.2 * pow(ratio_135, -2.473);
    mgl_alcohol_sum += 0.40 * pow(ratio_3, -1.431);

    // Jeda per sampel (2.8 ms x 1000 ≈ 2.8-3 detik total)
    delayMicroseconds(2800); 
  }

  // 3. Hitung Rata-Rata Hasil Sampling PPM & mg/L
  float ppm_nh3     = ppm_nh3_sum / total_samples;
  float mgl_alcohol = mgl_alcohol_sum / total_samples;

  // 4. Format Output Khusus Excel Data Streamer (CSV)
  // Format: CH1,CH2,CH3,CH4
  Serial.print(ppm_nh3, 2);       // CH1: Amonia (ppm)
  Serial.print(",");              
  Serial.print(mgl_alcohol, 3);   // CH2: Alkohol (mg/L)
  Serial.print(",");              
  Serial.print(temp, 2);          // CH3: Suhu (°C)
  Serial.print(",");              
  Serial.println(humidity, 2);    // CH4: Kelembaban (%RH)
}