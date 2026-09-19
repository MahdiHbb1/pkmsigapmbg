// SIGAP MBG - Smart Food Freshness Detection System
// ESP32 Firmware with TFLite Micro Inference
// Part 1: Headers, Config, Globals

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "Adafruit_SHT31.h"

// TFLite model data (auto-generated)
#include "model_data.h"

// ============================================================================
// CONFIGURATION
// ============================================================================

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server endpoint
const char* SERVER_URL = "http://your-server.com/api/sensor-data";

// Device ID
const char* DEVICE_ID = "SIGAP-MBG-01";

// Sensor pins
const int MQ135_PIN = 34;  // ADC1_CH6
const int MQ136_PIN = 35;  // ADC1_CH7

// Timing
const int SAMPLE_INTERVAL_MS = 5000;     // 5 seconds between samples
const int WINDOW_SIZE = 240;              // 240 samples = 5 minutes
const int SENSOR_WARMUP_MS = 180000;     // 3 minutes warmup for MQ sensors

// LED indicators
const int LED_LAYAK = 25;          // Green - Safe
const int LED_PERLU_PERIKSA = 26;  // Yellow - Check
const int LED_TIDAK_LAYAK = 27;    // Red - Unsafe

// ============================================================================
// SCALER PARAMETERS (from training - models/scaler_params.json)
// ============================================================================

struct ScalerParams {
  float min;
  float max;
};

ScalerParams scaler[8] = {
  {50.4802, 499.3998},   // mq135_mean
  {1.9370, 76.6860},     // mq135_std
  {-0.3179, 1.1043},     // mq135_slope
  {10.4631, 99.8991},    // mq136_mean
  {0.7784, 19.6476},     // mq136_std
  {-0.0908, 0.2715},     // mq136_slope
  {22.0820, 33.8871},    // temp_mean
  {50.0237, 87.8214}     // humidity_mean
};

const char* CLASS_NAMES[] = {"Layak", "Perlu Diperiksa", "Tidak Layak"};

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

Adafruit_SHT31 sht31 = Adafruit_SHT31();

// Sensor data buffers (circular for 240 samples)
float mq135_buffer[WINDOW_SIZE];
float mq136_buffer[WINDOW_SIZE];
float temp_buffer[WINDOW_SIZE];
float humidity_buffer[WINDOW_SIZE];

int buffer_index = 0;
bool buffer_full = false;

unsigned long last_sample_time = 0;
unsigned long warmup_start_time = 0;
bool sensor_ready = false;

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================

void setupWiFi();
void setupSensors();
void setupLEDs();
void readSensors();
void processWindow();
float extractMean(float* buffer, int size);
float extractStd(float* buffer, int size, float mean);
float extractSlope(float* buffer, int size);
void normalizeFeatures(float* features, int size);
int runInference(float* features);
void sendToServer(float* features, int prediction, float confidence);
void updateLEDs(int prediction);

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("SIGAP MBG - Food Freshness Detection");
  Serial.println("========================================");
  
  setupLEDs();
  setupSensors();
  setupWiFi();
  
  // Start warmup timer
  warmup_start_time = millis();
  Serial.println("\nMQ sensors warming up (3 minutes)...");
  Serial.println("Waiting for sensors to stabilize...");
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  unsigned long current_time = millis();
  
  // Check warmup period
  if (!sensor_ready) {
    if (current_time - warmup_start_time >= SENSOR_WARMUP_MS) {
      sensor_ready = true;
      Serial.println("\n[OK] Sensors ready. Starting data collection...\n");
    } else {
      delay(1000);
      return;
    }
  }
  
  // Sample at fixed interval
  if (current_time - last_sample_time >= SAMPLE_INTERVAL_MS) {
    last_sample_time = current_time;
    readSensors();
    
    // Process window when full
    if (buffer_full) {
      processWindow();
      buffer_full = false;
      buffer_index = 0;
    }
  }
}

// ============================================================================
// WIFI SETUP
// ============================================================================

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] WiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WARNING] WiFi connection failed - will retry");
  }
}

// ============================================================================
// SENSOR SETUP
// ============================================================================

void setupSensors() {
  // MQ sensors (analog)
  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ136_PIN, INPUT);
  
  // SHT31 (I2C)
  if (!sht31.begin(0x44)) {
    Serial.println("[ERROR] SHT31 not found!");
    while (1) delay(1000);
  }
  
  Serial.println("[OK] Sensors initialized");
}

// ============================================================================
// LED SETUP
// ============================================================================

void setupLEDs() {
  pinMode(LED_LAYAK, OUTPUT);
  pinMode(LED_PERLU_PERIKSA, OUTPUT);
  pinMode(LED_TIDAK_LAYAK, OUTPUT);
  
  // Test LEDs
  digitalWrite(LED_LAYAK, HIGH);
  digitalWrite(LED_PERLU_PERIKSA, HIGH);
  digitalWrite(LED_TIDAK_LAYAK, HIGH);
  delay(500);
  digitalWrite(LED_LAYAK, LOW);
  digitalWrite(LED_PERLU_PERIKSA, LOW);
  digitalWrite(LED_TIDAK_LAYAK, LOW);
  
  Serial.println("[OK] LEDs initialized");
}

// ============================================================================
// READ SENSORS
// ============================================================================

void readSensors() {
  // Read MQ sensors (ADC 0-4095, convert to 0-1023 for consistency)
  float mq135_raw = analogRead(MQ135_PIN) / 4.0;
  float mq136_raw = analogRead(MQ136_PIN) / 4.0;
  
  // Read SHT31
  float temp = sht31.readTemperature();
  float humidity = sht31.readHumidity();
  
  // Validate readings
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("[WARNING] SHT31 read error - using previous values");
    if (buffer_index > 0) {
      temp = temp_buffer[buffer_index - 1];
      humidity = humidity_buffer[buffer_index - 1];
    } else {
      temp = 25.0;
      humidity = 60.0;
    }
  }
  
  // Store in buffer
  mq135_buffer[buffer_index] = mq135_raw;
  mq136_buffer[buffer_index] = mq136_raw;
  temp_buffer[buffer_index] = temp;
  humidity_buffer[buffer_index] = humidity;
  
  Serial.printf("Sample %d: MQ135=%.1f, MQ136=%.1f, Temp=%.1fC, Hum=%.1f%%\n",
                buffer_index + 1, mq135_raw, mq136_raw, temp, humidity);
  
  buffer_index++;
  if (buffer_index >= WINDOW_SIZE) {
    buffer_full = true;
  }
}


// ============================================================================
// FEATURE EXTRACTION
// ============================================================================

void processWindow() {
  Serial.println("\n========================================");
  Serial.println("Processing 240-sample window...");
  Serial.println("========================================");
  
  // Extract 8 features
  float features[8];
  
  // MQ135 features
  features[0] = extractMean(mq135_buffer, WINDOW_SIZE);
  features[1] = extractStd(mq135_buffer, WINDOW_SIZE, features[0]);
  features[2] = extractSlope(mq135_buffer, WINDOW_SIZE);
  
  // MQ136 features
  features[3] = extractMean(mq136_buffer, WINDOW_SIZE);
  features[4] = extractStd(mq136_buffer, WINDOW_SIZE, features[3]);
  features[5] = extractSlope(mq136_buffer, WINDOW_SIZE);
  
  // Temp & Humidity features
  features[6] = extractMean(temp_buffer, WINDOW_SIZE);
  features[7] = extractMean(humidity_buffer, WINDOW_SIZE);
  
  Serial.println("Raw features:");
  Serial.printf("  mq135_mean:      %.4f\n", features[0]);
  Serial.printf("  mq135_std:       %.4f\n", features[1]);
  Serial.printf("  mq135_slope:     %.4f\n", features[2]);
  Serial.printf("  mq136_mean:      %.4f\n", features[3]);
  Serial.printf("  mq136_std:       %.4f\n", features[4]);
  Serial.printf("  mq136_slope:     %.4f\n", features[5]);
  Serial.printf("  temp_mean:       %.4f\n", features[6]);
  Serial.printf("  humidity_mean:   %.4f\n", features[7]);
  
  // Normalize features
  normalizeFeatures(features, 8);
  
  Serial.println("\nNormalized features:");
  for (int i = 0; i < 8; i++) {
    Serial.printf("  feature[%d]: %.4f\n", i, features[i]);
  }
  
  // Run inference
  int prediction = runInference(features);
  float confidence = 0.0; // Will be set by inference function
  
  Serial.printf("\nPrediction: %s\n", CLASS_NAMES[prediction]);
  Serial.println("========================================\n");
  
  // Update LEDs
  updateLEDs(prediction);
  
  // Send to server
  sendToServer(features, prediction, confidence);
}

float extractMean(float* buffer, int size) {
  float sum = 0.0;
  for (int i = 0; i < size; i++) {
    sum += buffer[i];
  }
  return sum / size;
}

float extractStd(float* buffer, int size, float mean) {
  float variance = 0.0;
  for (int i = 0; i < size; i++) {
    float diff = buffer[i] - mean;
    variance += diff * diff;
  }
  return sqrt(variance / size);
}

float extractSlope(float* buffer, int size) {
  // Least-squares linear regression
  // slope = (n*sum(xy) - sum(x)*sum(y)) / (n*sum(x^2) - sum(x)^2)
  
  float sum_x = 0.0;
  float sum_y = 0.0;
  float sum_xy = 0.0;
  float sum_x2 = 0.0;
  
  for (int i = 0; i < size; i++) {
    float x = (float)i;
    float y = buffer[i];
    sum_x += x;
    sum_y += y;
    sum_xy += x * y;
    sum_x2 += x * x;
  }
  
  float n = (float)size;
  float slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x);
  
  return slope;
}

void normalizeFeatures(float* features, int size) {
  for (int i = 0; i < size; i++) {
    float min_val = scaler[i].min;
    float max_val = scaler[i].max;
    
    // Min-Max scaling: (x - min) / (max - min)
    features[i] = (features[i] - min_val) / (max_val - min_val);
    
    // Clip to [0, 1]
    if (features[i] < 0.0) features[i] = 0.0;
    if (features[i] > 1.0) features[i] = 1.0;
  }
}


// ============================================================================
// TFLITE INFERENCE (Placeholder - needs TFLite Micro library)
// ============================================================================

// Note: Full TFLite Micro implementation requires:
// - EloquentTinyML or TensorFlowLite_ESP32 library
// - Memory allocation for interpreter (arena size ~10KB)
// - Tensor input/output handling

// Simplified stub for demonstration:
int runInference(float* features) {
  // TODO: Replace with actual TFLite Micro inference
  // This is a placeholder that uses simple thresholds
  
  Serial.println("[INFO] Running inference (stub - replace with TFLite)...");
  
  // Placeholder logic based on normalized features
  // In real implementation: load model, set input tensor, invoke, read output
  
  float mq135_mean_norm = features[0];
  float mq136_mean_norm = features[3];
  
  if (mq135_mean_norm < 0.3 && mq136_mean_norm < 0.3) {
    return 0; // Layak
  } else if (mq135_mean_norm > 0.7 || mq136_mean_norm > 0.7) {
    return 2; // Tidak Layak
  } else {
    return 1; // Perlu Diperiksa
  }
  
  /* ACTUAL TFLITE CODE PATTERN:
  
  #include <TensorFlowLite_ESP32.h>
  #include "tensorflow/lite/micro/all_ops_resolver.h"
  #include "tensorflow/lite/micro/micro_error_reporter.h"
  #include "tensorflow/lite/micro/micro_interpreter.h"
  
  static tflite::MicroInterpreter* interpreter = nullptr;
  static TfLiteTensor* input_tensor = nullptr;
  static TfLiteTensor* output_tensor = nullptr;
  
  // Set input
  for (int i = 0; i < 8; i++) {
    input_tensor->data.f[i] = features[i];
  }
  
  // Run inference
  TfLiteStatus invoke_status = interpreter->Invoke();
  if (invoke_status != kTfLiteOk) {
    Serial.println("[ERROR] Inference failed");
    return -1;
  }
  
  // Get output (3 softmax probabilities)
  float max_prob = 0.0;
  int predicted_class = 0;
  for (int i = 0; i < 3; i++) {
    float prob = output_tensor->data.f[i];
    if (prob > max_prob) {
      max_prob = prob;
      predicted_class = i;
    }
  }
  
  confidence = max_prob;
  return predicted_class;
  */
}

// ============================================================================
// SERVER COMMUNICATION
// ============================================================================

void sendToServer(float* features, int prediction, float confidence) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARNING] WiFi not connected - skipping server upload");
    return;
  }
  
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON payload
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = millis() / 1000; // Unix timestamp (simplified)
  doc["mq135_mean"] = features[0] * (scaler[0].max - scaler[0].min) + scaler[0].min;
  doc["mq135_std"] = features[1] * (scaler[1].max - scaler[1].min) + scaler[1].min;
  doc["mq135_slope"] = features[2] * (scaler[2].max - scaler[2].min) + scaler[2].min;
  doc["mq136_mean"] = features[3] * (scaler[3].max - scaler[3].min) + scaler[3].min;
  doc["mq136_std"] = features[4] * (scaler[4].max - scaler[4].min) + scaler[4].min;
  doc["mq136_slope"] = features[5] * (scaler[5].max - scaler[5].min) + scaler[5].min;
  doc["temp_mean"] = features[6] * (scaler[6].max - scaler[6].min) + scaler[6].min;
  doc["humidity_mean"] = features[7] * (scaler[7].max - scaler[7].min) + scaler[7].min;
  doc["prediction"] = CLASS_NAMES[prediction];
  doc["confidence"] = confidence;
  
  String json_payload;
  serializeJson(doc, json_payload);
  
  Serial.println("\nSending to server:");
  Serial.println(json_payload);
  
  int http_code = http.POST(json_payload);
  
  if (http_code > 0) {
    Serial.printf("[OK] Server responded: %d\n", http_code);
    if (http_code == HTTP_CODE_OK) {
      String response = http.getString();
      Serial.println("Response: " + response);
    }
  } else {
    Serial.printf("[ERROR] HTTP POST failed: %s\n", http.errorToString(http_code).c_str());
  }
  
  http.end();
}

// ============================================================================
// LED CONTROL
// ============================================================================

void updateLEDs(int prediction) {
  // Turn all off first
  digitalWrite(LED_LAYAK, LOW);
  digitalWrite(LED_PERLU_PERIKSA, LOW);
  digitalWrite(LED_TIDAK_LAYAK, LOW);
  
  // Turn on corresponding LED
  switch (prediction) {
    case 0: // Layak
      digitalWrite(LED_LAYAK, HIGH);
      break;
    case 1: // Perlu Diperiksa
      digitalWrite(LED_PERLU_PERIKSA, HIGH);
      break;
    case 2: // Tidak Layak
      digitalWrite(LED_TIDAK_LAYAK, HIGH);
      break;
  }
}

