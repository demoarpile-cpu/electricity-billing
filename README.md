# PowerBill Backend Engine (Node.js + Prisma + MySQL)

Professional electricity billing management system backend.

## 🚀 Quick Start

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Database Configuration:**
    Create a database named `powerbill_db` in MySQL and update `.env`:
    ```env
    DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/powerbill_db"
    ```

3.  **Setup Database (Migrations):**
    ```bash
    npx prisma migrate dev --name init
    ```

4.  **Seed Initial Data:**
    ```bash
    npm run prisma:seed
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 🔑 Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@powerbill.com` | `admin123` |
| **Operator** | `operator@powerbill.com` | `operator123` |
| **Consumer** | `john@example.com` | `consumer123` |

---

## 🛠 Tech Stack
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Prisma
- **Auth:** JWT + Bcrypt
- **CORS:** Enabled for React frontend

## 📂 Data Flow Logic
- **Admin:** Manages consumers and views system-wide revenue reports.
- **Operator:** Inputs meter readings, generates bills, and handles local complaints.
- **Consumer:** Views personal bills, makes payments, and raises support tickets.
