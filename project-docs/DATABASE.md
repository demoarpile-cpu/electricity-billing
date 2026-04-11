# 🗄️ Database Schema & Data Models: PowerBill

The system uses a **MySQL Relational Database** managed via the **Prisma ORM**.

## 1. Schema Relationships (Overview)

### 👤 User & Auth
*   **User Model**: Core authentication table. 1-to-1 relationship with `Consumer` (if the role is `CONSUMER`).
*   **Roles**: `ADMIN`, `OPERATOR`, `CONSUMER`.

### ⚡ Consumer & Meter Infrastructure
*   **Consumer Model**: Stores the physical location and connection type (Residential, etc.).
*   **Meter Model**: linked 1-to-1 or 1-to-Many to a `Consumer`. Houses **Modbus Port/IP settings**.
*   **MeterRegister Model**: Contains specific register addresses (40001, etc.) and data types (Float, etc.).
*   **MeterReading Model**: High-frequency historical logs of telemetry (Voltage, Energy).

### 🧾 Billing & Revenue
*   **Bill Model**: Monthly consumption invoices. Links to `Consumer`.
*   **Payment Model**: Financial transaction logs. Links to `Bill`.
*   **Notification Model**: Alerts related to bills and payments.

## 2. Model Structure (Main Tables)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      String   @default("CONSUMER")
  consumer  Consumer?
}

model Consumer {
  id              Int      @id @default(autoincrement())
  userId          Int      @unique
  meterNumber     String   @unique
  address         String
  connectionType  String   @default("RESIDENTIAL")
  status          String   @default("ACTIVE")
  lastReading     Float    @default(0)
  meters          Meter[]
  bills           Bill[]
}

model Meter {
  id              Int      @id @default(autoincrement())
  consumerId      Int
  meterId         String   @unique
  connectionType  String   @default("TCP")
  ipAddress       String?
  port            Int?
  comPort         String?
  baudRate        Int?
  modbusAddress   Int      @default(1)
  status          String   @default("Disconnected")
  registers       MeterRegister[]
}
```

## 3. Critical Integrity Rules
1.  **Unique Constraints**: `email` (User), `meterNumber` (Consumer), `meterId` (Meter) must be unique.
2.  **Cascading Deletes**: If a `User` is deleted, the corresponding `Consumer` profile and its history (Bills/Payments) must be handled to prevent orphaned data.
3.  **Audit Logs**: (Future Implementation) All changes to `MeterConfig` should be archived in an Audit log table.

---

*Status: Prisma Schema V3.0 Models Documented*
