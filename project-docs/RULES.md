# ⚖️ System Rules & Constraints: PowerBill

This document outlines the validation rules, security constraints, and business logic guardrails for the **PowerBill** backend.

## 1. Authentication & Security Rules
*   **JWT Only**: No session-based auth. 
*   **Role Hierarchy**:
    -   `ADMIN`: Access to all endpoints.
    -   `OPERATOR`: Access to consumers, bills, and payments (but NOT system settings or bulk deletes).
    -   `CONSUMER`: Restricted to their OWN profile, bills, and payments.
*   **Token Expiration**: Hardcoded to `7d` (7 days) for a seamless user experience.

## 2. Validation Constraints (Data Integrity)
*   **Unique Meter Number**: `Consumer.meterNumber` must be unique across the entire database.
*   **Unique Email**: `User.email` is the unique identifier for logins.
*   **Modbus Address Range**: Slave IDs (`modbusAddress`) must be between `1` and `247`.
*   **TCP Port**: Defaults to `502` for Modbus TCP but accepts any valid port (1-65535).
*   **Baud Rate**: standard serial speeds (e.g., 9600, 19200, 115200) for RS485 connections.

## 3. Business Logic Rules
*   **Billing Frequency**: Automatically prevents generating multiple bills for the same consumer within the same billing month (unless force-reset).
*   **Reading Accuracy**: `currentReading` CANNOT be less than `previousReading` for the same meter.
*   **Payment Immutability**: Once a payment is marked as `SUCCESS`, it cannot be deleted; it must be reversed via a credit note/refund entry.
*   **Complaint Resolution**: Only `ADMIN` or `OPERATOR` can transition a ticket status to `RESOLVED`.

## 4. UI/Frontend Mapping Rules
*   **Currency**: All amounts are in **Rupees (INR)** by default.
*   **Date Format**: All dates follow standard ISO strings in the backend and are formatted to `DD-MMM-YYYY` (e.g., 04-Apr-2026) in the frontend.

---

*Status: Critical System Rules V2.0 Finalized*
