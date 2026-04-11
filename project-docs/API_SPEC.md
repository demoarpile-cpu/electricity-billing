# 📡 API Endpoints Specification: PowerBill

Base URL: `http://localhost:5000/api`

## 1. Authentication (`/auth`)
| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/login` | `POST` | All | Returns JWT if credentials are valid. |
| `/register` | `POST` | Admin | Register new Admin or Operator (if needed). |
| `/me` | `GET` | All | Fetch current profile and verify token. |

## 2. Consumers (`/consumers`)
| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/` | `GET` | Admin/Op | List all consumers. Query: `search`, `status`, `type`. |
| `/` | `POST` | Admin | **Create new Consumer + Meter at once.** |
| `/:id` | `GET` | Admin/Op | Fetch single consumer with full history. |
| `/profile/me` | `GET` | Consumer | Self-service profile. |
| `/:id` | `PUT` | Admin | Update system configuration and meter info. |
| `/:id` | `DELETE` | Admin | Standard cascading delete. |

## 3. Billing & Payments (`/bills` & `/payments`)
| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/bills` | `GET` | Admin/Op | List all billing history across the system. |
| `/bills/stats` | `GET` | Admin | **Dashboard Core Stats.** |
| `/bills/generate` | `POST` | Admin/Op | Create billing cycle for single or bulk. |
| `/bills/my` | `GET` | Consumer | Personal bill history. |
| `/payments` | `GET` | Admin/Op | Global revenue log. |
| `/payments/my` | `GET` | Consumer | Personal transaction log. |
| `/payments` | `POST` | Consumer | Process a payment (manual/gateways). |

## 4. Meter Telemetry (`/meters`)
| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/` | `GET` | Admin | List all physical meters in the grid. |
| `/:id/registers` | `GET` | Admin | Fetch Modbus register map for a meter. |
| `/:id/status` | `PATCH` | Admin | Manually update connection/online status. |

## 5. Help-Desk & Complaints (`/complaints`)
| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/` | `GET` | Admin/Op | Inbox for technical issues. |
| `/` | `POST` | Consumer | File a new ticket. |
| `/:id` | `PATCH` | Admin/Op | Resolve or update ticket status. |

---

*Status: API V3 Spec Documented*
