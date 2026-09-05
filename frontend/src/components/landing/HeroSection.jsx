import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Play, ShieldCheck, Users, FileText, CalendarDays, Clock, 
  WalletCards, Sliders, Receipt, FileCheck, BarChart3, CheckCircle2, ChevronRight 
} from 'lucide-react';

export default function HeroSection({ onOpenApp, onScrollToWorkflow }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isCoreHovered, setIsCoreHovered] = useState(false);
  const [visibleStep, setVisibleStep] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Staggered entrance animation sequence (1 -> 10)
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setVisibleStep(current);
      if (current >= 10) clearInterval(interval);
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Desktop Mouse Parallax (Restrained 4-8px)
  const handleMouseMove = (e) => {
    if (!containerRef.current || window.innerWidth < 1024) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    setMouseOffset({
      x: (mouseX / rect.width) * 12,
      y: (mouseY / rect.height) * 12
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  const nodes = [
    {
      id: 'contract',
      name: 'CONTRACT',
      icon: FileText,
      tag: 'Active Terms',
      val: 'Full Time • Engineering',
      desc: 'Period-specific wage rate & terms',
      left: '6%', top: '6%',
      color: '#4A7FA7',
      cx: 140, cy: 90
    },
    {
      id: 'schedule',
      name: 'WORKING SCHEDULE',
      icon: CalendarDays,
      tag: 'Mon–Fri 09:00–18:00',
      val: '40 hrs / week',
      desc: 'Automatic weekly shift hours',
      left: '52%', top: '2%',
      color: '#1A3D63',
      cx: 370, cy: 65
    },
    {
      id: 'attendance',
      name: 'ATTENDANCE',
      icon: Clock,
      tag: 'Today 09:12 AM',
      val: 'Checked In ✓',
      desc: 'Worked hours & missing checkouts',
      left: '74%', top: '26%',
      color: '#10B981',
      cx: 480, cy: 190
    },
    {
      id: 'timeoff',
      name: 'TIME OFF',
      icon: WalletCards,
      tag: '12 Days Available',
      val: '2 Pending Approval',
      desc: 'Auto leave allocation deduction',
      left: '74%', top: '56%',
      color: '#F59E0B',
      cx: 480, cy: 370
    },
    {
      id: 'salaryrules',
      name: 'SALARY RULES',
      icon: Sliders,
      tag: 'Ordered Engine',
      val: 'Basic • HRA • PF • PT',
      desc: 'Sequenced calculation pipeline',
      left: '48%', top: '78%',
      color: '#4A7FA7',
      cx: 350, cy: 470
    },
    {
      id: 'payrun',
      name: 'PAYRUN',
      icon: Receipt,
      tag: 'September 2026',
      val: '248 Employees Ready',
      desc: '2-Step Wizard & Pre-flight check',
      left: '6%', top: '78%',
      color: '#0A1931',
      cx: 140, cy: 470
    },
    {
      id: 'payslip',
      name: 'PAYSLIP',
      icon: FileCheck,
      tag: 'NET PAYABLE',
      val: '₹73,750 Generated ✓',
      desc: 'Itemized PDF & Nodemailer delivery',
      left: '2%', top: '48%',
      color: '#10B981',
      cx: 110, cy: 320
    },
    {
      id: 'dashboard',
      name: 'DASHBOARD',
      icon: BarChart3,
      tag: 'Operational KPI',
      val: '98.2% Attendance',
      desc: 'Live PostgreSQL aggregated insights',
      left: '2%', top: '24%',
      color: '#4A7FA7',
      cx: 110, cy: 170
    }
  ];

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        paddingTop: '140px',
        paddingBottom: '100px',
        background: 'linear-gradient(180deg, #F6FAFD 0%, #FFFFFF 60%, #EEF5FA 100%)',
        color: '#0A1931',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(26, 61, 99, 0.12)'
      }}
    >
      {/* Background Subtle Ambient Layers */}
      <div className="hero-grid-bg" />
      <div className="hero-ambient-orb-1" />
      <div className="hero-ambient-orb-2" />
      <div className="hero-halo-ring" />

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        position: 'relative',
        zIndex: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>
        
        {/* LEFT COLUMN — CONTENT & MESSAGING */}
        <div style={{ textAlign: 'left', maxWidth: '580px' }}>
          {/* Eyebrow Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(74, 127, 167, 0.1)',
            border: '1px solid rgba(74, 127, 167, 0.25)',
            color: '#1A3D63',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)'
          }} className="animate-fade-up">
            <ShieldCheck size={14} color="#4A7FA7" />
            <span>PEOPLEPAY360 • HR & PAYROLL OPERATIONS</span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(38px, 4.5vw, 56px)',
            fontWeight: '800',
            lineHeight: '1.12',
            letterSpacing: '-1.5px',
            color: '#0A1931',
            margin: '0 0 20px 0'
          }} className="animate-fade-up stagger-1">
            EVERY EMPLOYEE <br />
            HAS A STORY. <br />
            <span style={{ color: '#4A7FA7' }}>
              PEOPLEPAY360 CONNECTS <br />
              EVERY CHAPTER.
            </span>
          </h1>

          {/* Compact Subtext */}
          <p style={{
            fontSize: '16px',
            lineHeight: '1.65',
            color: '#4A7FA7',
            fontWeight: '500',
            margin: '0 0 36px 0',
            maxWidth: '520px'
          }} className="animate-fade-up stagger-2">
            From employee records and contracts to attendance, time off, salary rules, payroll and payslips — manage the complete workforce lifecycle through one connected operational workflow.
          </p>

          {/* Action CTAs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }} className="animate-fade-up stagger-3">
            <button
              onClick={onOpenApp}
              aria-label="Open PeoplePay360 Platform"
              className="btn btn-primary"
              style={{
                backgroundColor: '#0A1931',
                color: '#B3CFE5',
                padding: '14px 30px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(10, 25, 49, 0.2)',
                transition: 'transform 180ms ease'
              }}
            >
              <span>OPEN PLATFORM</span>
              <ArrowRight size={16} color="#B3CFE5" />
            </button>

            <button
              onClick={onScrollToWorkflow}
              aria-label="Explore PeoplePay360 Workflow"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(26, 61, 99, 0.2)',
                color: '#0A1931',
                padding: '14px 26px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(10, 25, 49, 0.05)',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F6FAFD';
                e.currentTarget.style.borderColor = '#0A1931';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(26, 61, 99, 0.2)';
              }}
            >
              <Play size={14} color="#4A7FA7" />
              <span>EXPLORE WORKFLOW</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN — WORKFORCE DNA ECOSYSTEM VISUALIZATION */}
        <div 
          className="landing-desktop-dna"
          style={{
            position: 'relative',
            width: '100%',
            height: '560px',
            transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0px)`,
            transition: 'transform 200ms ease-out'
          }}
        >
          {/* SVG Connector Lines System */}
          <svg 
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {nodes.map((node) => {
              const coreX = 300; // Center Hub Core X
              const coreY = 280; // Center Hub Core Y
              const isActive = isCoreHovered || hoveredNode === node.id;
              
              // Curve control points
              const pathD = `M ${coreX} ${coreY} Q ${(coreX + node.cx) / 2} ${node.cy - 30}, ${node.cx} ${node.cy}`;

              return (
                <g key={node.id}>
                  {/* Base Connector Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isActive ? '#0A1931' : 'rgba(74, 127, 167, 0.22)'}
                    strokeWidth={isActive ? '2.5' : '1.5'}
                    strokeDasharray={isActive ? 'none' : '4 4'}
                    style={{ transition: 'all 200ms ease' }}
                  />
                  {/* Animated Traveling Particle Dot */}
                  <circle r={isActive ? '4' : '3'} fill={isActive ? '#10B981' : '#4A7FA7'}>
                    <animateMotion
                      path={pathD}
                      dur={isActive ? '2s' : '3.5s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* CENTRAL EMPLOYEE CORE HUB CARD */}
          <div
            onMouseEnter={() => setIsCoreHovered(true)}
            onMouseLeave={() => setIsCoreHovered(false)}
            className="dna-core-card"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              backgroundColor: '#0A1931',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '22px 26px',
              width: '240px',
              border: '2px solid #B3CFE5',
              cursor: 'pointer',
              opacity: visibleStep >= 1 ? 1 : 0,
              transition: 'opacity 300ms ease, transform 250ms ease',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                color: '#0A1931',
                backgroundColor: '#10B981',
                padding: '3px 8px',
                borderRadius: '12px'
              }}>
                ● ACTIVE
              </span>
              <span style={{ fontSize: '10px', color: '#B3CFE5', fontWeight: '700', letterSpacing: '0.5px' }}>
                PP360-0248
              </span>
            </div>

            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#B3CFE5',
              color: '#0A1931',
              fontWeight: '800',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px auto'
            }}>
              DE
            </div>

            <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', marginBottom: '2px' }}>
              Demo Employee
            </div>
            <div style={{ fontSize: '12px', color: '#B3CFE5', fontWeight: '600' }}>
              Test User • Product Designer
            </div>
            <div style={{ fontSize: '11px', color: '#4A7FA7', fontWeight: '500', marginTop: '2px' }}>
              Engineering Operations
            </div>

            <div style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(179, 207, 229, 0.15)',
              fontSize: '10px',
              fontWeight: '700',
              color: '#B3CFE5',
              letterSpacing: '0.8px'
            }}>
              WORKFORCE SOURCE HUB
            </div>
          </div>

          {/* SURROUNDING OPERATIONAL NODES (ORBITAL ECOSYSTEM) */}
          {nodes.map((node, idx) => {
            const Icon = node.icon;
            const isVisible = visibleStep >= idx + 2;
            const isHovered = hoveredNode === node.id;

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="dna-node-card"
                style={{
                  position: 'absolute',
                  top: node.top,
                  left: node.left,
                  zIndex: 10,
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${isHovered ? '#0A1931' : 'rgba(26, 61, 99, 0.15)'}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  width: '180px',
                  boxShadow: isHovered ? '0 12px 28px rgba(10, 25, 49, 0.15)' : '0 6px 18px rgba(10, 25, 49, 0.06)',
                  cursor: 'pointer',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
                  transition: 'opacity 300ms ease, transform 300ms ease, border-color 200ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(74, 127, 167, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: node.color
                  }}>
                    <Icon size={14} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0A1931', letterSpacing: '0.3px' }}>
                    {node.name}
                  </span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: '700', color: node.color, marginBottom: '2px' }}>
                  {node.val}
                </div>
                <div style={{ fontSize: '10px', color: '#4A7FA7', fontWeight: '500' }}>
                  {node.tag}
                </div>

                {/* Micro Contextual Detail Drawer on Hover */}
                {isHovered && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(26, 61, 99, 0.1)',
                    fontSize: '10px',
                    color: '#0A1931',
                    fontWeight: '600'
                  }}>
                    ✓ {node.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MOBILE FALLBACK VERTICAL CONNECTED ECOSYSTEM STACK */}
        <div className="landing-mobile-dna" style={{ width: '100%', display: 'none', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          {/* Central Mobile Employee Card */}
          <div style={{
            backgroundColor: '#0A1931',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
            border: '2px solid #B3CFE5',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#0A1931', backgroundColor: '#10B981', padding: '2px 8px', borderRadius: '10px' }}>● ACTIVE</span>
              <span style={{ fontSize: '10px', color: '#B3CFE5', fontWeight: '700' }}>PP360-0248</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>Demo Employee — Test User</div>
            <div style={{ fontSize: '12px', color: '#B3CFE5' }}>Workforce Source Hub</div>
          </div>

          {/* Connected Vertical Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon;
            return (
              <div key={node.id} style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(26, 61, 99, 0.15)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={node.color} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0A1931' }}>{node.name}</div>
                    <div style={{ fontSize: '11px', color: node.color, fontWeight: '700' }}>{node.val}</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#4A7FA7" />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .landing-desktop-dna { display: none !important; }
          .landing-mobile-dna { display: flex !important; }
        }
      `}</style>
    </section>
  );
}
