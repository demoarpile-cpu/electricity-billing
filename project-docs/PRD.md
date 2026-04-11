# 📝 Product Requirements Document (PRD)

## 1. Project Vision
**PowerBill** is a high-availability Energy Management System (EMS) designed to bridge the gap between physical industrial meters and administrative financial control. The system provides real-time transparency into energy consumption and automates the entire revenue cycle.

## 2. Key Objectives
*   **Real-Time Monitoring**: Direct integration with meters via Modbus TCP/RS485.
*   **Automated Billing**: Eliminate manual reading errors by auto-calculating usage.
*   **Transparent Payments**: Provide consumers with a clear trail of invoices and receipts.
*   **Administrative Control**: Centralized dashboard for utility providers to manage large-scale grids.

## 3. Target User Roles
### 👑 Admin
*   Full system configuration (Gateway/Meter/Price).
*   Consumer onboarding and meter-to-user mapping.
*   Global financial reporting and system diagnostics.

### 🛠️ Operator
*   Regional field management.
*   Manual reading entry (if needed) and cash collections.
*   Resolving consumer complaints on-site.

### 👤 Consumer
*   Self-service bill viewing and PDF downloads.
*   Consumption history tracking.
*   Raising help-desk tickets for technical issues.

## 4. Feature Requirements
### Core Features
- [x] JWT-based Authentication.
- [x] Consumer Management (CRUD).
- [x] Meter Configuration (TCP/RS485 protocols).
- [ ] Automated Modbus Reading Engine (In Progress).
- [x] Bill Generation (Manual & Semi-Auto).
- [x] Payment Tracking.
- [x] Complaint Ticketing System.

### Future High-Priority
- [ ] Online Payment Gateway (Razorpay/Stripe).
- [ ] SMS/Email Billing Alerts.
- [ ] Predictive Usage Analysis.
