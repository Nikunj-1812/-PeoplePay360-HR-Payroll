import React, { useState, useRef } from 'react';
import { 
  Users, FileText, CalendarDays, Clock, WalletCards, Sliders, 
  Receipt, FileCheck, BarChart3, ChevronLeft, ChevronRight, Check, BookOpen
} from 'lucide-react';

export default function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(''); // 'next' | 'prev' | 'rewind'
  const [leafData, setLeafData] = useState(null);
  
  const timerRef = useRef(null);

  const steps = [
    {
      id: 'employee',
      stepNum: '01',
      name: 'Employee',
      icon: Users,
      tag: '01 • CENTRAL WORKFORCE RECORD',
      title: 'Employee Profile & Organization',
      summary: 'Centralizes workforce profiles, department structures, job positions, and historical employment context into a single operational hub.',
      highlights: [
        'Central hub linked to contracts, attendance & payslips',
        'Automatic department & manager hierarchy mapping',
        'Real-time Redis cache invalidation on profile updates'
      ],
      preview: {
        label: 'Demo Employee — Master Record Sheet',
        details: [
          'Employee ID : EMP-2026-001',
          'Position    : Senior Software Engineer',
          'Department  : Engineering Operations',
          'Manager     : Rajesh Verma (VP Tech)',
          'Schedule    : Standard 40h Weekly Pattern',
          'Status      : ACTIVE EMPLOYEE'
        ]
      }
    },
    {
      id: 'contract',
      stepNum: '02',
      name: 'Contract',
      icon: FileText,
      tag: '02 • PERIOD-SPECIFIC WAGES',
      title: 'Historical & Active Contracts',
      summary: 'Payroll calculates wages strictly using the contract applicable to the selected period, avoiding duplicate or misaligned historical salary rates.',
      highlights: [
        'Strict period-based contract resolution logic',
        'Prevents concurrent overlapping active contracts',
        'Directly links wage rate to Payrun rule engine'
      ],
      preview: {
        label: 'CNT-2026-001 — Active Contract Terms',
        details: [
          'Contract Ref : CNT-2026-001',
          'Basic Wage   : ₹ 95,000.00 / month',
          'Start Date   : 01-01-2026',
          'End Date     : 31-12-2027 (Permanent)',
          'Structure    : Standard Regular Salary',
          'Validation   : VALIDATED FOR SEP 2026'
        ]
      }
    },
    {
      id: 'schedule',
      stepNum: '03',
      name: 'Schedule',
      icon: CalendarDays,
      tag: '03 • WORKING HOURS PATTERN',
      title: 'Working Schedule Rules',
      summary: 'Defines weekly working shifts, break times, and expected monthly working hours automatically without requiring manual calculated inputs.',
      highlights: [
        'Automated weekly hour pattern calculation',
        'Support for Mon–Fri standard & flexible shifts',
        'Baseline reference for attendance exceptions'
      ],
      preview: {
        label: 'SCH-STD-40 — Working Schedule Pattern',
        details: [
          'Schedule Ref : SCH-STD-40',
          'Shift Hours  : 09:00 AM → 06:00 PM',
          'Break Time   : 01:00 Hour (Unpaid)',
          'Weekly Hours : 40.0 Hours / Week',
          'Expected Days: 22 Working Days / Mo',
          'Overtime Rule: Applicable > 40h'
        ]
      }
    },
    {
      id: 'attendance',
      stepNum: '04',
      name: 'Attendance',
      icon: Clock,
      tag: '04 • CHECK IN & TIME LOGS',
      title: 'Check In & Exception Tracking',
      summary: 'Tracks daily Check In / Check Out timestamps, calculates worked hours, and flags missing checkouts or late check-ins for HR correction.',
      highlights: [
        'Self-service employee Check In / Check Out',
        'Missing checkout exception detection',
        'HR manual correction workflow with audit logs'
      ],
      preview: {
        label: 'Attendance Sheet — September 2026',
        details: [
          'Check In Time: 09:02 AM (On-Time ✓)',
          'Check Out   : 06:05 PM',
          'Worked Hours: 8.05 Hours',
          'Late Status  : No (Within Grace 15m)',
          'Overtime     : 0.05 Hours',
          'Status       : PRESENT & VERIFIED'
        ]
      }
    },
    {
      id: 'time-off',
      stepNum: '05',
      name: 'Time Off',
      icon: WalletCards,
      tag: '05 • LEAVE REQUESTS & BALANCES',
      title: 'Leave Allocations & Deductions',
      summary: 'Manages leave types, allocation balances, and request workflows. Approved requests automatically deduct balances and feed payroll.',
      highlights: [
        'Approved leave automatically updates balance',
        'HR Manager approval & refusal workflow',
        'Seamless integration with payroll period engine'
      ],
      preview: {
        label: 'Leave Request #LR-2026-84 Detail',
        details: [
          'Leave Type   : Paid Casual Leave',
          'Dates Requested: 08-09-2026 → 09-09-2026',
          'Days Count   : 2.0 Days',
          'Status       : APPROVED BY MANAGER',
          'Allocation   : 13.0 Days Remaining',
          'Payroll Note : Fully Paid Absence'
        ]
      }
    },
    {
      id: 'rules',
      stepNum: '06',
      name: 'Salary Rules',
      icon: Sliders,
      tag: '06 • SEQUENCED CALCULATION ENGINE',
      title: 'Ordered Salary Computation Rules',
      summary: 'Applies sequenced computation rules (Basic → HRA → Gross → PF → PT → Net) based on percentages, fixed amounts, or formulas.',
      highlights: [
        'Sequence-ordered execution pipeline',
        'Fixed, percentage, and formula computation',
        'Transparent calculation breakdowns'
      ],
      preview: {
        label: 'Salary Structure — Rule Sequence Engine',
        details: [
          'Rule 10 (Basic) : 50% Wage = ₹ 47,500.00',
          'Rule 20 (HRA)   : 40% Basic = ₹ 19,000.00',
          'Rule 30 (Gross) : Sum Earnings = ₹ 76,000.00',
          'Rule 40 (PF)    : 12% Basic = - ₹ 5,700.00',
          'Rule 50 (PT)    : Statutory = - ₹ 200.00',
          'Rule 100 (Net)  : Gross - Deductions = ₹ 70,100.00'
        ]
      }
    },
    {
      id: 'payrun',
      stepNum: '07',
      name: 'Payrun',
      icon: Receipt,
      tag: '07 • TWO-STEP BATCH PROCESSING',
      title: 'Two-Step Payrun State Machine',
      summary: 'Step 1 Scope selection → Step 2 Employee resolution with pre-flight warnings for missing bank info or invalid contracts.',
      highlights: [
        'Mandatory two-step creation wizard',
        'Pre-flight payroll exception blocking',
        'Draft → Computing → Validated → Paid state flow'
      ],
      preview: {
        label: 'Payrun Batch #PR-2026-09 Summary',
        details: [
          'Period       : 01-09-2026 → 30-09-2026',
          'Employees    : 250 Included',
          'Total Gross  : ₹ 1,90,00,000.00',
          'Total Net    : ₹ 1,75,25,000.00',
          'Warnings     : 0 Unresolved Issues',
          'Current State: VALIDATED & READY TO PAY'
        ]
      }
    },
    {
      id: 'payslip',
      stepNum: '08',
      name: 'Payslip',
      icon: FileCheck,
      tag: '08 • ITEMIZATION & DELIVERY',
      title: 'Itemized Payslips & Bulk Email',
      summary: 'Generates itemized PDF payslips with complete earnings/deduction lines and provides one-click Nodemailer bulk email delivery.',
      highlights: [
        'Printable PDF payslip generation',
        'Backend Nodemailer bulk email delivery',
        'Employee self-service access to past payslips'
      ],
      preview: {
        label: 'Payslip Ref #PS-2026-09-001',
        details: [
          'Employee Name: Demo Employee',
          'Gross Earnings: ₹ 76,000.00',
          'Total Deductions: ₹ 5,900.00',
          'Net Payable  : ₹ 70,100.00',
          'PDF Status   : GENERATED ✓',
          'Email Status : DELIVERED TO USER ✓'
        ]
      }
    },
    {
      id: 'insight',
      stepNum: '09',
      name: 'Insight',
      icon: BarChart3,
      tag: '09 • LIVE OPERATIONAL VISIBILITY',
      title: 'Live HR & Payroll Dashboard',
      summary: 'Aggregates real-time PostgreSQL database metrics on salary expenditure, department costs, and attendance health.',
      highlights: [
        'Live aggregated database metrics',
        'Department salary breakdown charts',
        'Filterable by period, department & role'
      ],
      preview: {
        label: 'Payroll Dashboard Executive Insights',
        details: [
          'Net Payroll  : ₹ 1,75,25,000.00 Paid',
          'Payslips     : 250 Validated',
          'Avg Salary   : ₹ 70,100.00 / Employee',
          'Attendance   : 96.4% Health Score',
          'Top Dept     : Engineering (42% Cost)',
          'Data Engine  : PostgreSQL Live Sync'
        ]
      }
    }
  ];

  const current = steps[activeStep];
  const CurrentIcon = current.icon;

  const handleNextPage = () => {
    if (isFlipping) return;

    if (activeStep === steps.length - 1) {
      // Last page -> Rewind back to Page 1
      setIsFlipping(true);
      setFlipDirection('rewind');
      setLeafData({
        front: current,
        back: steps[0]
      });

      timerRef.current = setTimeout(() => {
        setActiveStep(0);
        setIsFlipping(false);
        setFlipDirection('');
        setLeafData(null);
      }, 900);
    } else {
      // Normal Next Page flip anchored at center spine (0% 50%)
      const targetStep = activeStep + 1;
      setIsFlipping(true);
      setFlipDirection('next');
      setLeafData({
        front: current,
        back: steps[targetStep]
      });

      timerRef.current = setTimeout(() => {
        setActiveStep(targetStep);
        setIsFlipping(false);
        setFlipDirection('');
        setLeafData(null);
      }, 800);
    }
  };

  const handlePrevPage = () => {
    if (isFlipping) return;

    if (activeStep === 0) {
      // First page -> Loop to last page with rewind animation
      setIsFlipping(true);
      setFlipDirection('rewind');
      setLeafData({
        front: current,
        back: steps[steps.length - 1]
      });

      timerRef.current = setTimeout(() => {
        setActiveStep(steps.length - 1);
        setIsFlipping(false);
        setFlipDirection('');
        setLeafData(null);
      }, 900);
    } else {
      // Normal Prev Page flip
      const targetStep = activeStep - 1;
      setIsFlipping(true);
      setFlipDirection('prev');
      setLeafData({
        front: current,
        back: steps[targetStep]
      });

      timerRef.current = setTimeout(() => {
        setActiveStep(targetStep);
        setIsFlipping(false);
        setFlipDirection('');
        setLeafData(null);
      }, 800);
    }
  };

  const handleSelectTab = (idx) => {
    if (isFlipping || idx === activeStep) return;
    setIsFlipping(true);
    setFlipDirection(idx > activeStep ? 'next' : 'prev');
    setLeafData({
      front: current,
      back: steps[idx]
    });

    timerRef.current = setTimeout(() => {
      setActiveStep(idx);
      setIsFlipping(false);
      setFlipDirection('');
      setLeafData(null);
    }, 800);
  };

  return (
    <section id="workflow" style={{
      padding: '100px 0',
      backgroundColor: '#FFFFFF',
      color: '#0A1931',
      borderBottom: '1px solid rgba(26, 61, 99, 0.12)',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 40px auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(74, 127, 167, 0.1)',
            color: '#1A3D63',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            <BookOpen size={14} color="#4A7FA7" />
            <span>SIGNATURE WORKFLOW</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#0A1931',
            marginBottom: '14px'
          }}>
            One workforce. One connected operational flow.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4A7FA7',
            lineHeight: '1.6'
          }}>
            Experience the PeoplePay360 lifecycle in a 3D physical operational diary. Flip pages to see how employee records directly power final payslips.
          </p>
        </div>

        {/* 3D BOOK / DIARY CONTAINER */}
        <div className="book-3d-wrapper">
          {/* Controls Bar */}
          <div style={{
            backgroundColor: '#0A1931',
            borderRadius: '12px 12px 0 0',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#F6FAFD',
            borderBottom: '1px solid rgba(179, 207, 229, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} color="#B3CFE5" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#B3CFE5', letterSpacing: '0.5px' }}>
                PeoplePay360 Operational Notebook
              </span>
            </div>

            {/* Navigation Controls & Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#B3CFE5' }}>
                {current.stepNum} / 09
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePrevPage}
                  disabled={isFlipping || activeStep === 0}
                  aria-label="Previous workflow page"
                  style={{
                    backgroundColor: 'rgba(179, 207, 229, 0.12)',
                    border: '1px solid rgba(179, 207, 229, 0.25)',
                    color: activeStep === 0 ? '#4A7FA7' : '#F6FAFD',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: isFlipping || activeStep === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: activeStep === 0 ? 0.5 : 1,
                    transition: 'all 150ms ease'
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous Page</span>
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={isFlipping}
                  aria-label="Next workflow page"
                  style={{
                    backgroundColor: '#B3CFE5',
                    border: 'none',
                    color: '#0A1931',
                    padding: '7px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isFlipping ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(179, 207, 229, 0.3)',
                    opacity: isFlipping ? 0.7 : 1,
                    transition: 'all 150ms ease'
                  }}
                >
                  <span>{activeStep === steps.length - 1 ? 'Rewind to Page 1' : 'Next Page'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* DUAL PAGE OPEN SPREAD CONTAINER */}
          <div className="book-spread-container">
            {/* STATIONARY CENTRAL SPINE HINGE */}
            <div className="stationary-center-spine" />

            {/* LEFT HALF PAGE (STATIONARY) */}
            <div className="book-left-half">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: '800',
                color: '#4A7FA7',
                letterSpacing: '1px',
                marginBottom: '12px',
                padding: '4px 10px',
                backgroundColor: '#F6FAFD',
                borderRadius: '4px',
                border: '1px solid rgba(26, 61, 99, 0.08)'
              }}>
                <span>{current.tag}</span>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0A1931', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CurrentIcon size={26} color="#4A7FA7" />
                {current.title}
              </h3>

              <p style={{ fontSize: '14px', color: '#4A7FA7', lineHeight: '1.65', marginBottom: '20px' }}>
                {current.summary}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {current.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0A1931', fontWeight: '600' }}>
                    <Check size={15} color="#10B981" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT HALF PAGE (STATIONARY) */}
            <div className="book-right-half">
              <div style={{
                backgroundColor: '#F6FAFD',
                borderRadius: '10px',
                border: '1px solid rgba(26, 61, 99, 0.12)',
                padding: '20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(26, 61, 99, 0.1)',
                    paddingBottom: '10px',
                    marginBottom: '14px'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0A1931' }}>
                      {current.preview.label}
                    </span>
                    <span className="badge badge-active" style={{ fontSize: '10px' }}>
                      VALIDATED RECORD
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {current.preview.details.map((line, idx) => (
                      <div key={idx} style={{
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid rgba(26, 61, 99, 0.08)',
                        fontSize: '12px',
                        color: '#0A1931',
                        fontWeight: '600',
                        fontFamily: 'monospace'
                      }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(26, 61, 99, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#4A7FA7'
                }}>
                  <span>PostgreSQL Model Engine</span>
                  <span style={{ color: '#10B981', fontWeight: '700' }}>✓ Live Verified</span>
                </div>
              </div>
            </div>

            {/* DYNAMIC FLIPPING LEAF (ANCHORED AT CENTER SPINE) */}
            {isFlipping && leafData && (
              <div className={`flipping-right-leaf-container ${
                flipDirection === 'rewind' 
                  ? 'animate-book-rewind' 
                  : flipDirection === 'next' 
                    ? 'animate-spine-flip-next' 
                    : 'animate-spine-flip-prev'
              }`}>
                {/* Dynamic Shadow Overlay */}
                <div className="leaf-shadow-overlay" />

                {/* Front Face (Visible before flip) */}
                <div className="leaf-face-front">
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#4A7FA7', marginBottom: '8px' }}>
                    {leafData.front.tag}
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0A1931', marginBottom: '12px' }}>
                    {leafData.front.title}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {leafData.front.preview.details.slice(0, 4).map((d, i) => (
                      <div key={i} style={{ padding: '6px 10px', backgroundColor: '#F6FAFD', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Back Face (Visible after 180° rotation) */}
                <div className="leaf-face-back">
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#4A7FA7', marginBottom: '8px' }}>
                    {leafData.back.tag}
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0A1931', marginBottom: '12px' }}>
                    {leafData.back.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#4A7FA7', lineHeight: '1.5', marginBottom: '12px' }}>
                    {leafData.back.summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
