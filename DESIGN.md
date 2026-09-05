# PeoplePay360 --- Design System & UI/UX Specification

## 1. Product Context

**PeoplePay360** is an integrated HR & Payroll Operations Platform.

The product is designed around a connected operational flow rather than
isolated CRUD screens:

> Employee → Contract → Working Schedule → Attendance / Time Off →
> Salary Structure & Rules → Payrun → Payslip → PDF / Email → Payroll
> Dashboard

The problem statement emphasizes: - centralized employee records -
historical and period-specific contracts - working schedules and
attendance - leave allocations and approvals - configurable salary
structures and ordered salary rules - validated payruns and payslips -
payroll warnings and exception handling - printable payslip PDFs - bulk
employee email delivery - live payroll/HR dashboard data - role-based
permissions

The UI must therefore feel like a serious internal enterprise HR
product: **clear, dense enough for operational work, but visually calm
and modern.**

------------------------------------------------------------------------

# 2. Visual Direction

## Design Personality

PeoplePay360 should communicate:

-   **Professional**
-   **Trustworthy**
-   **Financially reliable**
-   **Operational**
-   **Modern**
-   **Data-driven**
-   **Calm rather than flashy**

Avoid: - excessive gradients - glassmorphism - excessive rounded cards -
neon colors - decorative animations - overly large typography -
consumer/social-media style layouts

The provided mockup uses a **dark navy + light blue enterprise dashboard
aesthetic**, with compact cards, tables, forms, badges, and
workflow-oriented screens. Follow that visual language consistently.

------------------------------------------------------------------------

# 3. Official Color Palette

The project uses the following five-color palette.

  -----------------------------------------------------------------------
  Token                   Hex                     Primary Usage
  ----------------------- ----------------------- -----------------------
  `navy-950`              `#0A1931`               deepest background,
                                                  sidebar, high-contrast
                                                  surfaces

  `blue-100`              `#B3CFE5`               secondary surfaces,
                                                  selected states, soft
                                                  backgrounds

  `blue-500`              `#4A7FA7`               primary action, active
                                                  states, charts, accents

  `navy-700`              `#1A3D63`               primary brand color,
                                                  headers, dark cards

  `surface`               `#F6FAFD`               application background,
                                                  page canvas, light
                                                  cards
  -----------------------------------------------------------------------

### Color hierarchy

``` text
#0A1931  →  deepest navy / navigation / high contrast
#1A3D63  →  brand navy / headings / important surfaces
#4A7FA7  →  primary blue / actions / active UI
#B3CFE5  →  supporting blue / secondary states
#F6FAFD  →  main light background
```

### CSS variables

``` css
:root {
  --navy-950: #0A1931;
  --blue-100: #B3CFE5;
  --blue-500: #4A7FA7;
  --navy-700: #1A3D63;
  --surface: #F6FAFD;
}
```

### Semantic colors

Use the project palette as the dominant visual language. Semantic colors
should remain restrained:

``` text
Success  → muted green
Warning  → muted amber
Danger   → muted red
Info     → #4A7FA7
```

Semantic colors are for status meaning, not decoration.

------------------------------------------------------------------------

# 4. Typography

Use a clean sans-serif font.

Recommended:

``` text
Inter
```

Fallback:

``` text
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

## Type Scale

  Element               Size     Weight
  --------------- ---------- ----------
  Page title        24--28px        700
  Section title     18--20px        600
  Card title        15--17px        600
  Body                  14px        400
  Table text        13--14px   400--500
  Helper text           12px        400
  KPI number        24--32px        700
  Button            13--14px   500--600

Keep headings compact. This application contains many tables and forms,
so vertical space is valuable.

------------------------------------------------------------------------

# 5. Spacing System

Use a consistent 4px-based spacing scale.

``` text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

Recommended application spacing:

``` text
Page padding:       24px
Section gap:        24px
Card padding:       16–20px
Form field gap:     16px
Table cell padding: 12px
Button height:      36–40px
Input height:       38–40px
```

------------------------------------------------------------------------

# 6. Border Radius

Use moderate enterprise-style rounding.

``` text
Buttons:       6–8px
Inputs:        6–8px
Cards:         8–12px
Dialogs:       12px
Badges:        9999px
```

Do not make every component heavily rounded.

------------------------------------------------------------------------

# 7. Shadows and Borders

Prefer borders over heavy shadows.

Default:

``` css
border: 1px solid rgba(26, 61, 99, 0.12);
```

Use subtle shadows only for: - dropdowns - dialogs - popovers - elevated
workflow panels

Avoid large decorative shadows.

------------------------------------------------------------------------

# 8. Application Shell

The primary layout is:

``` text
┌──────────────────────────────────────────────────────────┐
│ Top Header                                               │
├───────────────┬──────────────────────────────────────────┤
│               │                                          │
│ Sidebar       │ Page Header                              │
│               │                                          │
│ Dashboard     │ Content                                  │
│ Employees     │                                          │
│ Contracts     │                                          │
│ Attendance    │                                          │
│ Time Off      │                                          │
│ Payroll       │                                          │
│ Reports       │                                          │
│               │                                          │
│ Settings      │                                          │
└───────────────┴──────────────────────────────────────────┘
```

## Sidebar

Background:

``` text
#0A1931
```

Sidebar should contain: - PeoplePay360 logo/name - Dashboard -
Employees - Contracts - Working Schedules - Attendance - Time Off -
Payroll - Salary Structures - Salary Rules - Reports - Settings

Active navigation item:

``` text
background: #1A3D63
accent: #4A7FA7
```

Sidebar should collapse on smaller screens.

------------------------------------------------------------------------

# 9. Top Header

Header should contain:

-   page context
-   optional breadcrumbs
-   search
-   notifications
-   user avatar
-   user name / role
-   profile menu

Example:

``` text
PeoplePay360 / Payroll / Payruns

                              Search   🔔   User ▾
```

Keep the header compact.

------------------------------------------------------------------------

# 10. Page Layout Pattern

Every operational page should follow:

``` text
Page Header
├── Title
├── Description / breadcrumb
└── Primary Action

Filters / Tabs

Main Content
├── Table / Kanban / Form
└── Secondary panels where required
```

Example:

``` text
Employees
Manage employee records and employment information.

[ Search employees ] [Department ▼] [Status ▼]       [+ Add Employee]

┌───────────────────────────────────────────────────────┐
│ Employee Table                                         │
└───────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 11. Core Components

Use **shadcn/ui** as the base component library.

Required components:

-   Button
-   Input
-   Label
-   Select
-   Combobox
-   Checkbox
-   Radio Group
-   Switch
-   Textarea
-   Date Picker
-   Calendar
-   Tabs
-   Badge
-   Card
-   Table
-   Dialog
-   Sheet
-   Dropdown Menu
-   Popover
-   Tooltip
-   Alert
-   Alert Dialog
-   Breadcrumb
-   Pagination
-   Skeleton
-   Toast / Sonner
-   Command
-   Separator

Create application-specific wrappers rather than styling every page
independently.

------------------------------------------------------------------------

# 12. Buttons

## Primary

Use:

``` text
background: #4A7FA7
text: white
```

For major actions:

``` text
+ Add Employee
Create Payrun
Compute
Validate
Mark Paid
Send Payslips
Save
```

## Secondary

Use light blue or white surfaces with navy text.

## Destructive

Use semantic danger styling and confirmation for destructive payroll/HR
operations.

## Button hierarchy

Only one primary action should dominate a page or dialog.

------------------------------------------------------------------------

# 13. Status Badges

Use badges heavily because HR/payroll records have many states.

Examples:

``` text
Employee
Active
Inactive

Contract
Active
Expired
Upcoming

Attendance
Present
Late
Absent
Overtime
Missing Checkout
Corrected

Leave
Pending
Approved
Refused
Cancelled

Payrun
Draft
Computing
Computed
Validated
Paid
Failed

Payslip
Draft
Generated
Sent
Failed
```

Badge text should be short.

------------------------------------------------------------------------

# 14. Data Tables

Tables are a major part of the application.

Rules:

-   compact rows
-   clear column hierarchy
-   sticky header when useful
-   sorting
-   filtering
-   pagination
-   row actions
-   empty state
-   loading skeleton
-   clear status badges
-   responsive horizontal scrolling

Example employee table:

``` text
Employee | Department | Position | Schedule | Status | Actions
```

Example contract table:

``` text
Employee | Start | End | Wage | Salary Structure | Status
```

Example attendance table:

``` text
Employee | Check In | Check Out | Worked Hours | Status | Actions
```

Example payslip table:

``` text
Employee | Period | Worked Days | Gross | Deductions | Net | Status
```

------------------------------------------------------------------------

# 15. Employee Module

The employee record is the **central hub** of the system.

## Employee List

Support:

``` text
Kanban View
List View
```

Toolbar:

``` text
[Search] [Department] [Status] [Employee Type] [View Toggle] [+ Add Employee]
```

## Employee Card

Show:

-   avatar
-   employee name
-   employee ID
-   job position
-   department
-   status

## Employee Form

Sections:

``` text
Personal Information
Employment Information
Organization
Working Schedule
Contact Information
Status
```

The employee form should provide smart links/buttons to:

``` text
Contracts
Attendance
Time Off
Allocations
Payslips
```

These related-record links are important because the problem statement
defines the employee as the operational hub.

------------------------------------------------------------------------

# 16. Contract Management

Contracts must support historical records.

Contract form:

``` text
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

Important visual rule:

The currently applicable contract must be visually obvious.

Example:

``` text
ACTIVE
01 Apr 2026 — 31 Mar 2027
₹75,000/month
Regular Salary
```

Do not allow overlapping active contracts for the same employee and
period.

------------------------------------------------------------------------

# 17. Working Schedule

Schedule form:

``` text
Schedule Name
Schedule Type

Monday
Start | Break | End

Tuesday
Start | Break | End

...

Sunday
Start | Break | End
```

Calculate weekly hours automatically.

Display:

``` text
Weekly Hours: 40h
```

Do not require the user to manually enter calculated weekly hours.

------------------------------------------------------------------------

# 18. Attendance

Attendance should be optimized for fast operational review.

Main table:

``` text
Employee
Date
Check In
Check Out
Worked Hours
Status
Exception
Actions
```

Statuses:

``` text
Present
Late
Absent
Overtime
Missing Checkout
Manual Correction
```

Use a correction dialog for authorized HR users.

Important UX:

``` text
Missing Checkout
       ↓
Warning
       ↓
Open Record
       ↓
Correct
       ↓
Audit / status update
```

------------------------------------------------------------------------

# 19. Time Off

Use tabs:

``` text
Requests | Allocations | Time Off Types
```

## Request List

``` text
Employee
Type
Start Date
End Date
Duration
Status
Actions
```

## Approval

Request detail should make the decision obvious:

``` text
Leave Request
────────────────────────
Employee: Rahul Patel
Type: Paid Leave
Duration: 3 days
Balance: 12 days

[Approve] [Refuse]
```

After approval:

``` text
Approved Request
        ↓
Allocation Balance
        ↓
Remaining Balance Updated
```

This should be visible in the UI.

------------------------------------------------------------------------

# 20. Salary Structures

Salary Structures are containers for Salary Rules.

Example:

``` text
Regular Salary

Rules: 7
Employees: 42
Status: Active
```

Structure detail:

``` text
Salary Structure
────────────────────────

1. Basic Salary
2. HRA
3. Allowance
4. Gross Salary
5. PF
6. Tax
7. Net Salary
```

The execution sequence must be visually obvious.

------------------------------------------------------------------------

# 21. Salary Rules

Each rule should expose:

``` text
Name
Code
Category
Sequence
Computation Type
Value / Formula
Active
```

Computation types:

``` text
Fixed Amount
Percentage
Formula
```

Categories:

``` text
Basic
Allowance
Gross
Deduction
Net
```

Example:

``` text
HRA
Code: HRA
Category: Allowance
Sequence: 20
Type: Percentage
Value: 20%
Based On: Basic
```

The UI must communicate that **rules drive payroll calculation**, not
static mock data.

------------------------------------------------------------------------

# 22. Payrun Creation Wizard

The Payrun flow is a major demo feature.

Do not create a payrun immediately after clicking NEW.

Use a two-step wizard.

## Step 1 --- Scope

``` text
Create Payrun

Salary Structure [Regular Salary ▼]

Period
From [01/09/2026]
To   [30/09/2026]

                    [Cancel] [Continue]
```

## Step 2 --- Employees

``` text
Eligible Employees

☑ Employee A
☑ Employee B
☐ Employee C
☑ Employee D

[Back] [Create Payrun]
```

Only after explicit employee selection should the payrun be created.

------------------------------------------------------------------------

# 23. Payrun Processing

Payrun header:

``` text
September 2026 Payroll

Structure: Regular Salary
Period: 01 Sep – 30 Sep
Employees: 42
Status: Computed
```

Actions:

``` text
Compute
Validate
Mark Paid
Send Payslips
```

Recommended progression:

``` text
Draft
 ↓
Compute
 ↓
Warnings / Validation
 ↓
Computed
 ↓
Validate
 ↓
Validated
 ↓
Mark Paid
 ↓
Paid
```

------------------------------------------------------------------------

# 24. Payroll Warnings

Warnings should never be hidden.

Examples:

``` text
⚠ Missing bank details
⚠ Duplicate payslip detected
⚠ Employee has incomplete contract
⚠ Missing attendance checkout
⚠ Salary structure unavailable
⚠ Overlapping contract detected
```

Display warnings near the payrun processing action.

Critical warnings should block finalization.

------------------------------------------------------------------------

# 25. Payslip Screen

Payslip should look like a financial document while still matching the
application UI.

Header:

``` text
PeoplePay360
PAYSLIP

Employee
Employee ID
Department
Period
Worked Days
```

Salary breakdown:

``` text
Earnings
────────────────────
Basic Salary
HRA
Allowances
Gross Salary

Deductions
────────────────────
PF
Tax
Other Deductions

NET PAY
₹ XX,XXX
```

Actions:

``` text
Print / Generate PDF
Send Email
```

------------------------------------------------------------------------

# 26. PDF Payslip

PDF generation is a functional feature, not a visual mock.

The generated document should contain:

-   company name/logo
-   employee details
-   payroll period
-   worked days
-   earnings
-   deductions
-   gross salary
-   net salary
-   generation date
-   payslip reference

The application should provide a clear success state after PDF
generation.

------------------------------------------------------------------------

# 27. Bulk Email

From a Payrun:

``` text
[Send Payslips]
```

Show:

``` text
42 Payslips
38 Ready
2 Missing Email
2 Failed

[Send All Ready Payslips]
```

After sending:

``` text
Sent: 38
Failed: 0
```

Do not make the user wonder whether the operation completed.

------------------------------------------------------------------------

# 28. Payroll Dashboard

The dashboard is the executive/operational overview.

## KPI Row

``` text
Total Net Salary Paid
Payslips Generated
Average Salary
Approved Time Off
Attendance Health
```

Each KPI card should include:

``` text
Label
Large number
Small comparison / context
Optional icon
```

## Charts

Required:

``` text
Salary Cost by Department
Monthly Net Salary Trends
```

Additional operational charts:

``` text
Attendance Overview
Leave Overview
Headcount by Department
```

Use Recharts.

Charts must use live application data.

------------------------------------------------------------------------

# 29. Dashboard Filters

Place filters near the dashboard header:

``` text
Period
Department
Employee Type
```

Example:

``` text
Payroll Dashboard

Period [September 2026 ▼]
Department [All ▼]
Employee Type [All ▼]
```

Changing filters should update KPI cards and charts together.

------------------------------------------------------------------------

# 30. Dashboard Alerts

Include a compact operational alerts section:

``` text
Payroll Warnings
────────────────────────
3 employees missing bank details

2 duplicate payslips detected

4 contracts require attention

7 attendance records missing checkout
```

Alerts should link to the relevant records.

------------------------------------------------------------------------

# 31. Role-Based UI

The interface must reflect permissions.

## Employee

Show:

``` text
My Profile
My Attendance
My Time Off
My Leave Balance
```

Hide payroll administration.

## HR Manager

Show:

``` text
Employees
Contracts
Working Schedules
Attendance
Time Off
Reports
```

Hide payroll administration.

## HR Payroll User

Show HR modules plus:

``` text
Payruns
Payslips
```

Salary structures/rules are read-only.

## HR Payroll Manager

Full HR + Payroll configuration:

``` text
Payruns
Payslips
Salary Structures
Salary Rules
```

## Admin

Everything plus:

``` text
User Management
Roles
Permissions
System Settings
```

Never rely only on hiding buttons. Backend authorization must enforce
permissions too.

------------------------------------------------------------------------

# 32. Forms

Forms should use a consistent pattern:

``` text
Label
Input
Helper text / validation
```

Validation errors should appear directly below the field.

Example:

``` text
Monthly Wage
[ 75000                         ]

✓ Valid wage
```

For invalid:

``` text
Monthly Wage
[ -100                          ]
Monthly wage must be greater than 0.
```

Use React Hook Form + Zod.

------------------------------------------------------------------------

# 33. Search and Filtering

Large HR datasets require fast filtering.

Every major list should support:

``` text
Search
Status
Department
Date / Period
Employee Type
```

Do not create separate filter UI for every page. Build reusable filter
components.

------------------------------------------------------------------------

# 34. Loading States

Never show a blank screen during API requests.

Use:

``` text
Skeletons
Loading buttons
Table skeleton rows
Progress indicators
```

Example:

``` text
[ Computing Payroll... ]
```

Disable duplicate actions while an operation is running.

------------------------------------------------------------------------

# 35. Empty States

Every module needs an intentional empty state.

Example:

``` text
No employees found

Try changing your filters or add your first employee.

[+ Add Employee]
```

Avoid generic:

``` text
No data.
```

------------------------------------------------------------------------

# 36. Error Handling

Use consistent error feedback.

For API failures:

``` text
Unable to load employees.
Please try again.
[Retry]
```

For payroll failures:

``` text
Payroll calculation failed

The payrun could not be completed because 2 employees
have invalid salary configuration.

[View Issues]
```

Errors should explain what the user can do next.

------------------------------------------------------------------------

# 37. Confirmation Dialogs

Require confirmation for important actions:

``` text
Mark Payrun as Paid
Send Payslips
Refuse Leave Request
Delete Employee
Delete Salary Rule
```

For irreversible payroll actions:

``` text
Are you sure?

This will mark the September 2026 payrun as PAID.
Finalized payroll records should not be modified casually.

[Cancel] [Mark as Paid]
```

------------------------------------------------------------------------

# 38. Responsive Design

Desktop is the primary target because HR/payroll teams typically work
with tables.

### Desktop

``` text
Sidebar + Content
```

### Tablet

``` text
Collapsed Sidebar + Content
```

### Mobile

``` text
Top Bar
Scrollable Content
Bottom/Drawer Navigation where appropriate
```

Tables should become horizontally scrollable rather than destroying
column readability.

------------------------------------------------------------------------

# 39. Accessibility

Required:

-   keyboard navigation
-   visible focus states
-   semantic buttons
-   labels for inputs
-   sufficient contrast
-   accessible dialogs
-   accessible table headers
-   icon buttons with tooltips/aria-labels
-   never communicate status through color alone

Example:

``` text
✓ Approved
```

is better than showing only a green dot.

------------------------------------------------------------------------

# 40. Icons

Use **Lucide Icons**, which works naturally with shadcn/ui.

Recommended icons:

``` text
LayoutDashboard
Users
FileText
CalendarDays
Clock
WalletCards
Receipt
ChartNoAxesCombined
Settings
Bell
Search
Plus
Pencil
Trash2
Eye
Check
X
AlertTriangle
Download
Mail
```

Keep icon sizes around:

``` text
16px — table/action icons
18px — buttons
20px — navigation
```

------------------------------------------------------------------------

# 41. Animation

Keep motion subtle.

Use transitions for:

-   hover
-   sidebar expansion
-   dropdowns
-   dialogs
-   tabs
-   status changes

Avoid: - large page animations - excessive bouncing - animated charts
that distract during a live demo

Recommended transition:

``` css
transition: all 150ms ease;
```

------------------------------------------------------------------------

# 42. Frontend Architecture Alignment

Recommended frontend structure:

``` text
client/
└── src/
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── tables/
    │   ├── forms/
    │   ├── charts/
    │   └── payroll/
    │
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
    │
    ├── hooks/
    ├── services/
    ├── api/
    ├── lib/
    ├── types/
    └── utils/
```

Use feature-oriented organization for large modules.

------------------------------------------------------------------------

# 43. Backend-to-UI Design Principle

The UI should represent real backend states.

Do not build static dashboard cards or fake payroll results.

Example:

``` text
PostgreSQL
    ↓
Prisma
    ↓
Payroll Service
    ↓
Express API
    ↓
Axios
    ↓
TanStack Query
    ↓
React UI
```

The dashboard and payslip should therefore always be derived from actual
records.

------------------------------------------------------------------------

# 44. Important Business UX Rules

## Contract Rule

When computing payroll:

``` text
Payroll Period
      ↓
Find applicable contract
      ↓
Validate no conflicting active contract
      ↓
Use applicable wage + salary structure
```

## Leave Rule

``` text
Allocation
      ↓
Leave Request
      ↓
Approval
      ↓
Balance deduction
```

## Salary Rule Rule

``` text
Salary Structure
      ↓
Ordered Rules
      ↓
Earnings
      ↓
Gross
      ↓
Deductions
      ↓
Net
```

## Payrun Rule

``` text
Scope + Period
      ↓
Eligible Employees
      ↓
Explicit Selection
      ↓
Create Payrun
      ↓
Compute
      ↓
Validate
      ↓
Paid
```

These flows should be visually clear in the UI.

------------------------------------------------------------------------

# 45. Demo-First UX

The five-minute demonstration should be easy to execute.

Recommended demo flow:

## Scenario 1 --- Employee to Payslip

``` text
Dashboard
 ↓
Employee
 ↓
Contract
 ↓
Attendance
 ↓
Payroll
 ↓
Create Payrun
 ↓
Select Employee
 ↓
Compute
 ↓
Review Salary Rules
 ↓
Validate
 ↓
Mark Paid
 ↓
Generate Payslip PDF
 ↓
Send Payslip
```

## Scenario 2 --- Leave Workflow

``` text
Employee
 ↓
Time Off
 ↓
Create Request
 ↓
HR Manager
 ↓
Approve
 ↓
Allocation Balance Updated
 ↓
Dashboard reflects change
```

The UI should make both scenarios possible without deep navigation or
unnecessary clicks.

------------------------------------------------------------------------

# 46. Visual Consistency Checklist

Every new screen must answer:

-   Is the page background `#F6FAFD`?
-   Is the brand hierarchy based on `#0A1931`, `#1A3D63`, `#4A7FA7`, and
    `#B3CFE5`?
-   Does it use shadcn/ui components?
-   Is the primary action obvious?
-   Are statuses represented with badges?
-   Are loading and empty states implemented?
-   Are validation errors visible?
-   Does the screen respect role permissions?
-   Does it connect to real backend data?
-   Does it follow the same spacing and typography system?
-   Is it usable on desktop and tablet?

------------------------------------------------------------------------

# 47. What NOT to Change

The supplied mockup establishes the visual direction.

Do not introduce an unrelated: - purple SaaS theme - green fintech
theme - neon dashboard - glassmorphism system - completely white generic
admin template

The visual identity should remain centered around:

``` text
#0A1931
#1A3D63
#4A7FA7
#B3CFE5
#F6FAFD
```

------------------------------------------------------------------------

# 48. Final Design Principle

PeoplePay360 should look like a **real internal HR/payroll operations
product**, not a collection of hackathon CRUD pages.

The most important design relationship is:

``` text
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

The interface should continuously reinforce these relationships.

**Primary design goal:** \> Make complex HR and payroll business logic
feel simple, visible, and trustworthy to the user.
