# Automated Commercial Solid Waste Segregation Optimization Dashboard for Municipal Recycling Plants

> **Production Full-Stack & IoT Systems Architecture**  
> Real-Time Ultrasonic Sensing | Role-Based Access Control | Firestore & Persistent Storage | Autonomous Overflow Watchdogs

---

## 1. Technical Architecture & System Overview

This platform is an enterprise-grade IoT municipal solution designed for urban recycling centers, commercial market plazas, and material recovery facilities (MRFs). It transforms static dustbins into intelligent nodes that continuously measure fill depth, classify commercial waste streams (Organic, Recyclable Plastic, Paper & Cardboard, Metal & Glass, Hazardous/E-Waste), and stream telemetry to dispatch fleet compactors before overflow occurs.

```
+-------------------------------------------------------------------------------+
|                           EDGE HARDWARE LAYER                                 |
|  [ESP32 Node] <---> [HC-SR04 / JSN-SR04T Sensor] ---> 10us Ultrasonic Pulse  |
+---------------------------------------+---------------------------------------+
                                        | HTTP REST / JSON Telemetry (X-Device-Key)
                                        v
+-------------------------------------------------------------------------------+
|                      BACKEND INGESTION & WATCHDOG LAYER                       |
|  - Express & TypeScript API Gateway (Port 5000)                                |
|  - Ingestion Engine (/api/v1/sensors/reading): Distance-to-Fill Formula        |
|  - Alert Engine: Deduplication, Threshold Trigger (70% / 90%), Auto-Resolve   |
|  - Offline Watchdog (30s cycle for silent sensor nodes)                       |
|  - Server-Sent Events (SSE) Broadcast Stream (/api/v1/events)                 |
+---------------------------------------+---------------------------------------+
                                        | Real-Time Event Stream / Atomic Persistence
                                        v
+-------------------------------------------------------------------------------+
|                      DATABASE & SYNCHRONIZATION LAYER                         |
|  - Cloud Firestore Schema & RBAC Security Rules (firestore.rules)              |
|  - High-Speed Persistent Local JSON / ACID Store (data/db.json)               |
+---------------------------------------+---------------------------------------+
                                        | SSE & REST APIs
                                        v
+-------------------------------------------------------------------------------+
|                         FRONTEND & OPERATOR DASHBOARD                         |
|  - React 19 + TypeScript + Tailwind CSS + Lucide Icons + Recharts             |
|  - Live Tank Gauges, Audio Chimes, Native Browser Desktop Push Alerts         |
|  - Role-Based Portals: Administrator, Municipal Staff Operator, Viewer        |
|  - Interactive IoT Hardware Simulator (Dev Testbed) & ESP32 Wiring Guides     |
+-------------------------------------------------------------------------------+
```

---

## 2. Key Capabilities & Implemented Modules

1. **Role-Based Access Control (RBAC)**:
   - **Administrator**: Full privileges to register/delete dustbins, bind hardware nodes, manage user accounts, and calibrate operational thresholds.
   - **Municipal Staff**: Access to live telemetry, fleet dispatching, alert acknowledgements, and completed collection manifests.
   - **Viewer**: Read-only environmental audit and segregation reporting.
2. **Dynamic Dustbin Fleet Management**:
   - Unique Bin ID enforcement (e.g. `BIN-MUC-101`) with automatic duplicate rejection.
   - Calibrated physical dimensions: internal depth (`heightCm`) and sensor mounting offset (`sensorOffsetCm`).
   - Safe sensor binding/unbinding preventing orphaned hardware mappings.
3. **Real-Time IoT Sensor Integration**:
   - Ultrasonic pulse flight-time calculation:
     $$\text{Waste Depth} = \text{Height} - (\text{Measured Distance} - \text{Offset})$$
     $$\text{Fill Percentage} = \max(0, \min(100, \text{round}((\text{Waste Depth} / \text{Height}) \times 100)))$$
   - Out-of-order timestamp rejection to prevent telemetry race conditions.
   - Hardware range verification (rejects readings outside 1–500 cm).
4. **Alerts & Autonomous Watchdogs**:
   - Configurable Thresholds:
     - Normal: $< 70\%$
     - Almost Full: $70\% - 89\%$ (Yellow warning alert)
     - Critical Full: $\ge 90\%$ (Red incident, audio chime, and optional auto-dispatch)
     - Offline Alert: Generated if node silence exceeds timeout (default 15 mins).
   - **Deduplication Engine**: Bins remaining above threshold do *not* spam duplicate alerts. When a bin is emptied below the threshold, active alerts auto-resolve.
5. **Interactive IoT Hardware Simulator**:
   - Built-in developer validation testbed to simulate HC-SR04 readings with distance sliders, battery depletion, and 1-click incident scenarios.
   - All simulated data is transparently flagged with `isSimulated: true`.
6. **Collection Fleet Manifests**:
   - Staff record collection dispatches, vehicle registrations, and estimated weights diverted from landfills, automatically resetting bins to 0%.

---

## 3. Quick Start & Local Run Instructions

### Prerequisites
- Node.js v18+ (tested on v22.20)
- npm v9+

### Installation & Execution
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Launch both Backend Server and Frontend Dashboard simultaneously:
npm run dev
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **SSE Stream**: `http://localhost:5000/api/v1/events`
- **Sensor Ingestion Endpoint**: `http://localhost:5000/api/v1/sensors/reading`

---

## 4. Evaluation Credentials & Preset Accounts

Use any of these preset accounts for immediate 1-click evaluation:

| Role | Email | Privileges |
|---|---|---|
| **Administrator** | `admin@municipal.gov.in` | Full management (Bins, Users, Settings, Telemetry) |
| **Municipal Staff** | `staff@municipal.gov.in` | Telemetry, Truck Dispatch, Alert Acknowledgement |
| **Viewer** | `auditor@environment.org` | Read-only inspection and audit report export |

---

## 5. ESP32 Hardware Integration & Firmware

### Hardware BOM
1. **ESP32 DevKit v1** (NodeMCU-32S)
2. **HC-SR04** Ultrasonic Distance Sensor (or waterproof JSN-SR04T)
3. 1kΩ and 2kΩ resistors (voltage divider for 5V ECHO to 3.3V ESP32 GPIO)
4. Jumper wires & 5V power source

### Pin Connections
- **HC-SR04 VCC** $\rightarrow$ ESP32 **VIN (5V)**
- **HC-SR04 GND** $\rightarrow$ ESP32 **GND**
- **HC-SR04 TRIG** $\rightarrow$ ESP32 **GPIO 5**
- **HC-SR04 ECHO** $\rightarrow$ 1kΩ resistor $\rightarrow$ ESP32 **GPIO 18** (and 2kΩ to GND)

### Firmware Sketch
The complete Arduino C++ sketch is available in [`firmware/esp32_firmware.ino`](firmware/esp32_firmware.ino).
Open the sketch in Arduino IDE, update your WiFi credentials and server IP, and upload to the board.

---

## 6. Cloud Firestore Setup (Optional)

The application works 100% out-of-the-box using the embedded atomic JSON store in `data/db.json`. To connect to Google Cloud Firestore:

1. Create a Firebase project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Firebase Authentication**.
3. Copy `.env.example` to `.env` and fill in your project credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ```
4. Deploy the security rules defined in [`firestore.rules`](firestore.rules).
