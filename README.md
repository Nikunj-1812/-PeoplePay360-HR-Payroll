# PeoplePay360 — HR & Payroll

> An integrated HR and Payroll Operations Platform that connects employee master data, contracts, working schedules, attendance, time off, salary configuration, payroll processing, payslips, document generation, employee delivery, and reporting into one connected workflow.

---

## 📌 Overview

PeoplePay360 is a centralized HR and Payroll platform built to manage the complete employee-to-payroll lifecycle.

Instead of treating employees, attendance, leave, contracts, salary configuration, and payroll as separate modules, PeoplePay360 connects them into one operational flow:

```text
Employee
   ↓
Contract + Working Schedule
   ↓
Attendance + Time Off
   ↓
Salary Structure + Salary Rules
   ↓
Payrun
   ↓
Payslip
   ↓
PDF / Email
   ↓
Payroll Dashboard
```

The goal is to provide HR and payroll teams with a system where data entered in one part of the application becomes meaningful input for the next stage of the workflow.

---

## 🎯 Problem Statement

Traditional HR systems can leave important employee, attendance, leave, contract, salary, and payroll information disconnected.

PeoplePay360 addresses this by creating an integrated workflow around the employee record.

The platform supports:

- Employee master management
- Historical contracts
- Working schedules
- Attendance and attendance exceptions
- Time Off Types
- Time Off Allocations
- Time Off Requests
- Salary Structures
- Ordered Salary Rules
- Payruns
- Payslips
- Payroll warnings and validation
- Payslip PDF generation
- Bulk payslip email delivery
- Payroll analytics and dashboard reporting

---

## ✨ Key Features

### 👥 Employee Management

Employees can be managed through:

- Kanban View
- List View
- Form View

Employee information includes work-related details such as:

- Department
- Manager
- Working Schedule
- Job Position
- Status

The Employee Form acts as the central hub for related HR information:

```text
Employee
 ├── Contracts
 ├── Attendance
 ├── Time Off
 └── Allocations
```

---

### 📄 Contract Management

Contracts are linked to employees and preserve historical employment information.

Important contract information includes:

- Start Date
- End Date
- Wage
- Department
- Position
- Salary Structure
- Status
- Employment Terms

The system identifies the contract applicable to the selected payroll period.

```text
Payroll Period
      ↓
Applicable Contract
      ↓
Contract Salary Context
      ↓
Payroll Calculation
```

Historical contracts remain available instead of being overwritten.

---

### 🕐 Working Schedules

Working Schedules define the employee's working pattern.

A schedule contains:

- Day
- Start Time
- End Time
- Break

Weekly hours are calculated automatically from the defined schedule.

```text
Daily Schedule
      ↓
Working Hours
      ↓
Break Adjustments
      ↓
Weekly Hours
```

---

### ⏱️ Attendance

Attendance supports:

- Check In
- Check Out
- Worked Hours
- Status
- Attendance Exceptions
- Manual Corrections

Operational statuses can include:

```text
Present
Late
Absent
Overtime
Missing Checkout
Corrected
```

Attendance information is available globally and from an employee record.

---

### 🏖️ Time Off

Time Off is divided into:

```text
Time Off Types
Allocations
Requests
```

#### Time Off Types

Defines policies such as:

- Days / Hours
- Allocation Requirement
- Approval Workflow
- Payroll Integration

#### Allocations

Tracks:

- Taken
- Remaining
- Validity Period

#### Requests

Contains:

- Employee
- Type
- Dates
- Duration
- Status

Approval workflow:

```text
Request
   ↓
Approve / Refuse
   ↓
If allocation is required
   ↓
Consume Allocation
   ↓
Update Remaining Balance
```

An allocation is not deducted merely because a request was created.

---

## 💰 Payroll

Payroll is the central business workflow of PeoplePay360.

### Salary Structures

Salary Structures organize Salary Rules.

A structure contains:

```text
Salary Structure
      ↓
Ordered Salary Rules
      ↓
Payroll Computation
```

### Salary Rules

Salary Rules support:

- Name
- Code
- Category
- Sequence
- Computation Method

Categories include:

```text
Basic
Allowances
Gross
Deductions
Net
```

Supported computation methods:

```text
Fixed Amount
Percentage
Formula
```

Rules execute in sequence, allowing later rules to use results from earlier rules.

Example:

```text
Basic
 ↓
Allowance
 ↓
Gross
 ↓
Deduction
 ↓
Net
```

---

## 🧾 Payrun

A Payrun groups Payslips for a specific payroll period.

A Payrun contains:

- Run Name
- Salary Structure
- Payroll Period
- Status
- Selected Employees
- Payslips

### Two-Step Payrun Creation

Payrun creation follows a two-step workflow.

#### Step 1 — Scope & Period

Select:

```text
Salary Structure
Period
```

Click:

```text
Continue
```

The Payrun is **not created yet**.

#### Step 2 — Employee Selection

The system displays eligible employees.

Users explicitly select the employees to include.

Only after:

```text
Create Payrun
```

is the Payrun initialized.

```text
NEW
 ↓
Step 1
Structure + Period
 ↓
Continue
 ↓
Step 2
Employee Selection
 ↓
Create Payrun
 ↓
Processing
```

Only selected employees are included in the Payrun.

---

## 🧮 Payroll Computation

The payroll engine connects the configured HR and salary information.

```text
Payrun
 ↓
Selected Employees
 ↓
Applicable Contract
 ↓
Salary Structure
 ↓
Ordered Salary Rules
 ↓
Salary Components
 ↓
Gross
 ↓
Deductions
 ↓
Net
 ↓
Payslip
```

Salary values must come from configured data and business rules rather than hardcoded dashboard or payslip values.

---

## ⚠️ Payroll Validation

Before finalizing payroll, the system can surface warnings such as:

- Missing Bank Details
- Duplicate Payslips
- Incomplete Employee Information
- Contract Attention
- Other payroll-relevant validation issues

Payrun actions include:

```text
Compute
Validate
Mark Paid
Send Payslips
```

Finalized and paid payroll records remain available as historical records.

---

## 🧾 Payslips

Payslips can be accessed from:

- Payrun
- Payslip List

A payslip can show:

- Employee
- Salary Structure
- Payroll Period
- Worked Days
- Salary Components
- Earnings
- Deductions
- Gross
- Net
- Payslip Status

The salary computation should be traceable to the configured Salary Rules.

---

## 📄 Payslip PDF

PeoplePay360 supports individual printable Payslip PDFs.

The generated document can contain:

- Employee information
- Payroll period
- Worked days
- Salary components
- Earnings
- Deductions
- Gross
- Net
- Payslip identification

---

## 📧 Bulk Payslip Email

A Payrun provides a bulk:

```text
Send Payslips
```

workflow.

Conceptually:

```text
Payrun
 ↓
Payslips
 ↓
Generate / Attach Payslip
 ↓
Nodemailer
 ↓
Employee Email
```

Email credentials remain server-side.

---

## 📊 Payroll Dashboard

The Payroll Dashboard provides a live overview of HR and payroll operations.

### KPI Cards

The dashboard can display:

- Total Net Salary Paid
- Payslips Generated
- Average Salary
- Approved Time Off
- Attendance Health

### Historical Charts

Includes:

- Salary Cost by Department
- Monthly Net Salary Trends

### Operational Alerts

Can surface:

- Payroll Statuses
- Missing Required Information
- Duplicate Payslips
- Contract Attention Items

### Attendance Overview

Can include:

- Present
- Late
- Absent
- Overtime
- Missing Check-outs
- Manual Edits
- Attendance Coverage

### Time Off Overview

Can include:

- Approved Days
- Pending Requests
- Leave Balances

### Department Breakdown

Combines:

- Headcount
- Total Salary Expenditure

### Dashboard Filters

Supports:

```text
Period
Department
Employee Type
```

Dashboard values should be calculated from real application data.

---

# 👤 User Roles

PeoplePay360 defines five primary roles.

| Role | Access |
|---|---|
| **Employee** | Own employee details, own attendance, own leave balances, attendance entries, Time Off Requests |
| **HR Manager** | Full CRUD for Employees, Attendance, Contracts, Working Schedules, Time Off; approve/refuse Time Off |
| **HR Payroll User** | HR Manager permissions + Payruns/Payslips Create/Read/Update + read-only Salary Structures/Rules |
| **HR Payroll Manager** | HR Payroll User permissions + full CRUD for Payruns, Payslips, Salary Structures and Salary Rules |
| **Admin** | Full system access, including user management and role assignment |

Authorization must be enforced on the backend.

---

# 🎨 Design System

PeoplePay360 uses a professional enterprise HR/payroll visual language.

### Color Palette

| Purpose | Color |
|---|---|
| **Primary** | `#B3CFE5` |
| **Deep Navy** | `#0A1931` |
| **Secondary Blue** | `#4A7FA7` |
| **Secondary Navy** | `#1A3D63` |
| **Light Background** | `#F6FAFD` |

### Typography

```text
Inter, sans-serif
```

### Themes

The application supports:

```text
☀ Light Mode
☾ Dark Mode
```

Primary brand color remains:

```text
#B3CFE5
```

in both themes.

The interface follows the project's `design.md` and `agents.md`.

---

# 🛠️ Technology Stack

PeoplePay360 follows a PERN-oriented architecture.

## Frontend

- React
- TypeScript where configured
- shadcn/ui
- Axios
- Lucide Icons
- Recharts where required

## Backend

- Node.js
- Express
- TypeScript / existing backend conventions

## Database

- PostgreSQL
- Neon PostgreSQL

## Supporting Services

- Cloudinary
- Nodemailer

### Architecture

```text
┌──────────────────────────────┐
│          React UI            │
│   shadcn/ui + Axios          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Express API            │
│ Routes → Controllers         │
│        → Services            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      PostgreSQL / Neon       │
└──────────────────────────────┘

Additional Services:
Cloudinary → Hosted Media
Nodemailer → Email Delivery
PDF Service → Payslip Documents
```

---

# 📁 Project Structure

The exact structure should follow the existing repository. The intended organization is:

```text
PeoplePay360/
│
├── README.md
├── context.md
├── agents.md
├── design.md
├── .gitignore
├── .env
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── api/
│       ├── types/
│       ├── utils/
│       └── lib/
│
└── backend/
    └── src/
        ├── routes/
        ├── controllers/
        ├── services/
        ├── models/
        ├── middleware/
        ├── utils/
        └── config/
```

If the existing repository has a different coherent structure, preserve the existing architecture rather than unnecessarily restructuring the project.

---

# 🔐 Environment Variables

Create a `.env` file in the appropriate backend/project location.

Typical configuration:

```env
DATABASE_URL=your_neon_postgresql_connection_string

PORT=5000

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=your_sender_email
```

Use the variable names already established by the existing project if they differ.

**Never commit real secrets.**

Do not expose server-only credentials to the frontend.

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd PeoplePay360
```

## 2. Install Dependencies

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

If the repository uses a different package manager, follow the existing lockfile and project configuration.

---

## 3. Configure Environment Variables

Create the required `.env` file using the project's environment variable names.

At minimum, configure the PostgreSQL/Neon database connection.

For email and media functionality, configure:

```text
Cloudinary
SMTP / Nodemailer
```

---

## 4. Start the Backend

From the backend directory:

```bash
npm run dev
```

---

## 5. Start the Frontend

From the frontend directory:

```bash
npm run dev
```

The exact scripts depend on the existing package configuration.

---

# 🗄️ Database

The application uses PostgreSQL through Neon.

The logical domain contains relationships around:

```text
User
Role
Employee
Contract
Working Schedule
Attendance
Time Off Type
Time Off Allocation
Time Off Request
Salary Structure
Salary Rule
Payrun
Payslip
Payslip Lines / Salary Computation
```

The database should preserve relationships and historical records.

---

# 🔄 Core Business Rules

### Contract Rule

Payroll uses the contract applicable to the selected payroll period.

### Schedule Rule

Weekly hours are calculated from the configured daily schedule.

### Time Off Rule

Approved requests consume allocation only when the Time Off Type requires allocation.

### Salary Rule

Salary Rules execute according to sequence.

### Payroll Rule

Payslips use the Payrun's selected employees, applicable contract, salary structure, period, and ordered Salary Rules.

### Dashboard Rule

Dashboard metrics are derived from actual persisted records.

### Historical Data Rule

Historical contracts, finalized Payruns, paid Payruns, and historical Payslips must remain available.

---

# 🔒 Security

Important security principles:

- Never commit `.env`
- Never expose database credentials to the frontend
- Never expose SMTP passwords
- Never expose Cloudinary private secrets
- Never expose JWT secrets
- Enforce authorization on the backend
- Validate important business operations server-side
- Do not trust frontend-only role checks

---

# 🧪 Testing Priorities

The highest-value areas to test are:

```text
Authentication
Role Permissions
Employee CRUD
Contract Selection
Working Hour Calculation
Attendance
Time Off Approval
Allocation Deduction
Salary Rule Sequencing
Payroll Calculation
Payrun Employee Selection
Payroll Validation
Payslip Generation
PDF Generation
Bulk Email
Dashboard Aggregations
Theme Switching
```

Particular attention should be given to payroll calculations and state transitions.

---

# 🎬 Hackathon Demo Flow

The recommended five-minute demonstration focuses on two connected scenarios.

## Scenario 1 — Employee → Payslip

```text
Dashboard
 ↓
Employees
 ↓
Employee Form
 ↓
Contract
 ↓
Attendance
 ↓
Payroll
 ↓
New Payrun
 ↓
Step 1: Salary Structure + Period
 ↓
Step 2: Employee Selection
 ↓
Create Payrun
 ↓
Compute
 ↓
Review Warnings
 ↓
Payslip
 ↓
Validate
 ↓
Mark Paid
 ↓
Generate PDF
 ↓
Send Payslips
```

## Scenario 2 — Allocation → Time Off Request

```text
Time Off
 ↓
Allocation
 ↓
Employee Request
 ↓
HR Manager
 ↓
Approve
 ↓
Allocation Balance Updated
```

The demonstration should emphasize that data flows between modules instead of showing disconnected CRUD screens.

---

# 📚 Project Documentation

The repository contains three important project documents:

### `context.md`

Defines:

```text
What PeoplePay360 is
Business requirements
Modules
Roles
Workflows
Business rules
Technology direction
Complete project context
```

### `agents.md`

Defines:

```text
How coding agents should work
Architecture rules
Implementation constraints
Development rules
Testing expectations
Definition of Done
```

### `design.md`

Defines:

```text
Visual language
Color palette
Typography
Light/Dark Mode
Components
Spacing
Responsive behavior
Accessibility
UI rules
```

Together:

```text
Problem Statement
      ↓
context.md
      ↓
agents.md + design.md
      ↓
Implementation
```

---

# 🧭 Development Principles

1. Build connected workflows, not isolated CRUD pages.
2. Keep the problem statement as the business source of truth.
3. Use real PostgreSQL/Neon data.
4. Keep payroll calculations on the backend.
5. Preserve historical payroll and contract data.
6. Enforce permissions server-side.
7. Reuse existing components and services.
8. Keep the UI consistent with `design.md`.
9. Support both Light and Dark Mode.
10. Avoid hardcoded payroll/dashboard values.
11. Validate business-critical operations.
12. Prefer simple, maintainable architecture over unnecessary complexity.

---

# ✅ MVP Completion Checklist

## HR

- [ ] Employee Kanban
- [ ] Employee List
- [ ] Employee Form
- [ ] Contract Management
- [ ] Working Schedules
- [ ] Attendance
- [ ] Attendance Exceptions
- [ ] Time Off Types
- [ ] Time Off Allocations
- [ ] Time Off Requests
- [ ] Approval / Refusal Workflow

## Payroll

- [ ] Salary Structures
- [ ] Salary Rules
- [ ] Rule Sequence
- [ ] Two-Step Payrun Wizard
- [ ] Employee Selection
- [ ] Payrun Computation
- [ ] Payroll Warnings
- [ ] Payslip Generation
- [ ] Payslip Validation
- [ ] Mark Paid
- [ ] Payslip PDF
- [ ] Bulk Payslip Email

## Dashboard

- [ ] Net Salary KPI
- [ ] Payslip KPI
- [ ] Average Salary KPI
- [ ] Approved Time Off KPI
- [ ] Attendance Health
- [ ] Department Salary Cost
- [ ] Monthly Net Salary Trend
- [ ] Payroll Alerts
- [ ] Attendance Overview
- [ ] Time Off Overview
- [ ] Department Breakdown
- [ ] Period Filter
- [ ] Department Filter
- [ ] Employee Type Filter

## Platform

- [ ] Role-Based Access
- [ ] Backend Authorization
- [ ] PostgreSQL / Neon
- [ ] Cloudinary
- [ ] Nodemailer
- [ ] PDF Generation
- [ ] Responsive UI
- [ ] Light Mode
- [ ] Dark Mode
- [ ] Loading States
- [ ] Empty States
- [ ] Error States
- [ ] Accessibility Basics

---

# 🏆 Definition of Success

PeoplePay360 is successful when a reviewer can follow a realistic workflow from:

```text
Employee
→ Contract
→ Schedule
→ Attendance / Time Off
→ Salary Configuration
→ Payrun
→ Payslip
→ PDF / Email
→ Dashboard
```

and see that the information is connected, persisted, calculated, validated, and presented consistently.

The project should demonstrate **business correctness first, end-to-end integration second, and visual polish third**.

---

## 📌 Final Product Statement

**PeoplePay360 is a connected HR and Payroll Operations Platform that transforms employee, attendance, leave, contract, salary, and payroll information into a unified operational workflow—from employee onboarding and daily HR operations to payroll computation, payslip delivery, and management reporting.**
