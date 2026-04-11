# 🏗️ PowerBill 2.0 - System Implementation Guide

This document provides a technical walkthrough of how the **Meter Monitoring & Connection System** was implemented across the stack.

---

## 1. Backend: The Modbus Telemetry Engine
The core logic resides in `src/services/modbusEngine.js`. 

### Key Features:
*   **Decoupled Intelligence**: The engine runs as a singleton class, initialized on server start.
*   **Validation Flow (Rule #9)**: 
    - The `/test-connection` endpoint allows checking hardware state **without saving** it to the DB.
    - It performs a 3-way handshake: (1) TCP/Serial Check -> (2) Slave ID ID check -> (3) Register Access test.
*   **Smart Polling Strategy**: 
    - Instead of global polling, we only target meters with status `ONLINE`.
    - Every 5 seconds, the engine refreshes the `activePollings` list from the Database.
*   **Error Parsing**: Use of Node.js error codes (`ECONNREFUSED`, `ETIMEDOUT`) to provide human-readable feedback to the frontend.

---

## 2. Real-Time Data Pipeline (WebSocket)
We use **Socket.io** for zero-latency monitoring.

*   **Broadcast Mechanism**: As soon as the `ModbusEngine` reads a valid register buffer, it emits a `meterUpdate` event.
*   **Atomic Transactions**: Before broadcasting, we use `prisma.$transaction` to ensure that:
    1.  The live status is updated.
    2.  A point-in-time record is created in `MeterReading`.
    3.  The consumer's total energy count is updated.

---

## 3. Frontend Architecture (React)
The UI is built to handle the complexity of hardware setup while keeping it simple for the admin.

### Meter Configuration (`MeterConfiguration.jsx`):
*   **Pre-save Verification**: The UI forces a "Test Link" before allowing "Commit Settings". This prevents "dead configurations" in the system.
*   **Dynamic Modbus Mapping**: A table-based interface allows the admin to map any register (Float/Int) to a custom label (Voltage, Current, etc.) without changing code.

### Live Dashboard (`LiveDashboard.jsx`):
*   **Reactive State**: Uses `AnimatePresence` and `Framer Motion` to smoothly update gauge values when socket events arrive.
*   **Service Health indicator**: A dedicated status bar shows if the frontend is currently synchronized with the Backend Telemetry Service.

---

## 4. Database Design (Prisma)
| Model | Role |
| :--- | :--- |
| **Meter** | Hardware configuration (IP, Port, Slave ID). |
| **Register** | Dynamic mapping for Modbus memory addresses. |
| **MeterReading** | Time-series data storing Voltage, Current, Power, and Energy logs. |
| **Consumer** | Business-level entity linked to the physical hardware. |

---

## 5. Summary of Improvements
1.  **Reliability**: Added `try-finally` blocks in the Modbus service to always close hardware ports on failure, preventing "Port Busy" ghost-locks.
2.  **UX**: Error messages are no longer generic "Server Error"; they now show "Meter unreachable" or "Wrong slave ID".
3.  **Performance**: Polling interval is customizable (Default 5s), and DB queries are optimized using `include` relations to fetch meter and register data in one go.

---
**Status**: Implementation Complete & Production Ready.
