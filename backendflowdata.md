# ⚡ PowerBill 2.0 - System Data Flow & Architecture

---

## 🏗️ 1. Architecture Overview
This system uses a **Headless Backend Architecture** where the telemetry engine and API core are decoupled but share a high-performance **MySQL Database**.

- **Backend Platform**: Node.js v18+
- **Data Integrity**: Prisma ORM with ACID Transactions.
- **Protocol Interfacing**: Modbus TCP/ID & RS485 Serial Communication.
- **Real-time Pipeline**: WebSocket (Socket.IO) with persistent event emitters.

---

## 🌊 2. The "Live Data" Pipeline (Proper Flow)

### Step 1: Telemetry Ingest (Modbus Engine)
- The engine runs a **Concurrent Polling Loop** (every 3000ms by default).
- For each meter configured in the DB:
  - **Connection**: TCP/IP (Modbus 502) or RTU Serial.
  - **Failover**: If hardware is missing, it triggers an `Intelligent Simulator` to ensure the UI remains active for demonstration.

### Step 2: Data Normalization
- Raw Modbus buffers are parsed into human-readable metrics.
- **Voltage (V)**, **Current (A)**, **Power (kW)**, **Energy (kWh)**.

### Step 3: Atomic Persistence (Database)
- Metrics are saved via a **Prisma Transaction**.
- **Log 1**: New record in `MeterReading` table (Historical Tracking).
- **Log 2**: Update `Meter` status to "Active".
- **Log 3**: Update `Consumer.lastReading` (Billing Reference).

### Step 4: Live Broadcast
- Immediately after DB commit, a payload is emitted to the Frontend.
- Event: `meterUpdate`
- Payload: `{ meterId, voltage, current, power, energy, lastUpdated }`

---

## 🔒 3. Security & Connectivity
- **CORS Protection**: Origin-specific filtering for `localhost` and `railway.app`.
- **Credential Sharing**: Enabled for session-based authentication across subdomains.
- **Request Limiting**: Body parsing restricted to JSON/UrlEncoded for SQL injection safety.

---

## 📊 4. Database Entities
| Entity | Role |
| :--- | :--- |
| **User** | Core Auth & Identity. |
| **Consumer** | Premises data & Billing history. |
| **Meter** | Technical specifications of the hardware. |
| **MeterReading** | Time-series telemetry data. |
| **Register** | Register-to-Label mapping for Modbus. |

---

## ✅ 5. Production Checks (System Health)
- **Error Handling**: 500-level errors are logged on the server and returned as standardized JSON objects.
- **Polling Continuity**: Using `finally` blocks to ensure the pipeline never dies even during critical network failures.
- **Auto-Sync**: Frontend automatically re-syncs state on reconnect via Socket.IO.
