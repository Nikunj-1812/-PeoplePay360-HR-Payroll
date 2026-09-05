# PeoplePay360 — Project Context

## 1. Project Identity

**Project Name:** PeoplePay360: HR & Payroll  
**Project Type:** Integrated Human Resource and Payroll Operations Platform  
**Purpose:** Hackathon implementation of a connected HR and payroll workflow.

PeoplePay360 is designed to go beyond isolated employee CRUD screens. The system connects employee master data, contracts, working schedules, attendance, time off, salary configuration, payroll processing, payslips, document generation, employee delivery, and reporting into one operational flow.

The problem statement explicitly allows teams to choose their own programming language, framework, and database technology. The primary evaluation focus is therefore the business logic, data relationships, payroll calculation flow, and end-to-end user experience rather than a specific vendor or platform.

---

# 2. Core Product Concept

The central product relationship is:

```text
EMPLOYEE
   │
   ├── CONTRACT
   │      └── SALARY STRUCTURE
   │              └── SALARY RULES
   │
   ├── WORKING SCHEDULE
   │
   ├── ATTENDANCE
   │
   ├── TIME OFF
   │      └── ALLOCATION
   │
   └── PAYROLL
          ├── PAYRUN
          │     └── PAYSLIPS
          │            ├── PDF
          │            └── EMAIL
          │
          └── DASHBOARD
```

The end-to-end operational flow is:

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

The Employee record acts as the central hub for HR interactions.

---

# 3. Problem Being Solved

Basic HR tools often keep:

```text
Employee Data
Attendance
Leave
Salary
Payroll
```

as disconnected records.

PeoplePay360 must connect these records.

Important business relationships include:

- An employee can have multiple contracts over time.
- Payroll must use the contract applicable to the selected payroll period.
- Working hours come from an assigned working schedule.
- Attendance contains daily records and possible exceptions.
- Leave balances depend on allocations and approved requests.
- Salary Structures contain Salary Rules.
- Salary Rules execute in a defined sequence.
- Payruns convert eligible employee information into payslips.
- Payslips must be understandable and reviewable before payment.
- Finalized payroll must remain available as historical information.
- Dashboard metrics must come from actual system records.

The system should therefore demonstrate real operational business logic rather than only displaying forms and tables.

---

# 4. Main Goal

Develop an integrated HR and payroll platform that manages the full employee lifecycle:

```text
Master Data
→ Time Tracking
→ Time Off
→ Salary Configuration
→ Payroll Calculation
→ Payslip Validation
→ Payment Status
→ PDF Generation
→ Employee Delivery
→ Reporting
```

---

# 5. Key Outcomes

The project should deliver:

### Unified HR Flow

Centralized employee records with seamless navigation to:

```text
Contracts
Attendance
Time Off
Allocations
Payslips
```

### Contract Management

Maintain historical contracts while ensuring payroll uses only the contract applicable to the selected period.

### Operational Tracking

Support:

```text
Working Schedules
Attendance
Attendance Exceptions
Time Off Requests
Time Off Allocations
Leave Balances
```

### Payroll Processing

Support:

```text
Payrun Creation
Employee Selection
Payroll Computation
Payslip Generation
Warnings
Validation
Payment Status
Payroll History
```

### Reporting

Provide a centralized Payroll Dashboard with filters for:

```text
Period
Department
Employee Type
```

and live information from HR and payroll records.

---

# 6. User Roles and Permissions

The problem statement defines five roles.

## 6.1 Employee

Can:

- View own employee details.
- View own attendance records.
- View own leave balances.
- Create attendance entries.
- Create Time Off Requests.

Cannot access:

- Payroll administration.
- HR administration.

---

## 6.2 HR Manager

Has full CRUD access to:

```text
Employees
Attendance
Contracts
Working Schedules
Time Off
```

Can:

```text
Approve Time Off Requests
Refuse Time Off Requests
```

Does not have access to payroll features.

---

## 6.3 HR Payroll User

Has all HR Manager permissions plus:

```text
Payruns → Create / Read / Update
Payslips → Create / Read / Update
```

Has read-only access to:

```text
Salary Structures
Salary Rules
```

---

## 6.4 HR Payroll Manager

Has all HR Payroll User permissions plus full CRUD access to:

```text
Payruns
Payslips
Salary Structures
Salary Rules
```

Has full control over HR and payroll-related records and configurations.

---

## 6.5 Admin

Has full access to all modules and models.

Admin responsibilities include:

```text
User Management
Role Assignment
Permission Updates
System Administration
```

---

# 7. HR Backend / Master Data

## 7.1 Employee Master

Employee records must support:

```text
Kanban View
List View
Form View
```

Employee form captures work information including:

```text
Department
Manager
Schedule
Job Position
Status
```

The Employee Form should provide direct access to related:

```text
Contracts
Attendance
Time Off
Allocations
```

The employee record is the operational hub.

---

# 8. Contract Management

Contracts are historical employee records.

Contracts must be linked to employees and retain changes over time.

Important contract information:

```text
Start Date
End Date
Wage
Department
Position
Salary Structure
Status
Employment Terms
```

The contract list should clearly show:

```text
Dates
Wage
Status
```

The active contract must be clearly highlighted.

### Critical Rule

Payroll must use the contract applicable to the selected payroll period.

The system must avoid concurrent active contracts for the same applicable period.

Conceptually:

```text
Payroll Period
      ↓
Find Applicable Contract
      ↓
Validate Contract
      ↓
Use Contract Terms
```

Historical contracts must remain available.

---

# 9. Working Schedules

Working Schedules define the employee's working pattern.

The schedule form defines:

```text
Day
Start Time
End Time
Break
```

The system automatically calculates total weekly hours.

Users should not manually enter calculated weekly hours.

Example concept:

```text
Weekly Pattern
      ↓
Daily Working Hours
      ↓
Break Adjustments
      ↓
Total Weekly Hours
```

Schedules can be assigned to:

```text
Employees
Contracts
```

according to the implemented data model.

Working schedules provide the expected time context for attendance and payroll.

---

# 10. Attendance

Attendance supports:

```text
Check In
Check Out
Worked Hours
Status
```

Attendance is available:

```text
Globally
From an Employee record
```

The Attendance List is designed for quick operational review.

Attendance must support exceptions and manual corrections by authorized users.

Important attendance concepts include:

```text
Present
Late
Absent
Overtime
Missing Check-out
Manual Correction
```

Attendance remains available for:

```text
Reporting
Payroll Dashboard
Operational Review
```

The system must not silently ignore attendance exceptions.

---

# 11. Time Off

Time Off contains:

```text
Requests
Allocations
Time Off Types
```

## Time Off Types

Time Off Types define policies including:

```text
Unit
Allocation Requirement
Approval Workflow
Payroll Integration
```

Units can include:

```text
Days
Hours
```

## Allocations

Allocations manage employee leave balances.

They track:

```text
Taken
Remaining
Validity Period
```

Allocation availability requires the appropriate approval.

## Requests

Time Off Requests contain:

```text
Employee
Type
Dates
Duration
Status
```

Workflow:

```text
Request
   ↓
Approval / Refusal
   ↓
If approved and allocation is required
   ↓
Allocation is consumed
   ↓
Remaining balance is updated
```

### Critical Rule

Approved requests automatically deduct from the relevant assigned allocation when the leave type requires allocation.

The balance must not be deducted merely because a request was created.

---

# 12. Salary Structures

Salary Structures are containers for organized Salary Rules.

A structure can represent a salary configuration such as:

```text
Regular Salary
```

The Salary Structure UI should expose:

```text
Number of Rules
Employees
Active Status
```

The structure controls which Salary Rules are applied to a Payrun.

The Salary Structure also controls the execution sequence of included rules.

Conceptually:

```text
Salary Structure
      ↓
Ordered Salary Rules
      ↓
Payslip Calculation
```

---

# 13. Salary Rules

Salary Rules define how salary components are calculated.

Important fields:

```text
Name
Code
Category
Sequence
Computation Method
```

Categories include:

```text
Basic
Allowances
Gross
Deductions
Net
```

Supported computation methods in the problem statement:

```text
Fixed Amount
Percentage
Formula
```

Rules are executed in sequence so that later rules can depend on earlier calculations.

Example concept:

```text
Basic
 ↓
Allowance
 ↓
Gross
 ↓
Deductions
 ↓
Net
```

### Critical Rule

Salary Rules must actively drive Payslip generation.

Salary Rule configuration screens must be functional and integrated with payroll. They must not be static mockups.

---

# 14. Payroll / Payrun

A Payrun groups generated Payslips for a specific payroll period.

Payrun contains:

```text
Run Name
Salary Structure
Period
Status
Selected Employees
Payslips
```

---

# 15. Payrun Creation Wizard

Creating a Payrun uses a two-step workflow.

## Step 1 — Scope and Period

Select:

```text
Salary Structure
Period
```

Clicking Continue moves to employee selection.

The Payrun must **not** be created at this point.

## Step 2 — Employee Selection

Show eligible employees.

Allow explicit selection.

Only after the user clicks:

```text
Create Payrun
```

is the payroll batch initialized.

Flow:

```text
NEW
 ↓
Step 1: Salary Structure + Period
 ↓
Continue
 ↓
Step 2: Eligible Employees
 ↓
Select Employees
 ↓
Create Payrun
 ↓
Processing View
```

The created Payrun must contain only the selected employees.

---

# 16. Payrun Processing

Payrun processing actions are:

```text
Compute
Validate
Mark Paid
Send Payslips
```

The Payrun processing view should show:

```text
Run Name
Salary Structure
Period
Status
Payslip Summary
Warnings
```

Potential warnings include:

```text
Missing Bank Details
Duplicate Payslips
Incomplete Employee Information
Contract Attention
Other payroll-relevant validation issues
```

Warnings and errors must be surfaced before finalization.

Finalized or paid Payruns must be preserved as historical records.

---

# 17. Payroll Computation

The core payroll computation flow is:

```text
Payrun
 ↓
Selected Employees
 ↓
Applicable Period Contract
 ↓
Payrun Salary Structure
 ↓
Active Salary Rules
 ↓
Rule Sequence
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

The Payslip computation must automatically use:

```text
Applicable Contract
+
Payrun Salary Structure
+
Period Context
+
Ordered Salary Rules
```

Salary values must not be hardcoded.

Business rules such as contract selection, schedule calculations, leave logic, and payroll computation must be implemented in application logic.

---

# 18. Payslip

Payslips can be accessed:

```text
From Payrun
From Payslip List
```

Important Payslip information:

```text
Employee
Salary Structure
Payrun
Period
Status
Worked Days
```

Salary Computation must show individual components such as:

```text
Basic
Allowances
Deductions
Gross
Net
```

The calculation should be traceable to the Salary Rules.

---

# 19. Payslip PDF

The system must support:

```text
Print Payslip
```

for an individual employee.

The action generates a printable PDF document.

The PDF should contain the meaningful payslip information required by the payroll workflow, including:

```text
Employee
Payroll Period
Worked Days
Salary Components
Earnings
Deductions
Gross
Net
Relevant Payslip Identification
```

---

# 20. Employee Payslip Delivery

The parent Payrun provides:

```text
Send Payslips
```

for bulk employee email distribution.

The email workflow should be:

```text
Payrun
 ↓
Select / identify payslips
 ↓
Generate / attach payslip documents
 ↓
Email employees
 ↓
Delivery result
```

Delivery failures should be visible to the user.

Email credentials must remain server-side.

---

# 21. Payroll Dashboard

The Payroll Dashboard combines:

```text
Employee Data
Contract Data
Attendance
Time Off
Payroll
```

The dashboard should help Payroll and HR users understand:

```text
Payments
Staffing Impact
Leave Patterns
Attendance Quality
Payroll Warnings
```

## KPI Cards

Required metrics include:

```text
Total Net Salary Paid
Payslips Generated
Average Salary
Approved Time Off
Attendance Health
```

## Charts

Required historical visualizations include:

```text
Salary Cost by Department
Monthly Net Salary Trends
```

## Operational Alerts

Surface:

```text
Payroll Statuses
Missing Required Information
Duplicate Payslips
Contract Attention Items
```

## Attendance Overview

May include:

```text
Present
Late
Absent
Overtime
Missing Check-outs
Manual Edits
Attendance Coverage
```

## Time Off Overview

May include:

```text
Approved Days
Pending Requests
Leave Balances
```

## Department Breakdown

Combine:

```text
Headcount
Total Salary Expenditure
```

## Dashboard Filters

Support:

```text
Period
Department
Employee Type
```

Changing filters must update the dashboard data.

### Critical Rule

Dashboard metrics and charts must use live data from actual system records.

Static/fake dashboard numbers are not acceptable as the final implementation.

---

# 22. Complete End-to-End Workflow

The complete system flow is:

```text
Employee Master
      ↓
Contract
      ↓
Working Schedule
      ↓
Attendance
      ↓
Time Off / Allocation
      ↓
Salary Structure
      ↓
Salary Rules
      ↓
Payrun Setup
      ↓
Employee Selection
      ↓
Payrun Creation
      ↓
Payroll Computation
      ↓
Warnings / Validation
      ↓
Payslip
      ↓
Validate
      ↓
Mark Paid
      ↓
PDF
      ↓
Bulk Email
      ↓
Payroll Dashboard
```

This connected workflow is more important than having many isolated pages.

---

# 23. Two Required Demonstration Scenarios

The problem statement expects a five-minute live demonstration.

## Scenario 1 — Employee to Payslip

Recommended demonstration:

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
Step 1: Structure + Period
 ↓
Step 2: Employee Selection
 ↓
Create Payrun
 ↓
Compute
 ↓
Review Warnings
 ↓
Review Payslip
 ↓
Validate
 ↓
Mark Paid
 ↓
Generate PDF
 ↓
Send Payslips
```

## Scenario 2 — Leave Allocation to Request

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

The UI should make these workflows easy to demonstrate without unnecessary navigation.

---

# 24. Technology Direction

The problem statement does not mandate a technology stack.

The project's selected implementation direction is:

```text
PERN-oriented architecture
```

## Frontend

```text
React
TypeScript where configured
shadcn/ui
Axios
Lucide icons
Recharts where required
```

## Backend

```text
Node.js
Express
TypeScript / existing backend language conventions
```

## Database

```text
PostgreSQL
Neon PostgreSQL
```

## Services

```text
Cloudinary
Nodemailer
```

The existing project structure and dependencies are the implementation baseline.

Do not replace the selected stack without an explicit project decision.

---

# 25. Data Architecture

The logical domain model contains relationships around:

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

The exact table/model names should follow the existing backend implementation.

The database should preserve relationships rather than duplicating business-critical data.

---

# 26. Data Integrity Principles

Important data integrity requirements:

### Contracts

Preserve historical records.

Payroll uses the period-specific applicable contract.

### Working Schedules

Weekly hours are calculated from the defined daily schedule.

### Time Off

Balance consumption occurs through approved requests when allocation is required.

### Salary Rules

Execution follows sequence.

### Payroll

Payrun and Payslip data must remain historically traceable.

### Dashboard

Aggregations come from actual persisted records.

---

# 27. Transactional Operations

Operations that update multiple related records should be handled transactionally where supported by the database layer.

Important examples:

```text
Approve Time Off
+
Consume Allocation
```

```text
Create / Compute Payrun
+
Generate Payslips
+
Generate Payslip Lines
```

```text
Mark Payrun Paid
+
Update relevant Payslip state
```

The system should avoid partially completed payroll state after an error.

---

# 28. API / Application Architecture

The preferred backend flow is:

```text
Frontend
   ↓
Axios
   ↓
Express Route
   ↓
Controller
   ↓
Service / Business Logic
   ↓
PostgreSQL / Neon
```

Business rules should not be hidden inside UI components.

Payroll calculations should live in dedicated backend business logic.

Conceptual service responsibilities:

```text
Employee Service
Contract Service
Schedule Service
Attendance Service
Time Off Service
Salary Structure Service
Salary Rule Service
Payroll Service
Payslip Service
Dashboard Service
Email Service
PDF Service
```

Exact service names may follow the existing codebase.

---

# 29. Frontend Architecture

The existing frontend should remain organized around reusable modules.

Conceptual structure:

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

If the repository already has a different but coherent structure, preserve it.

---

# 30. API Communication

Axios is the selected HTTP client.

Prefer centralized API communication rather than scattering raw Axios requests throughout UI components.

Conceptually:

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

API handling should account for:

```text
401 Unauthorized
403 Forbidden
404 Not Found
422 Validation Error
500 Server Error
Network Failure
```

---

# 31. Authentication and Authorization Context

The system contains role-based access.

Authorization must be enforced on the backend.

Frontend route visibility is only a user-experience layer.

A user must not gain permission merely by manually calling a protected API endpoint.

Protected operations should verify:

```text
Authenticated User
+
Assigned Role
+
Required Permission
```

---

# 32. UI / Design Context

The visual direction comes from the supplied mockup and `design.md`.

The product should feel:

```text
Professional
Trustworthy
Financially Reliable
Operational
Modern
Data-driven
Calm
```

It should resemble a serious internal enterprise HR/payroll application rather than a generic hackathon CRUD dashboard.

The supplied mockup establishes a:

```text
Dark Navy
+
Light Blue
+
Compact Enterprise Dashboard
```

visual direction.

Avoid:

```text
Excessive Gradients
Glassmorphism
Neon UI
Excessive Rounded Cards
Oversized Typography
Decorative Animation
Consumer/Social-Media Styling
Random Colors
```

---

# 33. Official Design Palette

The primary brand color is:

```text
#B3CFE5
```

Core palette:

```text
#B3CFE5 → PRIMARY
#0A1931 → DEEP NAVY
#4A7FA7 → SECONDARY BLUE
#1A3D63 → SECONDARY NAVY
#F6FAFD → LIGHT BACKGROUND
```

Important:

```text
#B3CFE5
```

must remain the primary brand/action color.

Do not replace it with:

```text
#4A7FA7
```

Text/icons on `#B3CFE5` should use:

```text
#0A1931
```

---

# 34. Theme Context

PeoplePay360 supports:

```text
Light Mode
Dark Mode
```

The theme is global.

Theme preference should persist.

Conceptual flow:

```text
Theme Toggle
 ↓
Persist Preference
 ↓
HTML Theme Class
 ↓
CSS Variables
 ↓
Entire Application
```

## Light Mode

```text
Background: #F6FAFD
Cards:      #FFFFFF
Text:       #0A1931
Primary:    #B3CFE5
```

## Dark Mode

```text
Background: #0A1931
Cards:      #102744
Text:       #F6FAFD
Primary:    #B3CFE5
```

The primary brand color remains the same in both themes.

Theme toggle should be compact and can use:

```text
☀ / ☾
```

with shadcn/ui controls.

---

# 35. Typography Context

Use one minimal font family:

```text
Inter
```

Fallback:

```text
sans-serif
```

Conceptual setup:

```css
font-family: Inter, sans-serif;
```

Typography should remain compact because the application is table- and form-heavy.

Recommended scale from the design system:

```text
Page Title      24–28px / 700
Section Title   18–20px / 600
Card Title      15–17px / 600
Body            14px / 400
Table           13–14px / 400–500
Helper Text     12px / 400
KPI Number      24–32px / 700
Button          13–14px / 500–600
```

---

# 36. UI Component Context

Use:

```text
shadcn/ui
```

for standard UI components.

Useful components include:

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
Sonner / Toast
Command
Separator
```

Use:

```text
Lucide icons
```

Do not introduce another UI component framework when shadcn/ui can solve the requirement.

---

# 37. Navigation Context

The primary application navigation exposes:

```text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

Supporting configuration areas may include:

```text
Working Schedules
Salary Structures
Salary Rules
Settings
```

The exact navigation should respect role permissions.

---

# 38. Employee UI Context

Employees are available through:

```text
Kanban
List
Form
```

The Employee Form acts as the operational hub.

It should expose:

```text
Identity
Role
Department
Manager
Schedule
Active Status
```

Smart actions/counts can open filtered related records:

```text
Contracts
Attendance
Time Off
Allocations
```

The interface should minimize unnecessary navigation between related HR records.

---

# 39. Table and Form Context

Major operational modules are table-heavy.

Where appropriate, tables support:

```text
Search
Filtering
Sorting
Pagination
Row Actions
Status Badges
Loading States
Empty States
Responsive Horizontal Scrolling
```

Forms use a consistent pattern:

```text
Label
Input
Helper Text
Validation
```

Validation should exist at both frontend and backend levels.

If compatible with the existing frontend, React Hook Form and Zod may be used for structured form validation.

---

# 40. Status Context

Use explicit textual statuses.

### Employee

```text
Active
Inactive
```

### Contract

```text
Active
Expired
Upcoming
```

### Attendance

```text
Present
Late
Absent
Overtime
Missing Checkout
Corrected
```

### Time Off

```text
Pending
Approved
Refused
Cancelled
```

### Payrun

```text
Draft
Computing
Computed
Validated
Paid
Failed
```

### Payslip

```text
Draft
Generated
Sent
Failed
```

Important states must not be communicated using color alone.

---

# 41. Loading, Empty, Error and Success States

Every API-driven screen should provide:

```text
Loading
Empty
Error
Success
```

No API-driven page should remain blank while data is loading or when a request fails.

---

# 42. Responsive Context

Desktop is the primary operating environment.

Desktop:

```text
Persistent Sidebar
Wide Tables
Multi-column Dashboard
```

Tablet:

```text
Collapsible Sidebar
Responsive Cards
Scrollable Tables
```

Mobile:

```text
Compact Header
Drawer Navigation
Single-column Forms
Horizontal Table Scrolling
```

Important business information should remain readable.

---

# 43. Accessibility Context

The UI should support:

```text
Keyboard Navigation
Visible Focus
Semantic Controls
Accessible Labels
Accessible Dialogs
Table Headers
Icon Button Labels
Adequate Contrast
Textual Status Indicators
```

Primary color contrast:

```text
#B3CFE5 background
+
#0A1931 text/icon
```

Do not rely only on color to communicate business state.

---

# 44. Animation Context

Animations are minimal.

Allowed:

```text
Hover Transitions
Dialog Transitions
Dropdown Transitions
Sidebar Transitions
Theme Transition
Loading Indicators
```

Avoid decorative motion.

The application should prioritize operational clarity.

---

# 45. Environment / Secrets Context

The project already uses PostgreSQL/Neon environment configuration.

Environment values belong in `.env` and must never be committed.

Typical backend configuration may include:

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

Use the project's existing variable names where already established.

Server secrets must remain server-side.

Do not expose:

```text
DATABASE_URL
SMTP_PASSWORD
CLOUDINARY_API_SECRET
JWT_SECRET
Private API Keys
```

to the frontend.

---

# 46. Cloudinary Context

Cloudinary is available for hosted media/file assets where required.

Appropriate examples:

```text
Employee Profile Image
Company Logo
Other Required Application Assets
```

Do not upload every generated payroll document to Cloudinary unless the existing architecture requires it.

---

# 47. Nodemailer Context

Nodemailer is the selected email service.

Email must be sent through the backend:

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

SMTP credentials must never be placed in frontend code.

Bulk Payslip delivery belongs to the Payrun workflow.

---

# 48. PDF Context

The application must generate printable individual Payslip PDFs.

Use the existing project PDF implementation/library where one is already configured.

PDF generation belongs to the backend/application service layer rather than being treated as a static frontend screen.

---

# 49. Dashboard Data Context

Dashboard data must follow:

```text
PostgreSQL / Neon
 ↓
Backend Aggregation
 ↓
API
 ↓
Axios / Query Layer
 ↓
Dashboard UI
```

Do not hardcode final dashboard values.

Examples of data that must be live:

```text
Total Net Salary Paid
Payslips Generated
Average Salary
Approved Time Off
Attendance Health
Salary Cost by Department
Monthly Net Salary Trends
Headcount
Salary Expenditure
Warnings
Leave Balances
```

---

# 50. Historical Data Context

Historical records are an important part of the system.

Do not overwrite old records simply to display the latest state.

Preserve:

```text
Historical Contracts
Finalized Payruns
Paid Payruns
Historical Payslips
Payroll History
```

A past payroll period must use the contract and relevant salary context applicable to that period.

---

# 51. Business Logic Priority

When implementing features, prioritize:

```text
1. Correct business logic
2. Correct data relationships
3. Correct payroll calculations
4. Correct role permissions
5. Correct workflow/state transitions
6. Real database persistence
7. Real dashboard aggregation
8. End-to-end UX
9. Visual polish
```

A visually complete page with incorrect business logic is not considered complete.

---

# 52. What Must Not Be Hardcoded

Do not hardcode:

```text
Salary Totals
Dashboard KPIs
Employee Counts
Leave Balances
Weekly Hours
Payroll Results
Salary Rule Results
```

Business calculations must use actual records and configured rules.

---

# 53. What the Product Must Demonstrate

The strongest demonstration should visibly prove:

```text
Employee
   ↓
Contract
   ↓
Schedule
   ↓
Attendance / Time Off
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
Dashboard
```

Every major step should be connected to real application data.

---

# 54. Representative Data

The final application should contain representative data for:

```text
Employees
Departments
Managers
Contracts
Working Schedules
Attendance
Time Off Types
Allocations
Time Off Requests
Salary Structures
Salary Rules
Payruns
Payslips
```

Data should be sufficient to demonstrate:

```text
Historical Contract
Active Contract
Attendance Exception
Leave Approval
Leave Balance Consumption
Salary Computation
Payroll Warning
Payslip PDF
Email Delivery
Dashboard Aggregation
```

---

# 55. Future Roadmap Context

The problem statement asks for a brief future roadmap.

Future enhancements should be presented separately from the required MVP.

Potential roadmap items should only be added when they are clearly described as future extensions rather than current requirements.

The current MVP should remain focused on the defined HR/payroll workflow.

---

# 56. Development Rules

When working on the project:

1. Inspect existing code before creating new abstractions.
2. Follow the problem statement for business requirements.
3. Follow `design.md` for visual behavior.
4. Follow `agents.md` for implementation rules.
5. Reuse existing components and services.
6. Preserve existing working functionality.
7. Make small, focused changes.
8. Connect frontend features to real backend data.
9. Validate important business operations server-side.
10. Verify role permissions.
11. Verify Light Mode and Dark Mode.
12. Run available tests/build/checks after significant changes.

---

# 57. Priority When Documents or Requirements Conflict

Use this order:

```text
Problem Statement
      ↓
design.md
      ↓
agents.md
      ↓
Existing Project Architecture
      ↓
Implementation Decision
```

The problem statement is the authority for business requirements.

`design.md` is the authority for visual/UI behavior.

`agents.md` defines the coding-agent implementation contract.

If a requirement is not supported by the source material, do not silently present it as a mandatory requirement.

---

# 58. Final Project Definition

PeoplePay360 is an integrated HR and Payroll Operations Platform whose core value is the connection between:

```text
Employee Master Data
+
Historical Contracts
+
Working Schedules
+
Attendance
+
Time Off / Allocations
+
Salary Structures
+
Ordered Salary Rules
+
Payruns
+
Payslips
+
PDF / Email Delivery
+
Live Payroll Dashboard
```

The platform must make complex HR and payroll business logic understandable, traceable, and trustworthy.

The most important principle is:

> PeoplePay360 should behave as one connected HR-to-payroll operational system, not as a collection of disconnected CRUD screens.

---

# 59. Quick Reference

```text
PROJECT
PeoplePay360: HR & Payroll

TYPE
Integrated Human Resource and Payroll Operations Platform

ARCHITECTURE
PERN-oriented

FRONTEND
React
TypeScript where configured
shadcn/ui
Axios
Lucide
Recharts where required

BACKEND
Node.js
Express
TypeScript / existing backend conventions

DATABASE
PostgreSQL
Neon

SERVICES
Cloudinary
Nodemailer

FONT
Inter

PRIMARY
#B3CFE5

DARK
#0A1931

SECONDARY
#4A7FA7

NAVY
#1A3D63

LIGHT
#F6FAFD

THEMES
Light Mode + Dark Mode

CORE FLOW
Employee
→ Contract
→ Working Schedule
→ Attendance / Time Off
→ Salary Structure / Rules
→ Payrun
→ Payslip
→ PDF / Email
→ Dashboard

ROLES
Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin

PRIMARY BUSINESS LOGIC
Period-specific contract selection
Working schedule calculation
Attendance exception handling
Leave allocation consumption
Salary rule sequencing
Payroll computation
Payroll validation
Historical payroll tracking
Live dashboard aggregation
```
