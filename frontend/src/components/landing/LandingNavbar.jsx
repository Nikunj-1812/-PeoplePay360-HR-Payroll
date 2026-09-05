import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import faviconImg from '../../assets/favicon.jpeg';

export default function LandingNavbar({ onOpenApp, onOpenSignIn }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transition: 'all 200ms ease',
      backgroundColor: scrolled ? 'rgba(246, 250, 253, 0.94)' : 'rgba(246, 250, 253, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(26, 61, 99, 0.1)',
      padding: scrolled ? '12px 0' : '18px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <img 
            src={faviconImg} 
            alt="PeoplePay360" 
            style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover' }} 
          />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0A1931', letterSpacing: '0.3px', lineHeight: 1 }}>
              PeoplePay360
            </div>
            <div style={{ fontSize: '10px', color: '#4A7FA7', fontWeight: '600', marginTop: '2px' }}>
              HR & Payroll Operations
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          fontSize: '13px',
          fontWeight: '600'
        }} className="landing-desktop-nav">
          <button 
            onClick={() => scrollToSection('problem')}
            style={{ background: 'none', border: 'none', color: '#0A1931', cursor: 'pointer', opacity: 0.8, transition: 'opacity 150ms' }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            Platform
          </button>
          <button 
            onClick={() => scrollToSection('workflow')}
            style={{ background: 'none', border: 'none', color: '#0A1931', cursor: 'pointer', opacity: 0.8, transition: 'opacity 150ms' }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            Workflow
          </button>
          <button 
            onClick={() => scrollToSection('capabilities')}
            style={{ background: 'none', border: 'none', color: '#0A1931', cursor: 'pointer', opacity: 0.8, transition: 'opacity 150ms' }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('roles')}
            style={{ background: 'none', border: 'none', color: '#0A1931', cursor: 'pointer', opacity: 0.8, transition: 'opacity 150ms' }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            Roles & RBAC
          </button>
          <button 
            onClick={() => scrollToSection('security')}
            style={{ background: 'none', border: 'none', color: '#0A1931', cursor: 'pointer', opacity: 0.8, transition: 'opacity 150ms' }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            Security
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenSignIn}
            style={{
              background: 'transparent',
              border: '1px solid rgba(26, 61, 99, 0.25)',
              color: '#0A1931',
              padding: '7px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(74, 127, 167, 0.08)';
              e.currentTarget.style.borderColor = '#0A1931';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(26, 61, 99, 0.25)';
            }}
          >
            Sign In
          </button>

          <button
            onClick={onOpenApp}
            className="btn btn-primary"
            style={{
              backgroundColor: '#0A1931',
              color: '#B3CFE5',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(10, 25, 49, 0.15)'
            }}
          >
            <span>Open Platform</span>
            <ArrowRight size={15} color="#B3CFE5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0A1931',
              cursor: 'pointer',
              padding: '4px',
              display: 'none'
            }}
            className="landing-mobile-toggle"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(26, 61, 99, 0.15)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button onClick={() => scrollToSection('problem')} style={{ textAlign: 'left', background: 'none', border: 'none', color: '#0A1931', fontSize: '14px', padding: '8px 0', fontWeight: '600' }}>Platform</button>
          <button onClick={() => scrollToSection('workflow')} style={{ textAlign: 'left', background: 'none', border: 'none', color: '#0A1931', fontSize: '14px', padding: '8px 0', fontWeight: '600' }}>Workflow</button>
          <button onClick={() => scrollToSection('capabilities')} style={{ textAlign: 'left', background: 'none', border: 'none', color: '#0A1931', fontSize: '14px', padding: '8px 0', fontWeight: '600' }}>Features</button>
          <button onClick={() => scrollToSection('roles')} style={{ textAlign: 'left', background: 'none', border: 'none', color: '#0A1931', fontSize: '14px', padding: '8px 0', fontWeight: '600' }}>Roles & RBAC</button>
          <button onClick={() => scrollToSection('security')} style={{ textAlign: 'left', background: 'none', border: 'none', color: '#0A1931', fontSize: '14px', padding: '8px 0', fontWeight: '600' }}>Security</button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .landing-desktop-nav { display: none !important; }
          .landing-mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
}
