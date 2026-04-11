# 📘 Consumer & Live Monitoring - Backend Flow Documentation

This document explains exactly how the **Live Monitoring** feature works, from the physical meter to the consumer dashboard.

---

## 🏗️ 1. Concept: Physical Meter se Dashboard tak ka Safar (Journey)

**Hardware (Meter)** → **Node.js (Modbus Engine)** → **Database & WebSocket** → **Consumer Dashboard (UI)**

---

## 🔌 2. Backend Connection: Meter Connect Kaise Hota Hai?

The system uses a **Modbus Engine** service to talk to the meters. There are two main ways to connect:

1.  **TCP Connection (Wi-Fi/Ethernet)**: 
    - The meter has an IP Address (e.g., `192.168.1.100`) and a Port (default `502`).
    - Backend uses a **Modbus TCP** protocol to "handshake" with the meter.
2.  **RTU Connection (Serial/RS485)**:
    - Connects via a COM Port (e.g., `COM3`) using a USB-to-RS485 converter.
    - Uses settings like **BaudRate** (9600), **Parity**, and **StopBits**.

### Backend Logic (`modbusEngine.js`):
- Engine check karta hai ki DB mein kitne meters authorized hain.
- Har meter ke liye ek **Polling Loop** chalta hai (every 5 seconds).
- It opens a connection, reads data from specific **Registers** (where voltage, current, etc., are stored), and then closes/recycles the connection.

---

## 🌊 3. Full Data Flow (Step-by-Step)

### Step 1: Polling (Data Fetching)
Backend service (`modbusEngine.js`) har 5 second mein meter se puchta hai: *"Boss, current readings kya hain?"*

### Step 2: Protocol Reading
Meter replies with hexadecimal data. Backend converts this raw data into readable numbers:
- `Voltage` (e.g., 230V)
- `Current` (e.g., 5A)
- `Power` (e.g., 1.15 kW)
- `Energy` (e.g., 450 kWh)

### Step 3: Database Update (Persistence)
Data aane ke baad, backend **3 kaam ek saath** karta hai (Prisma Transaction):
1.  **MeterReading Table**: Naya record banta hai historical graph ke liye.
2.  **Meter Table**: Meter ka status "Active" update hota hai aur `lastUpdated` time save hota hai.
3.  **Consumer Table**: Consumer ka total reading (`lastReading`) update hota hai billing calculation ke liye.

### Step 4: Real-time Broadcast (Socket.io)
Ab dashboard refresh ki jarurat nahi! Backend **Socket.io** ka use karke ek event throw karta hai:
- Event Name: `meterUpdate`
- Payload: `{ voltage: 230, power: 1.15, status: 'Active' ... }`

---

## 👥 4. Consumer Perspective: Dashboard Pe Kya Dikhta Hai?

Jab consumer login karta hai:
1.  **Real-time Gauges**: Uske screen pe jo voltage aur power ka meter hai, wo bina refresh kiye move hota hai.
2.  **Status Indicator**: Agar meter wire se disconnected hai, toh dashboard turant **"Offline"** dikhayega (backend timeouts detect kar leta hai).
3.  **History & Analytics**: Previous readings use patterns dikhati hain (Kal kitni unit kharch hui, aaj kitni).

---

## 🛠️ 5. Summary Checklist (Backend Flow)

| Component | Responsibility |
| :--- | :--- |
| **Prisma ORM** | MySQL DB se data lane aur le jane ke liye. |
| **modbus-serial** | Hardware level communication package. |
| **Socket.io** | Backend se Frontend data bina refresh bhejne ke liye. |
| **Polling Loop** | Persistent loop jo backend band nahi hone deta jab tak server on hai. |

---

**Note**: Developer Panel se aap naye registers add kar sakte hain, backend automatically unhe update kar lega next cycle mein.