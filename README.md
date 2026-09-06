# PeoplePay360 — Integrated HR & Payroll Operations Platform

**PeoplePay360 (HRMS OXP)** is an enterprise-grade, integrated Human Resource and Payroll Operations Platform designed to bridge the operational gap between master employee data, daily time/attendance tracking, leave management, period-specific contract rules, ordered salary calculations, and finalized payroll distribution.

Unlike simple CRUD tools that store attendance, contracts, and salary data in isolated silos, PeoplePay360 connects these records into a **unified relational workflow**. Payroll calculations resolve active contract terms for the target date range, calculate worked hours against weekly schedule patterns, factor in leave balance deductions, execute ordered salary computation rules, enforce preflight validation guards, generate printable PDF payslips, and distribute bulk email notifications while syncing data in real time via Socket.IO and Redis.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Implemented Differentiators](#2-core-implemented-differentiators)
3. [Technology Stack](#3-technology-stack)
4. [Complete System Architecture](#4-complete-system-architecture)
5. [Database Schema & Entity Relationship Diagram (ERD)](#5-database-schema--entity-relationship-diagram-erd)
6. [Security & Role-Based Access Control (RBAC)](#6-security--role-based-access-control-rbac)
7. [Module-by-Module Technical Documentation](#7-module-by-module-technical-documentation)
   - [Authentication & User Management](#71-authentication--user-management)
   - [Employee Master Hub](#72-employee-master-hub)
   - [Contract Management & Period Matching](#73-contract-management--period-matching)
   - [Working Schedules & Auto-Calculated Hours](#74-working-schedules--auto-calculated-hours)
   - [Attendance Tracking & Live Widget](#75-attendance-tracking--live-widget)
   - [Time Off Lifecycle & Balance Deductions](#76-time-off-lifecycle--balance-deductions)
   - [Salary Structures & Ordered Rules Engine](#77-salary-structures--ordered-rules-engine)
   - [Two-Step Payrun Processing Wizard & State Machine](#78-two-step-payrun-processing-wizard--state-machine)
   - [Payslips, PDFKit Generation & Nodemailer Bulk Delivery](#79-payslips-pdfkit-generation--nodemailer-bulk-delivery)
   - [Payroll Dashboard & Live Aggregate Analytics](#710-payroll-dashboard--live-aggregate-analytics)
8. [Caching & Real-Time Synchronization](#8-caching--real-time-synchronization)
   - [Redis Caching Architecture & Fallback](#81-redis-caching-architecture--fallback)
   - [Socket.IO Event Propagation](#82-socketio-event-propagation)
9. [End-to-End Execution Traces](#9-end-to-end-execution-traces)
   - [Trace 1: Real-Time Attendance Check-In](#trace-1-real-time-attendance-check-in)
   - [Trace 2: Two-Step Payrun Creation, Computation & Payment](#trace-2-two-step-payrun-creation-computation--payment)
   - [Trace 3: Time Off Request & Allocation Balance Deduction](#trace-3-time-off-request--allocation-balance-deduction)
10. [Local Development & Deployment Guide](#10-local-development--deployment-guide)

---

## 1. Project Overview

The core objective of PeoplePay360 is to manage the full employee lifecycle—from master data onboarding to historical payroll archiving.

```text
Employee (Central Hub)
   ↓
Contract (Historical Records + Period-Specific Selection)
   +
Working Schedule (Weekly Pattern & Standard Hours)
   ↓
Attendance (Check-in/out, Live Timer, Exception Correction)
   +
Time Off (Configurable Types, Allocations & Request Consumption)
   ↓
Salary Structure + Ordered Salary Rules (BASIC → HRA → SPECIAL_ALLOW → GROSS → PF → PT → NET)
   ↓
Payruns (2-Step Wizard: 1. Scope/Period → 2. Employee Selection)
   ↓
Payslips (Computation, Validation Warnings & Status Transitions)
   ↓
Output (Printable PDF Generation & Nodemailer Bulk Email Delivery)
   ↓
Payroll Dashboard (Live Aggregated HR & Payroll Metrics across Periods, Departments & Employee Types)
```

---

## 2. Core Implemented Differentiators

| Feature | Implementation Location | Operational Mechanism |
| :--- | :--- | :--- |
| **Period-Specific Contract Resolver** | [`backend/src/services/payrollService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/payrollService.js#L140-L190) | Evaluates contracts valid for the payrun period date range (`period_start` to `period_end`). Prevents using static latest contracts or creating concurrent active contracts. |
| **Two-Step Payrun Wizard** | [`frontend/src/pages/PayrunsPage.jsx`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/frontend/src/pages/PayrunsPage.jsx#L140-L210) | Step 1 defines scope (Structure, Period From/To). Step 2 filters eligible employees for explicit selection before batch initialization. |
| **Payroll Preflight Validation** | [`backend/src/services/payrollService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/payrollService.js#L260-L320) | Audits batches before status transition to `Validated`. Flags missing bank details, missing contracts, missing checkouts, or unapproved leaves. |
| **Ordered Salary Calculation Engine** | [`backend/src/services/payrollService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/payrollService.js#L200-L255) | Executes rules sequentially by `sequence` integer (`BASIC` → `HRA` → `SPECIAL_ALLOW` → `GROSS` → `PF` → `PT` → `NET`), building complex totals from earlier results. |
| **Live Attendance Header Widget** | [`frontend/src/components/layout/Shell.jsx`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/frontend/src/components/layout/Shell.jsx#L80-L150) | Persistent top-nav widget featuring 🔴 Red / 🟢 Green status lights, ticking live timer (`Now 0h00`), Check-In/Out triggers, and state restoration on page reload. |
| **PDFKit Payslip Streaming** | [`backend/src/services/pdfService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/pdfService.js#L1-L120) | Generates crisp PDF payslips on the fly using `PDFDocument`, including employee info, period breakdowns, earnings, and deductions. |
| **Nodemailer Bulk Delivery** | [`backend/src/services/emailService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/emailService.js#L1-L90) | Asynchronously generates PDF payslips and emails them directly to employees with delivery status tracking. |
| **Redis Cache & Memory Fallback** | [`backend/src/services/redisService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/redisService.js#L1-L150) | Uses Upstash Redis for `< 5ms` lookups. Automatically strips sensitive auth fields (`password_hash`, `jwt`) and falls back to memory if Redis is offline. |
| **Socket.IO Event Sync** | [`backend/src/services/socketService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/socketService.js#L1-L100) | Broadcasts domain events (`ATTENDANCE_UPDATED`, `PAYRUN_UPDATED`, `PAYSLIP_UPDATED`, `DASHBOARD_UPDATED`) to trigger client cache invalidations without page reloads. |

---

## 3. Technology Stack

### Frontend Dependencies ([`frontend/package.json`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/frontend/package.json))

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` | `^19.2.8` | Component-based UI engine |
| `react-dom` | `^19.2.8` | DOM rendering layer |
| `vite` | `^8.2.2` | High-performance build tool |
| `axios` | `^1.20.0` | Centralized HTTP client with interceptors & failover |
| `lucide-react` | `^1.41.0` | Design system iconography |
| `recharts` | `^3.10.1` | Financial & attendance chart visualizers |
| `socket.io-client` | `^4.8.3` | Real-time WebSocket event subscriber |

### Backend Dependencies ([`backend/package.json`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/package.json))

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `express` | `^5.2.1` | REST API routing framework |
| `@neondatabase/serverless` | `^1.1.0` | Serverless Neon PostgreSQL database driver |
| `jsonwebtoken` | `^9.0.3` | Stateless JWT authentication & role payload |
| `bcryptjs` | `^3.0.3` | Salted password hashing |
| `ioredis` | `^6.0.0` | Redis client for Upstash caching |
| `socket.io` | `^4.8.3` | Real-time WebSocket server engine |
| `nodemailer` | `^10.0.0` | SMTP email distribution with PDF attachments |
| `pdfkit` | `^0.20.2` | Server-side vector PDF document compiler |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing configuration |
| `dotenv` | `^17.4.2` | Environment variable loader |

---

## 4. Complete System Architecture

```mermaid
flowchart TD
    U[User Browser]
    
    subgraph Frontend ["Frontend (React 19 + Vite)"]
        UI[React UI Components / Pages]
        AC[AuthContext & SocketContext]
        API_CLIENT[Axios Client & Local Cache]
    end
    
    subgraph Backend ["Backend Node.js / Express Server"]
        ROUTER[Express API Router /api]
        AUTH_MW[JWT Auth & RBAC Middleware]
        SVC[Business Logic Services]
        PDF_ENG[PDFKit Engine]
        MAIL_ENG[Nodemailer Mailer]
    end
    
    subgraph Storage ["Data & Messaging Layer"]
        DB[(Neon PostgreSQL Database)]
        REDIS[(Upstash Redis Cache)]
        SIO[Socket.IO Real-Time Engine]
    end
    
    U --> UI
    UI --> AC
    UI --> API_CLIENT
    API_CLIENT -- HTTP REST Requests --> ROUTER
    ROUTER --> AUTH_MW
    AUTH_MW --> SVC
    
    SVC <--> DB
    SVC <--> REDIS
    SVC --> SIO
    SVC --> PDF_ENG
    SVC --> MAIL_ENG
    
    SIO -- Real-time WebSockets --> AC
    AC -- State Updates --> UI
```

---

## 5. Database Schema & Entity Relationship Diagram (ERD)

Database tables are initialized and indexed in [`backend/src/schema.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/schema.js).

```mermaid
erDiagram
    departments ||--o{ employees : "contains"
    working_schedules ||--o{ employees : "assigned to"
    employees ||--o{ users : "authenticates as"
    employees ||--o{ contracts : "holds"
    employees ||--o{ attendance : "logs"
    employees ||--o{ time_off_allocations : "allocated"
    employees ||--o{ time_off_requests : "submits"
    employees ||--o{ payslips : "receives"
    
    salary_structures ||--o{ contracts : "defines wage rules for"
    salary_structures ||--o{ salary_rules : "contains"
    salary_structures ||--o{ payruns : "applied in"
    
    time_off_types ||--o{ time_off_allocations : "categorizes"
    time_off_types ||--o{ time_off_requests : "categorizes"
    
    payruns ||--o{ payslips : "batches"
    salary_rules ||--o{ payslip_lines : "computes"
    payslips ||--o{ payslip_lines : "itemizes"
    users ||--o{ notifications : "receives"

    departments {
        int id PK
        string name
        string code UK
    }

    working_schedules {
        int id PK
        string name
        string schedule_type
        numeric weekly_hours
    }

    employees {
        int id PK
        string emp_id UK
        string first_name
        string last_name
        string email UK
        string job_position
        string status
        string bank_name
        string account_number
        int department_id FK
        int schedule_id FK
    }

    users {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        int employee_id FK
    }

    contracts {
        int id PK
        string contract_number UK
        int employee_id FK
        date start_date
        date end_date
        numeric wage
        int salary_structure_id FK
        string status
    }

    attendance {
        int id PK
        int employee_id FK
        date date
        timestamptz check_in
        timestamptz check_out
        numeric worked_hours
        string status
    }

    time_off_types {
        int id PK
        string name
        string unit
        boolean requires_allocation
    }

    time_off_allocations {
        int id PK
        int employee_id FK
        int time_off_type_id FK
        numeric allocated_days
        numeric taken_days
        numeric remaining_days
    }

    time_off_requests {
        int id PK
        int employee_id FK
        int time_off_type_id FK
        date start_date
        date end_date
        numeric duration
        string status
    }

    salary_structures {
        int id PK
        string name
        boolean is_active
    }

    salary_rules {
        int id PK
        int salary_structure_id FK
        string name
        string code
        string category
        int sequence
        string computation_type
        numeric amount
        numeric percentage
        string percentage_based_on
    }

    payruns {
        int id PK
        string name
        int salary_structure_id FK
        date period_start
        date period_end
        string status
        numeric total_net
        numeric total_gross
        int payslip_count
    }

    payslips {
        int id PK
        int payrun_id FK
        int employee_id FK
        int contract_id FK
        numeric gross_amount
        numeric deduction_amount
        numeric net_amount
        string status
    }

    payslip_lines {
        int id PK
        int payslip_id FK
        int salary_rule_id FK
        string rule_code
        string rule_name
        string category
        int sequence
        numeric amount
    }

    notifications {
        int id PK
        int user_id FK
        string title
        string message
        boolean is_read
    }
```

---

## 6. Security & Role-Based Access Control (RBAC)

The application enforces a 5-role RBAC matrix at both the React frontend router layer and Express backend middleware layer (`requireRole`).

| Access Area | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Own Employee Profile & Payslips** | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed |
| **Clock In / Check Out (Own)** | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed |
| **Submit Leave Request (Own)** | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed |
| **Manage Employees / Contracts / Schedules** | 🛑 403 Forbidden | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed |
| **Approve / Refuse Leave Requests** | 🛑 403 Forbidden | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed |
| **Access Payroll Batches / Payruns** | 🛑 403 Forbidden | 🛑 403 Forbidden | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed |
| **Compute / Validate / Mark Paid Payruns** | 🛑 403 Forbidden | 🛑 403 Forbidden | 🟢 Allowed | 🟢 Allowed | 🟢 Allowed |
| **Salary Structures & Rules** | 🛑 403 Forbidden | 🛑 403 Forbidden | 👁️ Read-Only | 🟢 Full CRUD | 🟢 Full CRUD |
| **User Administration & Role Updates** | 🛑 403 Forbidden | 🛑 403 Forbidden | 🛑 403 Forbidden | 🛑 403 Forbidden | 🟢 Full Admin |

---

## 7. Module-by-Module Technical Documentation

### 7.1 Authentication & User Management

- **Implementation**: [`backend/src/services/authService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/authService.js)
- **Routes**:
  - `POST /api/auth/login`: Authenticates email/password using bcrypt. Returns JWT token signed with `JWT_SECRET`.
  - `GET /api/auth/me`: Retrieves current authenticated user profile.
  - `GET/POST/PUT/DELETE /api/auth/users`: Protected Admin endpoints for managing platform users.

### 7.2 Employee Master Hub

- **Implementation**: [`frontend/src/pages/EmployeesPage.jsx`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/frontend/src/pages/EmployeesPage.jsx) & [`backend/src/services/employeeService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/employeeService.js)
- **Features**: Dual Kanban/List views, employee creation/editing, department assignment, manager hierarchy, and smart links to filtered related contracts, attendance, time-off allocations, and payslips.

### 7.3 Contract Management & Period Matching

- **Implementation**: [`backend/src/services/contractService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/contractService.js)
- **Features**: Historical contract tracking. Highlights active contract. Payrun processing dynamically matches the contract overlapping `period_start` and `period_end`.

### 7.4 Working Schedules & Auto-Calculated Hours

- **Implementation**: [`backend/src/services/scheduleService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/scheduleService.js)
- **Features**: Defines weekly day/start/end/break patterns. Automatically sums total weekly hours (e.g. 40.00h).

### 7.5 Attendance Tracking & Live Widget

- **Implementation**: [`frontend/src/pages/AttendancePage.jsx`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/frontend/src/pages/AttendancePage.jsx) & [`backend/src/services/attendanceService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/attendanceService.js)
- **Features**: Clock in/out tracking, live ticking header timer, worked hours calculation, missing checkout exception flags, and audit-logged manual corrections.

### 7.6 Time Off Lifecycle & Balance Deductions

- **Implementation**: [`backend/src/services/timeOffService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/timeOffService.js)
- **Features**: Configurable Time Off Types (Paid, Sick, Casual), Allocation assignment, request submission, and manager approval workflows that automatically deduct remaining allocation balances.

### 7.7 Salary Structures & Ordered Rules Engine

- **Implementation**: [`backend/src/services/salaryService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/salaryService.js)
- **Features**: Structures group ordered rules. Rules calculate earnings/deductions sequentially (`sequence 10` → `sequence 100`).

### 7.8 Two-Step Payrun Processing Wizard & State Machine

- **Implementation**: [`frontend/src/pages/PayrunsPage.jsx`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/frontend/src/pages/PayrunsPage.jsx) & [`backend/src/services/payrollService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/payrollService.js)
- **State Machine**: `Draft` → `Computing` → `Computed` → `Validated` → `Paid`.
- **Wizard**: Step 1 collects scope & period dates. Step 2 presents eligible employees for explicit selection before batch creation.

### 7.9 Payslips, PDFKit Generation & Nodemailer Bulk Delivery

- **Implementation**: [`backend/src/services/pdfService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/pdfService.js) & [`backend/src/services/emailService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/emailService.js)
- **Features**: Server-side vector PDF compiles payslips containing employee details, worked days, and rule lines. Bulk mailer attaches generated PDFs to send payslips via Nodemailer.

### 7.10 Payroll Dashboard & Live Aggregate Analytics

- **Implementation**: [`backend/src/services/dashboardService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/dashboardService.js)
- **Features**: Live SQL aggregations without static mock data. Renders KPI cards, Department Salary Cost bar charts, Monthly Net Salary trend charts, and operational alerts filtered by Period, Department, and Employee Type.

---

## 8. Caching & Real-Time Synchronization

### 8.1 Redis Caching Architecture & Fallback

[`backend/src/services/redisService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/redisService.js) handles caching using Upstash Redis:

- **Performance**: Lookups execute in `< 5ms`.
- **Sanitization**: Automatically strips sensitive fields (`password_hash`, `password`, `token`, `jwt`, `secret`) before storing user objects in cache keys.
- **Seamless Fallback**: If Redis connection is refused, the service logs a message and falls back to PostgreSQL queries and in-memory cache without crashing.

### 8.2 Socket.IO Event Propagation

[`backend/src/services/socketService.js`](file:///c:/Users/nikun/OneDrive/Desktop/Projects/Oodo%20Hachthon%20FInal/backend/src/services/socketService.js) broadcasts domain events:

- `ATTENDANCE_UPDATED`: Emitted on Check In / Check Out / Manual Correction.
- `TIME_OFF_UPDATED`: Emitted on Leave Request submission, approval, or refusal.
- `PAYRUN_UPDATED` & `PAYSLIP_UPDATED`: Emitted on Payrun creation, computation, validation, or email dispatch.
- `DASHBOARD_UPDATED`: Broadcasts global metrics refresh.

---

## 9. End-to-End Execution Traces

### Trace 1: Real-Time Attendance Check-In

```text
User clicks [Check In] in Header Widget
   ↓
[Frontend] api.post('/attendance/check-in', { employee_id: 1 })
   ↓
[Backend Express Router] router.post('/attendance/check-in', authenticateToken, handleCheckIn)
   ↓
[attendanceService] clockIn(empId) → INSERT INTO attendance (employee_id, date, check_in, status)
   ↓
[redisService] invalidateAttendance(empId) → Deletes pp360:attendance:* keys
   ↓
[socketService] emitToRolesAndEmployee(..., 'ATTENDANCE_UPDATED')
   ↓
[Frontend SocketContext] Catch event → Trigger fetchTodayAttendance() → UI widget turns GREEN 🟢 & timer starts
```

### Trace 2: Two-Step Payrun Creation, Computation & Payment

```text
User opens Payruns → Clicks [NEW]
   ↓
Wizard Step 1: Select Salary Structure + Period Dates → Click [Continue] (State in React only)
   ↓
Wizard Step 2: GET /api/payruns/eligible-employees → Select Employees → Click [Create Payrun]
   ↓
[Backend] POST /api/payruns → DB creates payrun (status: 'Draft')
   ↓
Payrun Detail Screen → Click [Compute] → POST /api/payruns/:id/compute
   ↓
[payrollService] computePayrun() → Resolves active contract → Computes rules → Inserts payslips & payslip_lines
   ↓
Click [Validate] → PUT /api/payruns/:id/status (status: 'Validated') → Preflight validation checks run
   ↓
Click [Mark Paid] → Status transitions to 'Paid' → Redis invalidated → Socket event emitted → Auto-redirect to Payruns List
```

### Trace 3: Time Off Request & Allocation Balance Deduction

```text
Employee submits Leave Request (15 Sep - 18 Sep, 3 Days) → POST /api/time-off/requests (Status: 'Pending')
   ↓
HR Manager views Time Off Page → Clicks [Approve]
   ↓
[timeOffService] approveRequest() → UPDATE time_off_requests SET status = 'Approved'
   ↓
[Transactional Query] UPDATE time_off_allocations SET taken_days = taken_days + 3, remaining_days = remaining_days - 3
   ↓
Cache invalidated → Socket event emitted → Employee remaining balance updates live
```

---

## 10. Local Development & Deployment Guide

### Prerequisites
- Node.js `v18+` or `v20+`
- PostgreSQL database (Local or Neon PostgreSQL URI)
- Redis instance (Upstash or local Redis server)

### 1. Repository Setup

```bash
git clone https://github.com/Nikunj-1812/-PeoplePay360-HR-Payroll.git
cd -PeoplePay360-HR-Payroll
```

### 2. Environment Configuration (`.env`)

Create a root `.env` file containing:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL Database URI (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:your_password@ep-summer-tooth-aennnzzd-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Frontend & Backend URLs
CLIENT_URL=http://localhost:5173
API_URL=http://localhost:5000/api

# Redis Cache URL (Upstash Redis)
REDIS_URL=redis://default:your_redis_password@your_redis_host.upstash.io:6379

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
MAIL_FROM_NAME=PeoplePay360
MAIL_FROM_EMAIL=your_email@gmail.com
```

### 3. Backend Setup & Database Seeding

```bash
cd backend
npm install
npm run start
```
*Note: On backend startup, `initializeDatabase()` in `schema.js` automatically creates database tables, applies performance indexes, and seeds initial demo users and organizational data.*

### 4. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### Demo Logins

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@peoplepay360.com` | `Admin@123` |
| **HR Manager** | `hrmanager@peoplepay360.com` | `HRManager@123` |
| **HR Payroll User** | `payrolluser@peoplepay360.com` | `PayrollUser@123` |
| **HR Payroll Manager** | `payrollmanager@peoplepay360.com` | `PayrollManager@123` |
| **Employee** | `employee@peoplepay360.com` | `Employee@123` |

---

### Verification Commands

```bash
# Run production build check
cd frontend
npm run build

# Run linting check
npm run lint
```
