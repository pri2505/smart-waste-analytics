import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, Terminal, Cpu, Radio, Shield } from 'lucide-react';

interface HardwareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareGuideModal: React.FC<HardwareGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleSketch = `// ========================================================
// Municipal Waste Segregation - ESP32 Ultrasonic Node
// Hardware: ESP32 DevKit v1 + HC-SR04 Ultrasonic Distance Sensor
// Target: /api/v1/sensors/reading
// ========================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "YOUR_MUNICIPAL_WIFI";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Ingestion Endpoint
const char* SERVER_URL    = "http://192.168.1.50:5000/api/v1/sensors/reading";
const char* DEVICE_ID     = "ESP32-NODE-01";
const char* DEVICE_KEY    = "sec_node01_k9f8w2q1"; // From Device Inventory

// HC-SR04 Ultrasonic Sensor Pinout
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

float measureDistanceCm() {
  // Clear trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  // Send 10us ultrasonic pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo return duration (timeout 30ms = ~5 meters)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1.0; // Timeout / sensor unplugged

  // Speed of sound: 343 m/s = 0.0343 cm/us -> (duration / 2) * 0.0343
  return (duration * 0.0343) / 2.0;
}

void loop() {
  float distance = measureDistanceCm();
  if (distance > 0 && distance < 450) {
    Serial.printf("[SENSOR] Distance measured: %.2f cm\\n", distance);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Id", DEVICE_ID);
      http.addHeader("X-Device-Key", DEVICE_KEY);

      // JSON Telemetry Payload
      String payload = "{\\"deviceId\\":\\"" + String(DEVICE_ID) +
                       "\\",\\"distanceCm\\":" + String(distance, 1) +
                       ",\\"batteryLevel\\":95}";

      int httpResponseCode = http.POST(payload);
      Serial.printf("[HTTP] Ingestion response: %d\\n", httpResponseCode);
      http.end();
    }
  } else {
    Serial.println("[WARN] Sensor reading out of valid range.");
  }

  // Transmit telemetry every 15 seconds
  delay(15000);
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleSketch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ESP32 Hardware Integration & Wiring Guide
              </h3>
              <p className="text-xs text-slate-400">
                Connect physical ultrasonic sensors to the municipal segregation platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Hardware Pinout Table */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              1. Hardware Wiring Pinout (ESP32 DevKit + HC-SR04)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">HC-SR04 Pin</th>
                    <th className="px-4 py-2.5">ESP32 Pin</th>
                    <th className="px-4 py-2.5">Function</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="px-4 py-2 text-rose-400 font-bold">VCC</td>
                    <td className="px-4 py-2 text-white">VIN or 5V</td>
                    <td className="px-4 py-2 text-slate-400 font-sans">Power supply</td>
                    <td className="px-4 py-2 text-slate-500 font-sans">Connect to 5V rail</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-400 font-bold">GND</td>
                    <td className="px-4 py-2 text-white">GND</td>
                    <td className="px-4 py-2 text-slate-400 font-sans">Ground</td>
                    <td className="px-4 py-2 text-slate-500 font-sans">Common system ground</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-amber-400 font-bold">TRIG</td>
                    <td className="px-4 py-2 text-emerald-400">GPIO 5</td>
                    <td className="px-4 py-2 text-slate-400 font-sans">Trigger Pulse Output</td>
                    <td className="px-4 py-2 text-slate-500 font-sans">10μs active high pulse</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-cyan-400 font-bold">ECHO</td>
                    <td className="px-4 py-2 text-emerald-400">GPIO 18</td>
                    <td className="px-4 py-2 text-slate-400 font-sans">Echo Duration Input</td>
                    <td className="px-4 py-2 text-amber-400/80 font-sans">Use 1kΩ / 2kΩ voltage divider (5V to 3.3V)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Telemetry Endpoint Schema */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              2. REST API Telemetry Ingestion Contract
            </h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-emerald-400 font-bold">
                POST /api/v1/sensors/reading
              </div>
              <div className="text-slate-400">
                Headers: <span className="text-amber-300">X-Device-Id: ESP32-NODE-01</span>, <span className="text-amber-300">X-Device-Key: &lt;API_KEY&gt;</span>
              </div>
              <div className="text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800">
                {`{
  "deviceId": "ESP32-NODE-01",
  "distanceCm": 32.5,
  "batteryLevel": 88,
  "rssi": -62
}`}
              </div>
            </div>
          </div>

          {/* Arduino C++ Sketch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                3. Production Arduino C++ Firmware Sketch
              </h4>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Sketch'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-64 leading-relaxed">
              {sampleSketch}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
