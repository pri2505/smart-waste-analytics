/*
 * =========================================================================================
 * Project: Automated Commercial Solid Waste Segregation Optimization Dashboard
 * Node Type: ESP32 Ultrasonic Smart Dustbin Telemetry Node
 * Target Sensor: HC-SR04 / JSN-SR04T Waterproof Ultrasonic Sensor
 * Protocol: HTTP REST JSON Telemetry / Optional MQTT
 * =========================================================================================
 *
 * WIRING PINOUT:
 * ESP32 VIN (5V)  <---> HC-SR04 VCC
 * ESP32 GND       <---> HC-SR04 GND
 * ESP32 GPIO 5    <---> HC-SR04 TRIG (10us pulse)
 * ESP32 GPIO 18   <---> HC-SR04 ECHO (Via 1k/2k ohm resistor divider: 5V -> 3.3V logic)
 *
 * =========================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* WIFI_SSID     = "MUNICIPAL_CORP_WIFI";
const char* WIFI_PASSWORD = "CHANGE_ME_PASSWORD";

// Server Configuration
// Change this to your server's LAN IP address or Cloud domain
const char* INGESTION_URL = "http://192.168.1.100:5000/api/v1/sensors/reading";

// Device Identity & Authentication
const char* DEVICE_ID     = "ESP32-NODE-01";
const char* DEVICE_KEY    = "sec_node01_k9f8w2q1"; // Matched from Device Management

// Hardware Pins
const int PIN_TRIG = 5;
const int PIN_ECHO = 18;
const int PIN_LED_STATUS = 2; // Built-in blue LED

// Operational Timers
const unsigned long TELEMETRY_INTERVAL_MS = 15000; // Send telemetry every 15 seconds
unsigned long lastTelemetryTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n[INIT] Municipal Smart Waste ESP32 Node Starting...");
  Serial.printf("[INIT] Device ID: %s\n", DEVICE_ID);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);

  connectWiFi();
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WIFI] Connecting to SSID: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED_STATUS, HIGH);
    Serial.println("\n[WIFI] Connected Successfully!");
    Serial.printf("[WIFI] IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WIFI] RSSI: %d dBm\n", WiFi.RSSI());
  } else {
    digitalWrite(PIN_LED_STATUS, LOW);
    Serial.println("\n[WIFI] Connection failed. Will retry on next cycle.");
  }
}

// HC-SR04 Distance Measurement in cm
float measureDistanceCm() {
  // Clear trigger
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);

  // Send 10us Trigger Pulse
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Measure round-trip echo pulse duration (timeout 30,000us = ~5.1 meters)
  long durationUs = pulseIn(PIN_ECHO, HIGH, 30000);

  if (durationUs == 0) {
    Serial.println("[SENSOR] Pulse timeout or ultrasonic sensor disconnected.");
    return -1.0;
  }

  // Speed of sound = 343 m/s = 0.0343 cm/microsecond
  // Distance = (Duration * Speed) / 2
  float distanceCm = (durationUs * 0.0343) / 2.0;
  return distanceCm;
}

void transmitTelemetry(float distanceCm) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  HTTPClient http;
  http.begin(INGESTION_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Key", DEVICE_KEY);

  // Approximate battery level or ADC voltage read
  int simulatedBattery = 92;
  int currentRssi = WiFi.RSSI();

  // Create JSON document
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["distanceCm"] = serialized(String(distanceCm, 1));
  doc["batteryLevel"] = simulatedBattery;
  doc["rssi"] = currentRssi;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.printf("[HTTP] Transmitting -> %s\n", jsonPayload.c_str());

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Code %d: %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void loop() {
  unsigned long now = millis();

  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS || lastTelemetryTime == 0) {
    lastTelemetryTime = now;

    float distance = measureDistanceCm();
    if (distance > 1.0 && distance < 450.0) {
      Serial.printf("[SENSOR] Valid measured distance: %.1f cm\n", distance);
      transmitTelemetry(distance);
    } else {
      Serial.printf("[WARN] Out of bounds or invalid sensor distance: %.1f cm\n", distance);
    }
  }

  delay(50);
}
