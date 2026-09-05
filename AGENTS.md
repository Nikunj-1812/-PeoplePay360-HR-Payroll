# PeoplePay360 — AGENTS.md

> This file is the implementation contract for AI coding agents working on PeoplePay360.
> Follow the problem statement and `design.md` as the source of truth. Do not invent business requirements that are not supported by those documents.

---

# 1. Mission

Build **PeoplePay360**, an integrated HR & Payroll Operations Platform.

This is **not** a simple employee CRUD application.

The core product relationship is:

```text
Employee
   ↓
Contract + Working Schedule
   ↓
Attendance + Time Off
   ↓
Salary Structure + Ordered Salary Rules
   ↓
Payrun
   ↓
Payslip
   ↓
PDF + Email
   ↓
Payroll Dashboard
```

The problem statement explicitly prioritizes:

- correct business logic
- data relationships
- period-based contract handling
- schedule calculations
- leave allocation and consumption
- ordered salary-rule computation
- payroll warnings and validation
- historical payroll records
- role-based permissions
- live dashboard data
- PDF payslips
- bulk email delivery

Do not optimize only for visual appearance.

---

# 2. Source of Truth

Before implementing or modifying a feature, consult:

```text
1. Problem Statement PDF
2. design.md
3. Existing frontend structure
4. Existing backend structure
5. Existing database/schema configuration
```

Priority:

```text
Problem Statement
      ↓
design.md
      ↓
Existing architecture
      ↓
Implementation decision
```

If a requested feature conflicts with the problem statement, preserve the problem statement.

If a requirement is not defined, prefer the smallest implementation that fits the existing architecture instead of inventing a complex feature.

---

# 3. Existing Product Direction

The application uses a **PERN-oriented architecture** with:

```text
Frontend
React
TypeScript
shadcn/ui
Axios
TanStack Query where already configured

Backend
Node.js
Express
TypeScript/JavaScript according to existing backend
PostgreSQL
Neon PostgreSQL

Services
Cloudinary
Nodemailer

UI
shadcn/ui
Lucide icons
Inter font

Charts
Recharts where required

PDF
Use the existing PDF generation implementation/library in the project.
```

Do not replace the existing stack unless explicitly requested.

Do not introduce another UI framework when shadcn/ui can solve the requirement.

---

# 4. Design System Is Mandatory

The visual source of truth is `design.md`.

## Primary Brand Color

```text
#B3CFE5
```

This is the project's primary color.

Use it for:

- primary buttons
- selected navigation
- active tabs
- focused controls
- important highlights
- chart accents
- primary UI emphasis

Text/icons placed on `#B3CFE5` must use:

```text
#0A1931
```

## Core Palette

```text
#B3CFE5 → PRIMARY
#0A1931 → DEEP NAVY
#4A7FA7 → SECONDARY BLUE
#1A3D63 → NAVY SECONDARY
#F6FAFD → LIGHT BACKGROUND
```

Do not silently change the palette.

Do not make `#4A7FA7` the primary brand color.

---

# 5. Typography

Use a minimal typography system.

Primary font:

```text
Inter
```

Fallback:

```text
sans-serif
```

Do not introduce decorative fonts.

Keep typography compact because the application contains operational tables and forms.

---

# 6. Theme Requirements

PeoplePay360 must support:

```text
Light Mode
Dark Mode
```

Theme switching must be global.

Recommended strategy:

```text
Theme Toggle
      ↓
localStorage
      ↓
<html class="dark">
      ↓
CSS variables
      ↓
Entire application
```

Theme toggle location:

```text
Search → Notifications → Theme Toggle → User Menu
```

Use a compact:

```text
☀ / ☾
```

control using shadcn/ui.

The primary brand color remains:

```text
#B3CFE5
```

in both themes.

Light mode:

```text
Background: #F6FAFD
Cards:      #FFFFFF
Text:       #0A1931
Primary:    #B3CFE5
```

Dark mode:

```text
Background: #0A1931
Cards:      #102744
Text:       #F6FAFD
Primary:    #B3CFE5
```

---

# 7. UI Principles

The application must look:

- professional
- trustworthy
- financially reliable
- operational
- modern
- data-driven
- calm

Avoid:

- excessive gradients
- glassmorphism
- neon UI
- oversized typography
- excessive rounded cards
- decorative animations
- consumer/social-media styling
- random colors
- inconsistent component styles

Prefer:

```text
Borders > Heavy Shadows
Information Density > Decoration
Clear Hierarchy > Visual Noise
Real Data > Fake Data
Business State > Decorative Status
```

---

# 8. Component Rules

Use **shadcn/ui** for standard UI components.

Prefer:

```text
Button
Input
Label
Select
Combobox
Checkbox
RadioGroup
Switch
Textarea
Calendar
Date Picker
Tabs
Badge
Card
Table
Dialog
Sheet
DropdownMenu
Popover
Tooltip
Alert
AlertDialog
Breadcrumb
Pagination
Skeleton
Sonner/Toast
Command
Separator
```

Use Lucide icons.

Do not create custom versions of components that already exist in shadcn/ui unless there is a real product-specific reason.

Create reusable application-level components for repeated patterns.

---

# 9. Application Shell

The main application structure should be:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Header                                                  │
├──────────────────┬──────────────────────────────────────────┤
│                  │ Page Header                              │
│ Sidebar          ├──────────────────────────────────────────┤
│                  │                                          │
│ Dashboard        │ Main Content                             │
│ Employees        │                                          │
│ Contracts        │                                          │
│ Schedules        │                                          │
│ Attendance       │                                          │
│ Time Off         │                                          │
│ Payroll          │                                          │
│ Salary Rules     │                                          │
│ Reports          │                                          │
│ Settings         │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

Sidebar dark surface:

```text
#0A1931
```

Active item:

```text
background: #B3CFE5
text: #0A1931
```

---

# 10. Navigation

The problem statement defines the major operational areas:

```text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

The implementation may expose supporting configuration screens:

```text
Working Schedules
Salary Structures
Salary Rules
Settings
```

Navigation must respect role permissions.

Never display an administration action simply because the frontend route exists.

Backend authorization remains mandatory.

---

# 11. Role-Based Access Control

The five roles from the problem statement are:

## Employee

Can:

- view own employee details
- view own attendance
- view own leave balances
- create attendance entries
- create Time Off Requests

Cannot access:

- HR administration
- payroll administration

## HR Manager

Can fully manage:

```text
Employees
Attendance
Contracts
Working Schedules
Time Off
```

Can:

```text
Approve Time Off
Refuse Time Off
```

Cannot access payroll features.

## HR Payroll User

Has HR Manager permissions plus:

```text
Payruns → Create / Read / Update
Payslips → Create / Read / Update
```

Has read-only access to:

```text
Salary Structures
Salary Rules
```

## HR Payroll Manager

Has full control over:

```text
HR
Payroll
Payruns
Payslips
Salary Structures
Salary Rules
```

## Admin

Has:

```text
Everything
User management
Role assignment
Permission updates
System administration
```

### Critical Rule

Frontend route protection is not enough.

Every protected API operation must also be authorized by the backend.

---

# 12. Employee Module

Employee is the central operational hub.

Support:

```text
Kanban
List
Form
```

Employee form should contain:

```text
Personal Information
Employment Information
Organization
Working Schedule
Contact Information
Status
```

Employee information should include the business attributes required by the problem statement:

```text
Department
Manager
Schedule
Job Position
Status
```

The employee form should provide smart links/actions for:

```text
Contracts
Attendance
Time Off
Allocations
Payslips
```

These links should open filtered related records where applicable.

---

# 13. Contract Logic

Contracts are historical records.

A contract must support:

```text
Employee
Contract Number
Start Date
End Date
Department
Position
Wage
Salary Structure
Status
```

### Critical Business Rule

Payroll must use the contract applicable to the selected payroll period.

Do not simply use:

```text
latest contract
```

or:

```text
first contract
```

Correct concept:

```text
Payrun Period
      ↓
Find contract valid for that period
      ↓
Validate conflicts
      ↓
Use applicable wage + salary structure
```

Do not allow concurrent active contracts for the same employee and applicable period.

The active contract must be visually obvious in the UI.

---

# 14. Working Schedule Logic

Schedules define:

```text
Day
Start Time
End Time
Break
```

Support a weekly pattern.

Calculate weekly hours automatically.

Do not ask users to manually enter calculated weekly hours.

Example:

```text
Monday     09:00 → 18:00
Break      01:00

Weekly Hours: 40h
```

Schedules can be assigned to employees or contracts according to the existing data model.

---

# 15. Attendance Logic

Attendance records contain:

```text
Employee
Date
Check In
Check Out
Worked Hours
Status
```

Possible statuses include:

```text
Present
Late
Absent
Overtime
Missing Checkout
Manual Correction
```

Worked hours must be derived from attendance/schedule rules rather than hardcoded display values.

Authorized users can manually correct attendance.

A missing checkout must surface as an exception.

Flow:

```text
Missing Checkout
      ↓
Warning
      ↓
Open Record
      ↓
Correct
      ↓
Updated Status / Audit information
```

Do not silently overwrite attendance records.

---

# 16. Time Off Logic

Time Off contains:

```text
Requests
Allocations
Time Off Types
```

Time Off Types define:

```text
Unit
Allocation requirement
Approval workflow
Payroll integration
```

Allocations track:

```text
Taken
Remaining
Validity
```

### Critical Rule

Approved requests must automatically consume the relevant allocation when the leave type requires allocation.

Flow:

```text
Allocation
   ↓
Time Off Request
   ↓
Approval
   ↓
Balance Deduction
   ↓
Remaining Balance Updated
```

Do not deduct a balance merely because a request was created.

---

# 17. Salary Structures

Salary Structures are containers for Salary Rules.

A structure should expose:

```text
Name
Number of Rules
Employees
Active Status
```

The structure defines which rules are applied to a Payrun.

Rule ordering must be visible.

Example:

```text
1. Basic Salary
2. HRA
3. Allowance
4. Gross Salary
5. PF
6. Tax
7. Net Salary
```

---

# 18. Salary Rule Engine

Salary Rules are business logic, not decorative configuration.

Each rule should contain:

```text
Name
Code
Category
Sequence
Computation Type
Value / Formula
Active
```

Categories:

```text
Basic
Allowances
Gross
Deductions
Net
```

Computation types:

```text
Fixed Amount
Percentage
Formula
```

### Critical Rule

Rules must execute according to sequence.

Example:

```text
Basic
 ↓
HRA based on Basic
 ↓
Allowances
 ↓
Gross
 ↓
PF / Tax / Deductions
 ↓
Net
```

Do not hardcode final salary amounts in the payslip.

Payslips must be generated from the selected Salary Structure and its active ordered Salary Rules.

---

# 19. Payrun Creation

Creating a Payrun must use the required **two-step wizard**.

## Step 1

Collect:

```text
Salary Structure
Period From
Period To
```

Clicking Continue must **not create the Payrun yet**.

## Step 2

Show eligible employees.

Allow explicit employee selection.

Only after:

```text
Create Payrun
```

should the Payrun record be initialized.

Flow:

```text
NEW
 ↓
Step 1: Scope + Period
 ↓
Continue
 ↓
Step 2: Eligible Employees
 ↓
Select Employees
 ↓
Create Payrun
 ↓
Processing Screen
```

Do not bypass the employee-selection step.

---

# 20. Payrun State Machine

Use explicit states.

Recommended:

```text
Draft
 ↓
Computing
 ↓
Computed
 ↓
Validated
 ↓
Paid
```

Failure should be represented explicitly:

```text
Computing
 ↓
Failed
```

Actions:

```text
Compute
Validate
Mark Paid
Send Payslips
```

Do not allow invalid state transitions.

Example:

```text
Draft → Paid
```

should not be allowed without the required processing/validation flow.

---

# 21. Payroll Validation

Before finalization, surface issues such as:

```text
Missing bank details
Duplicate payslip
Incomplete employee data
Missing applicable contract
Invalid salary configuration
Attendance exceptions where relevant
```

Warnings must be visible on the Payrun processing screen.

Critical issues should block the appropriate finalization action.

Never hide payroll errors behind a generic "success" response.

---

# 22. Payslip Computation

A Payslip should expose:

```text
Employee
Salary Structure
Payrun
Period
Status
Worked Days
```

Salary computation must show:

```text
Basic
Allowances
Gross
Deductions
Net
```

The calculation must use:

```text
Applicable Period Contract
+
Payrun Salary Structure
+
Ordered Salary Rules
+
Relevant attendance/time-off context
```

Do not hardcode payslip totals.

---

# 23. Payslip PDF

The Payrun/Payslip workflow must support printable PDF generation.

PDF should contain the meaningful payslip information required by the problem:

```text
Employee details
Payroll period
Worked days
Salary components
Earnings
Deductions
Gross
Net
Payslip reference / relevant identifiers
```

The UI must clearly show whether PDF generation succeeded or failed.

---

# 24. Bulk Email

A Payrun must provide:

```text
Send Payslips
```

Use Nodemailer through the backend.

Show useful delivery information:

```text
Ready
Missing Email
Sent
Failed
```

Do not expose SMTP credentials to the frontend.

Do not send emails directly from React.

Correct flow:

```text
React
 ↓
Axios
 ↓
Express API
 ↓
Nodemailer
 ↓
Employee Email
```

---

# 25. Cloudinary

Use Cloudinary only for file/media functionality that actually requires hosted assets.

Potential appropriate use:

```text
Employee profile images
Company logo
Other application assets
```

Do not upload every generated PDF to Cloudinary unless the current architecture specifically requires it.

Never expose Cloudinary secrets to the frontend.

---

# 26. Axios/API Rules

Keep API communication centralized.

Prefer:

```text
services/
api/
hooks/
```

instead of scattering raw Axios calls throughout UI components.

Example conceptual structure:

```text
apiClient
   ↓
employeeService
contractService
attendanceService
timeOffService
payrollService
salaryService
dashboardService
```

Handle:

```text
401
403
404
422
500
network errors
```

consistently.

---

# 27. Data Fetching

Prefer server-backed data.

The problem statement explicitly requires the Payroll Dashboard to use live data.

Do not create fake static dashboard numbers such as:

```text
Total Salary = 4,52,000
Employees = 42
```

unless those are actual seeded database values.

The source should be:

```text
PostgreSQL
 ↓
Backend Services
 ↓
API
 ↓
Axios / Query Layer
 ↓
UI
```

---

# 28. Database Rules

PostgreSQL/Neon is the source of truth.

Design relationships around:

```text
Employee
Contract
WorkingSchedule
Attendance
TimeOffType
TimeOffAllocation
TimeOffRequest
SalaryStructure
SalaryRule
Payrun
Payslip
PayslipLine / Salary Computation
User
Role / Permissions
```

Exact schema names should follow the existing backend/schema.

Use foreign keys and constraints where appropriate.

Do not duplicate business-critical data unnecessarily.

---

# 29. Transactional Operations

Operations affecting multiple records should be handled transactionally when supported by the existing database layer.

Examples:

### Approving Leave

```text
Approve Request
+
Deduct Allocation
```

### Creating/Computing Payroll

```text
Payrun
+
Payslips
+
Payslip Lines
```

### Marking Payroll Paid

```text
Payrun Status
+
Relevant Payslip Statuses
```

Do not leave partially updated payroll state after a failure.

---

# 30. Historical Data

Payroll and contract history matters.

Do not overwrite historical payroll records simply to show the latest state.

The system must preserve finalized/paid Payruns as historical records.

Contracts must remain queryable historically.

When calculating a past Payrun, use the contract and Salary Structure applicable to that payroll period.

---

# 31. Dashboard

Payroll Dashboard must aggregate real data from:

```text
Employees
Contracts
Attendance
Time Off
Payroll
```

Required KPIs include:

```text
Total Net Salary Paid
Payslips Generated
Average Salary
Approved Time Off
Attendance Health
```

Charts include:

```text
Salary Cost by Department
Monthly Net Salary Trends
```

Operational insights should include:

```text
Payroll warnings
Missing required information
Duplicate payslips
Contract attention items
Attendance overview
Time Off overview
Department breakdown
```

Filters:

```text
Period
Department
Employee Type
```

Changing filters should update the dashboard data.

---

# 32. Employee Dashboard Relationship

Employee should remain the central hub.

From an employee record, users should be able to reach related:

```text
Contracts
Attendance
Time Off
Allocations
Payslips
```

Do not force users to manually search through unrelated global tables for records that belong to the current employee.

---

# 33. Forms

Use consistent form patterns:

```text
Label
Input
Helper text
Validation
```

Recommended validation stack:

```text
React Hook Form
+
Zod
```

if already compatible with the current frontend.

Validate both:

```text
Frontend
Backend
```

Never trust frontend validation alone.

---

# 34. Tables

Major modules are table-heavy.

Tables must support where appropriate:

```text
Search
Filtering
Sorting
Pagination
Row actions
Status badges
Loading states
Empty states
Responsive horizontal scrolling
```

Do not sacrifice readability just to make tables fit on mobile.

---

# 35. Status Badges

Use explicit statuses.

Employee:

```text
Active
Inactive
```

Contract:

```text
Active
Expired
Upcoming
```

Attendance:

```text
Present
Late
Absent
Overtime
Missing Checkout
Corrected
```

Time Off:

```text
Pending
Approved
Refused
Cancelled
```

Payrun:

```text
Draft
Computing
Computed
Validated
Paid
Failed
```

Payslip:

```text
Draft
Generated
Sent
Failed
```

Do not communicate important states using color alone.

---

# 36. Loading / Empty / Error States

Every API-driven screen must have:

```text
Loading state
Empty state
Error state
Success state
```

Use shadcn skeletons for tables/cards where useful.

Example:

```text
No employees found.

Try changing your filters or add your first employee.

[+ Add Employee]
```

API error:

```text
Unable to load employees.
[Retry]
```

Do not leave blank screens.

---

# 37. Confirmation Rules

Require confirmation for consequential operations.

Examples:

```text
Delete Employee
Delete Salary Rule
Refuse Time Off
Mark Payrun as Paid
Send Payslips
```

Payroll finalization must be especially explicit.

Example:

```text
Mark Payrun as Paid?

This will finalize the selected payroll batch.

[Cancel] [Mark as Paid]
```

---

# 38. Security Rules

Never commit:

```text
DATABASE_URL
SMTP_PASSWORD
SMTP_SECRET
CLOUDINARY_SECRET
API_KEYS
JWT_SECRET
SESSION_SECRET
```

Use environment variables.

Never expose server secrets through React environment variables.

Frontend-exposed variables must be intentionally public.

Backend-only secrets stay backend-only.

---

# 39. `.env` Rules

The existing project already contains PostgreSQL/Neon configuration.

Agents must:

- inspect the existing `.env` and `.env.example`
- preserve existing variable names
- add only missing variables required by the implementation
- never replace a valid existing database URL
- never commit `.env`

Typical backend variables may include:

```text
DATABASE_URL
PORT
JWT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
```

Use the project's existing naming conventions if they differ.

---

# 40. Error and API Response Contract

Prefer consistent backend responses.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Human-readable error",
  "code": "OPTIONAL_ERROR_CODE"
}
```

Do not force this exact shape if the existing backend already has an established response contract. Extend the existing contract consistently instead.

---

# 41. Backend Service Boundaries

Avoid putting all business logic in Express route handlers.

Prefer:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Database
```

Payroll should have dedicated business logic.

Example:

```text
payrollService
 ├── resolveApplicableContract()
 ├── validatePayrun()
 ├── computePayslip()
 ├── executeSalaryRules()
 ├── generatePayslips()
 └── finalizePayrun()
```

Exact names may follow the existing project.

---

# 42. Payroll Engine Rules

The payroll engine must:

1. receive a Payrun period
2. identify selected employees
3. find the applicable contract for each employee
4. validate the contract
5. obtain the Payrun Salary Structure
6. load active Salary Rules
7. order rules by sequence
8. calculate components
9. calculate Gross
10. calculate Deductions
11. calculate Net
12. generate Payslip records
13. surface warnings/errors
14. persist results

Conceptually:

```text
Payrun
  ↓
Employees
  ↓
Applicable Contract
  ↓
Salary Structure
  ↓
Ordered Salary Rules
  ↓
Rule Execution
  ↓
Earnings
  ↓
Gross
  ↓
Deductions
  ↓
Net
  ↓
Payslip
```

---

# 43. Avoid Hardcoding

Never hardcode:

```text
salary totals
employee counts
dashboard KPIs
leave balances
weekly hours
payroll results
salary rule results
```

unless they are database seed values.

The problem statement specifically requires business rules to be implemented in application logic rather than hardcoded.

---

# 44. Seed Data

The application needs representative data for the live demonstration.

Seed data should demonstrate:

```text
Multiple employees
Departments
Managers
Contracts
Working schedules
Attendance
Time Off Types
Allocations
Requests
Salary Structures
Salary Rules
Payruns
Payslips
```

Include data that can demonstrate:

```text
active contract
historical contract
attendance exception
leave approval
salary computation
payroll warning
payslip PDF
email delivery
dashboard aggregation
```

Do not use unrealistic random data that prevents the workflows from making sense.

---

# 45. Demo Scenarios

The product must support the requested five-minute demonstration.

## Scenario A — Employee to Payslip

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
Review warnings
 ↓
Review Payslip
 ↓
Validate
 ↓
Mark Paid
 ↓
Generate PDF
 ↓
Send Payslip
```

## Scenario B — Leave Workflow

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
 ↓
Dashboard / Employee Balance
```

These workflows should not require excessive navigation.

---

# 46. Performance Rules

Do not fetch entire datasets when a filtered/paginated API can be used.

Avoid:

```text
fetch all employees
fetch all attendance
fetch all payslips
```

for dashboard/list pages.

Prefer server-side:

```text
pagination
filtering
aggregation
date filtering
department filtering
employee-type filtering
```

especially for payroll and dashboard queries.

---

# 47. Responsive Rules

Desktop is the primary environment.

Desktop:

```text
Persistent sidebar
Wide tables
Multi-column dashboards
```

Tablet:

```text
Collapsible sidebar
Responsive cards
Scrollable tables
```

Mobile:

```text
Compact header
Drawer navigation
Single-column forms
Horizontally scrollable data tables
```

Do not destroy important table columns merely to avoid horizontal scrolling.

---

# 48. Accessibility

Every feature must support:

- keyboard navigation
- visible focus
- semantic controls
- accessible labels
- dialog accessibility
- table headers
- icon button labels
- sufficient contrast
- status text in addition to status colors

For the primary color:

```text
Background: #B3CFE5
Text/Icon:  #0A1931
```

Do not use color alone to communicate:

```text
Approved
Failed
Warning
Paid
Pending
```

---

# 49. Animation

Animations should be minimal.

Allowed:

```text
hover transitions
dialog transitions
dropdown transitions
sidebar transitions
theme transition
loading indicators
```

Avoid:

```text
large page transitions
bouncing UI
excessive motion
decorative animations
```

Use approximately:

```css
transition:
  background-color 150ms ease,
  color 150ms ease,
  border-color 150ms ease;
```

---

# 50. File and Code Organization

Respect the existing folder structure.

Do not restructure the entire repository unless necessary.

Preferred conceptual frontend organization:

```text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── payroll/
├── pages/
│   ├── dashboard/
│   ├── employees/
│   ├── contracts/
│   ├── schedules/
│   ├── attendance/
│   ├── time-off/
│   ├── payroll/
│   ├── salary-structures/
│   ├── salary-rules/
│   ├── reports/
│   └── settings/
├── hooks/
├── services/
├── api/
├── types/
├── utils/
└── lib/
```

Use the existing project structure when it already provides equivalent organization.

---

# 51. Coding Standards

Before writing code:

```text
Inspect existing implementation
Understand data flow
Reuse existing components
Reuse existing API patterns
Reuse existing naming conventions
```

When modifying code:

```text
Make the smallest safe change
Do not rewrite unrelated files
Do not remove working functionality
Do not introduce duplicate abstractions
```

Use TypeScript types where TypeScript is already configured.

Avoid:

```text
any
```

when a real type can be defined.

---

# 52. State Management

Do not introduce global state for data that can remain local.

Use:

```text
Local state
```

for UI-only state.

Use the existing query/data-fetching layer for server state.

Examples of server state:

```text
Employees
Contracts
Attendance
Time Off
Payruns
Payslips
Dashboard metrics
```

Examples of local UI state:

```text
Dialog open/closed
Selected tab
View mode
Theme toggle
Wizard step
```

---

# 53. Theme State

Theme state is application-wide.

Recommended:

```text
ThemeProvider
+
localStorage
+
dark class
```

Do not implement separate theme logic independently on each page.

---

# 54. Routing

Routes should represent business modules clearly.

Conceptually:

```text
/dashboard

/employees
/employees/:id

/contracts
/contracts/:id

/schedules
/schedules/:id

/attendance
/attendance/:id

/time-off/requests
/time-off/allocations
/time-off/types

/payroll/payruns
/payroll/payruns/new
/payroll/payruns/:id

/payroll/payslips
/payroll/payslips/:id

/payroll/salary-structures
/payroll/salary-rules

/reports

/settings
```

Follow existing routing conventions if already implemented.

---

# 55. Testing Priorities

If tests are available, prioritize business logic over visual snapshots.

Highest priority:

```text
Applicable contract selection
Contract overlap validation
Weekly schedule calculation
Leave balance deduction
Salary rule ordering
Salary calculation
Payrun state transitions
Duplicate payslip detection
Payroll warnings
Role permissions
Dashboard aggregation
```

These are more important than testing decorative UI details.

---

# 56. Critical Acceptance Criteria

A feature is not complete merely because its page renders.

A feature is complete only when:

```text
UI
 ↓
API
 ↓
Business Logic
 ↓
Database
```

works end-to-end.

For example, Salary Rules are not complete if:

```text
Salary Rule Form works
```

but:

```text
Payrun ignores Salary Rules
```

Similarly, Dashboard is not complete if:

```text
Chart renders
```

but:

```text
Chart uses hardcoded values
```

---

# 57. Definition of Done

Before marking a task complete, verify:

## Functional

- [ ] Business requirement implemented
- [ ] Database persistence works
- [ ] API works
- [ ] Frontend consumes real API
- [ ] Validation exists
- [ ] Permissions enforced
- [ ] Error handling exists
- [ ] Loading state exists
- [ ] Empty state exists

## Payroll

- [ ] Applicable contract selected by period
- [ ] Salary Structure actually controls rules
- [ ] Salary Rules execute by sequence
- [ ] Gross/Deductions/Net are computed
- [ ] Warnings surface before finalization
- [ ] Payrun state transitions are valid
- [ ] Historical records remain available
- [ ] Payslip is generated from actual computation
- [ ] PDF generation works
- [ ] Bulk email workflow works

## UI

- [ ] `#B3CFE5` is the primary color
- [ ] `#0A1931` is used for primary text on primary surfaces
- [ ] Palette is consistent
- [ ] Inter is used
- [ ] Light mode works
- [ ] Dark mode works
- [ ] Theme persists
- [ ] shadcn/ui is used
- [ ] Responsive behavior works
- [ ] Accessibility basics work

---

# 58. Git Rules

Never commit:

```text
.env
.env.local
.env.production
credentials
private keys
API secrets
SMTP passwords
database passwords
```

Before committing:

```text
git status
```

Check that secrets are not staged.

Prefer focused commits.

Example:

```text
feat: implement payroll computation engine
feat: add payrun creation wizard
feat: add payslip PDF generation
fix: prevent overlapping contracts
fix: update leave allocation on approval
```

---

# 59. AI Agent Rules

When an AI coding agent receives a task:

### Step 1

Inspect the relevant files.

### Step 2

Identify whether the task affects:

```text
UI
API
Database
Business Logic
Permissions
```

### Step 3

Trace the existing implementation before creating new code.

### Step 4

Implement the business rule.

### Step 5

Connect the UI to the real backend.

### Step 6

Verify permissions and error handling.

### Step 7

Verify Light/Dark Mode.

### Step 8

Run available checks/build/tests.

### Step 9

Report:

```text
What changed
Files changed
Business logic implemented
Tests/checks performed
Any remaining limitation
```

---

# 60. AI Agent Must Not

Do not:

- invent unsupported business requirements
- replace PostgreSQL/Neon without instruction
- replace shadcn/ui without instruction
- create fake dashboard numbers
- hardcode payroll calculations
- bypass the Payrun two-step wizard
- ignore salary rule sequence
- use the latest contract instead of period applicability
- deduct leave on request creation
- expose server secrets
- send email from the frontend
- make frontend-only permission checks
- create unrelated UI themes
- introduce unnecessary dependencies
- rewrite the whole project for a small feature
- delete existing working functionality
- mark payroll as paid without validation
- hide payroll warnings
- silently swallow API/database errors

---

# 61. When Requirements Are Ambiguous

Use this decision order:

```text
Does the problem statement define it?
        ↓
Yes → Follow it.

No
 ↓
Does design.md define it?
        ↓
Yes → Follow it.

No
 ↓
Does the existing architecture define it?
        ↓
Yes → Follow existing convention.

No
 ↓
Choose the smallest reasonable implementation.
```

Do not invent enterprise features simply because they are common in HR software.

---

# 62. Final Product Principle

PeoplePay360 must demonstrate that:

```text
HR Data
   ↓
Operational Context
   ↓
Business Rules
   ↓
Payroll Computation
   ↓
Validated Financial Output
```

works as one connected system.

The strongest implementation is not the one with the most screens.

It is the one where the judge can clearly see:

```text
Employee
   ↓
Contract
   ↓
Schedule
   ↓
Attendance / Leave
   ↓
Salary Structure
   ↓
Salary Rules
   ↓
Payrun
   ↓
Payslip
   ↓
PDF / Email
   ↓
Live Dashboard
```

and every step is backed by real data and real application logic.

---

# 63. Quick Reference

```text
PRODUCT
PeoplePay360 HR & Payroll

PRIMARY COLOR
#B3CFE5

DEEP NAVY
#0A1931

SECONDARY BLUE
#4A7FA7

NAVY SECONDARY
#1A3D63

LIGHT BACKGROUND
#F6FAFD

FONT
Inter

UI
shadcn/ui + Lucide

ARCHITECTURE
PERN-oriented

DATABASE
PostgreSQL / Neon

HTTP
Axios

MEDIA
Cloudinary

EMAIL
Nodemailer

CHARTS
Recharts

THEMES
Light + Dark

CORE WORKFLOW
Employee → Contract → Schedule → Attendance/Time Off
→ Salary Structure/Rules → Payrun → Payslip → PDF/Email
→ Dashboard

ROLES
Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin
```

**Implementation principle:**

> Build the business system first, connect every screen to real data, and then make the experience visually consistent with `design.md`.
