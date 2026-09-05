import React from 'react';
import { ArrowRight, BarChart3, Check, CheckCircle2, Clock3, FileText, Menu, Users, WalletCards, X } from 'lucide-react';
import faviconImg from '../../assets/favicon.jpeg';

export default function LandingPage({ onOpenApp, onOpenSignIn }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const signIn = onOpenSignIn || onOpenApp;

  const jumpTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-reference-page">
      <style>{`
        .landing-reference-page { min-height: 100vh; color: #0A1931; background: #FFFFFF; font-family: Inter, sans-serif; overflow-x: hidden; }
        .landing-reference-page *, .landing-reference-page *::before, .landing-reference-page *::after { box-sizing: border-box; }
        .reference-nav { height: 62px; border-bottom: 1px solid #E6EDF2; display: flex; align-items: center; background: rgba(255,255,255,.94); position: sticky; top: 0; z-index: 10; }
        .reference-nav-inner { width: min(1180px, calc(100% - 48px)); margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .reference-brand { display: flex; align-items: center; gap: 9px; cursor: pointer; }
        .reference-brand img { width: 30px; height: 30px; object-fit: cover; border-radius: 7px; }
        .reference-brand span { font-size: 16px; font-weight: 800; letter-spacing: -.3px; }
        .reference-nav-links { display: flex; align-items: center; gap: 30px; }
        .reference-nav-links button, .reference-login { border: 0; background: transparent; color: #52677B; cursor: pointer; font: inherit; font-size: 11px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; }
        .reference-nav-links button:hover, .reference-login:hover { color: #0A1931; }
        .reference-nav-actions { display: flex; align-items: center; gap: 22px; }
        .reference-cta { border: 0; border-radius: 999px; padding: 10px 20px; background: #4A7FA7; color: #FFFFFF; cursor: pointer; font: inherit; font-size: 12px; font-weight: 800; box-shadow: 0 5px 14px rgba(74,127,167,.18); }
        .reference-cta:hover { background: #1A3D63; }
        .reference-menu { display: none; border: 0; background: transparent; color: #0A1931; cursor: pointer; }
        .reference-hero { min-height: 506px; position: relative; display: flex; align-items: center; justify-content: center; text-align: center; border-bottom: 1px solid #E6EDF2; overflow: hidden; }
        .reference-hero::before, .reference-final::before { content: ''; position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(#DDEAF0 1px, transparent 1px), linear-gradient(90deg, #DDEAF0 1px, transparent 1px); background-size: 42px 42px; opacity: .48; mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent 92%); }
        .reference-hero-content { position: relative; z-index: 1; width: min(740px, calc(100% - 40px)); animation: reference-rise .7s ease both; }
        .reference-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 13px; border: 1px solid #D9E9F0; border-radius: 999px; color: #4A7FA7; background: rgba(246,250,253,.8); font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
        .reference-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #4A7FA7; }
        .reference-hero h1 { margin: 28px 0 18px; font-size: clamp(42px, 6vw, 69px); line-height: .99; letter-spacing: -3px; font-weight: 850; }
        .reference-hero h1 span { display: block; color: #4A7FA7; }
        .reference-hero p { max-width: 580px; margin: 0 auto; color: #687E90; font-size: 15px; line-height: 1.65; }
        .reference-hero .reference-cta { margin-top: 28px; padding: 14px 25px; }
        .reference-section { border-bottom: 1px solid #E6EDF2; }
        .reference-section-inner { width: min(920px, calc(100% - 48px)); margin: 0 auto; padding: 82px 0 86px; }
        .reference-section-heading { text-align: center; max-width: 620px; margin: 0 auto 42px; }
        .reference-section-heading .reference-label { color: #4A7FA7; font-size: 10px; font-weight: 850; letter-spacing: 1.2px; text-transform: uppercase; }
        .reference-section-heading h2 { margin: 13px 0 12px; font-size: clamp(27px, 4vw, 39px); line-height: 1.08; letter-spacing: -1.4px; }
        .reference-section-heading p { margin: 0; color: #718596; font-size: 14px; line-height: 1.65; }
        .reference-compare { display: flex; gap: 28px; }
        .reference-compare-panel { flex: 1; min-height: 225px; padding: 29px; border: 1px solid #E1E9EE; border-radius: 18px; }
        .reference-compare-panel.good { border-color: #CDE2E9; background: #F5FAFB; }
        .reference-panel-title { margin-bottom: 22px; color: #8798A6; font-size: 12px; font-weight: 850; letter-spacing: .7px; }
        .reference-compare-panel.good .reference-panel-title { color: #4A7FA7; }
        .reference-list { display: grid; gap: 14px; }
        .reference-list-item { display: flex; align-items: flex-start; gap: 10px; color: #546B7E; font-size: 12px; line-height: 1.35; }
        .reference-list-item svg { flex: 0 0 auto; margin-top: 1px; color: #BCC9D1; }
        .reference-compare-panel.good .reference-list-item { color: #0A1931; font-weight: 650; }
        .reference-compare-panel.good .reference-list-item svg { color: #4A7FA7; }
        .reference-workflow { background: #FFFFFF; }
        .reference-timeline { width: min(650px, 100%); margin: 0 auto; border-left: 1px solid #C9D9E2; padding: 0 0 2px 29px; }
        .reference-step { position: relative; padding: 0 0 32px; }
        .reference-step:last-child { padding-bottom: 0; }
        .reference-step::before { content: ''; position: absolute; width: 17px; height: 17px; left: -39px; top: 0; border: 1px solid #4A7FA7; border-radius: 50%; background: #FFFFFF; }
        .reference-step::after { content: ''; position: absolute; width: 5px; height: 5px; left: -33px; top: 6px; border-radius: 50%; background: #4A7FA7; }
        .reference-step small { color: #4A7FA7; font-size: 9px; font-weight: 850; letter-spacing: 1px; text-transform: uppercase; }
        .reference-step h3 { margin: 6px 0 7px; font-size: 16px; }
        .reference-step h3 svg { margin-right: 7px; vertical-align: -3px; color: #4A7FA7; }
        .reference-step p { margin: 0; color: #718596; font-size: 12px; line-height: 1.6; }
        .reference-final { position: relative; overflow: hidden; text-align: center; border-bottom: 1px solid #E6EDF2; }
        .reference-final-inner { position: relative; z-index: 1; width: min(700px, calc(100% - 48px)); margin: 0 auto; padding: 92px 0 96px; }
        .reference-final h2 { margin: 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -1.5px; }
        .reference-final p { max-width: 520px; margin: 16px auto 26px; color: #718596; font-size: 14px; line-height: 1.65; }
        .reference-footer { width: min(1180px, calc(100% - 48px)); margin: 0 auto; min-height: 78px; display: flex; align-items: center; justify-content: space-between; color: #8293A0; font-size: 11px; }
        .reference-footer-brand { display: flex; align-items: center; gap: 8px; color: #0A1931; font-weight: 800; }
        .reference-footer-brand img { width: 24px; height: 24px; border-radius: 5px; }
        .reference-footer-links { display: flex; gap: 20px; }
        @keyframes reference-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 760px) { .reference-nav-inner, .reference-footer { width: min(100% - 32px, 1180px); } .reference-nav-links, .reference-nav-actions .reference-login { display: none; } .reference-menu { display: block; } .reference-nav-actions { gap: 10px; } .reference-hero { min-height: 540px; } .reference-compare { display: block; } .reference-compare-panel { margin-bottom: 14px; } .reference-section-inner { width: min(100% - 32px, 920px); padding: 64px 0; } .reference-footer { min-height: 110px; align-items: flex-start; padding: 24px 0; gap: 20px; flex-direction: column; } }
        @media (prefers-reduced-motion: reduce) { .reference-hero-content { animation: none; } }
      `}</style>

      <header className="reference-nav">
        <div className="reference-nav-inner">
          <div className="reference-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={faviconImg} alt="PeoplePay360" /><span>PeoplePay360</span>
          </div>
          <nav className="reference-nav-links">
            <button onClick={() => jumpTo('reference-solve')}>What we solve</button>
            <button onClick={() => jumpTo('reference-workflow')}>How it works</button>
          </nav>
          <div className="reference-nav-actions">
            <button className="reference-login" onClick={signIn}>Login</button>
            <button className="reference-cta" onClick={onOpenApp}>Get started <ArrowRight size={13} /></button>
            <button className="reference-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </header>
      {menuOpen && <div style={{ position: 'sticky', top: 62, zIndex: 9, background: '#FFFFFF', borderBottom: '1px solid #E6EDF2', padding: '12px 20px', display: 'flex', gap: 18, justifyContent: 'center' }}><button className="reference-login" onClick={() => jumpTo('reference-solve')}>What we solve</button><button className="reference-login" onClick={() => jumpTo('reference-workflow')}>How it works</button></div>}

      <main>
        <section className="reference-hero">
          <div className="reference-hero-content">
            <div className="reference-eyebrow"><span className="reference-eyebrow-dot" /> connected_workforce_operations</div>
            <h1>Manage every person.<span>Understand every payment.</span></h1>
            <p>The calm operational workspace connecting employee records, contracts, attendance, time off and payroll rules into one reliable source of truth.</p>
            <button className="reference-cta" onClick={onOpenApp}>Open PeoplePay360 <ArrowRight size={14} /></button>
          </div>
        </section>

        <section id="reference-solve" className="reference-section">
          <div className="reference-section-inner">
            <div className="reference-section-heading"><div className="reference-label">What we solve</div><h2>Stop losing context across payroll.</h2><p>Spreadsheets and disconnected tools make every payroll cycle harder to trust. PeoplePay360 keeps the source data and the decisions together.</p></div>
            <div className="reference-compare">
              <div className="reference-compare-panel"><div className="reference-panel-title">FRAGMENTED HR OPERATIONS</div><div className="reference-list"><div className="reference-list-item"><X size={15} /> Manual employee and contract updates</div><div className="reference-list-item"><X size={15} /> Attendance exceptions found too late</div><div className="reference-list-item"><X size={15} /> Leave balances tracked in isolation</div><div className="reference-list-item"><X size={15} /> Salary calculations nobody can explain</div><div className="reference-list-item"><X size={15} /> Payroll warnings hidden until finalization</div></div></div>
              <div className="reference-compare-panel good"><div className="reference-panel-title">PEOPLEPAY360 OPERATIONS</div><div className="reference-list"><div className="reference-list-item"><Check size={15} /> One employee record across every module</div><div className="reference-list-item"><Check size={15} /> Live attendance and missing checkout alerts</div><div className="reference-list-item"><Check size={15} /> Approved leave updates balances automatically</div><div className="reference-list-item"><Check size={15} /> Ordered salary rules show the calculation path</div><div className="reference-list-item"><Check size={15} /> Validated payslips, PDFs and delivery status</div></div></div>
            </div>
          </div>
        </section>

        <section id="reference-workflow" className="reference-section reference-workflow">
          <div className="reference-section-inner">
            <div className="reference-section-heading"><div className="reference-label">How it works</div><h2>Your people data. Fully connected.</h2><p>From the first employee record to the final payslip, every operational step has a clear place.</p></div>
            <div className="reference-timeline">
              <div className="reference-step"><small>Stage 01</small><h3><Users size={16} /> Employee & contract</h3><p>Capture the person, period-valid contract, schedule and role in one dependable starting point.</p></div>
              <div className="reference-step"><small>Stage 02</small><h3><Clock3 size={16} /> Attendance & time off</h3><p>Track worked time, exceptions, approvals and leave balances with the context payroll needs.</p></div>
              <div className="reference-step"><small>Stage 03</small><h3><WalletCards size={16} /> Salary rules</h3><p>Apply ordered earnings and deductions so gross, net and every line between them stays explainable.</p></div>
              <div className="reference-step"><small>Stage 04</small><h3><FileText size={16} /> Payrun & payslip</h3><p>Review warnings, validate the batch, generate a PDF and see which payslips are ready to send.</p></div>
              <div className="reference-step"><small>Stage 05</small><h3><BarChart3 size={16} /> Live decisions</h3><p>Give HR and payroll a clear dashboard built from the same records that power the workflow.</p></div>
            </div>
          </div>
        </section>

        <section className="reference-final"><div className="reference-final-inner"><h2>Ready to make payroll easier to trust?</h2><p>Bring HR operations, payroll logic and employee visibility into one workspace built for the work that happens every day.</p><button className="reference-cta" onClick={onOpenApp}>Get started with PeoplePay360 <ArrowRight size={14} /></button></div></section>
      </main>

      <footer className="reference-footer"><div className="reference-footer-brand"><img src={faviconImg} alt="" /> PeoplePay360</div><span>Â© 2026 PeoplePay360. HR & Payroll Operations.</span><div className="reference-footer-links"><span>Secure by design</span><span>Admin login</span></div></footer>
    </div>
  );
}
