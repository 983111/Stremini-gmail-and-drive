import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '⬡',
    title: 'Slide Builder',
    desc: 'Turn raw documents into boardroom-ready presentations. Your master template, your brand — zero reformatting.',
  },
  {
    icon: '⬢',
    title: 'Form Architect',
    desc: 'Build complex branching logic forms from plain language. Route responses, validate inputs, publish instantly.',
  },
  {
    icon: '◈',
    title: 'Drive Intelligence',
    desc: 'Categorize, tag, and permission thousands of files based on content analysis. Your Drive, finally organized.',
  },
  {
    icon: '◉',
    title: 'Mail Synthesis',
    desc: 'Read, compose, and summarize entire threads in seconds. Draft with AI, send with confidence.',
  },
  {
    icon: '⬡',
    title: 'Database Engine',
    desc: 'Describe any dataset in plain language. AI architects the schema, populates sample data, and keeps it synced.',
  },
  {
    icon: '◈',
    title: 'Document Studio',
    desc: 'Write, rewrite, and query your documents with a built-in AI assistant that understands full context.',
  },
];

const LOGOS = ['VERTEX AI', 'GEMINI', 'FIREBASE', 'WORKSPACE', 'CHROME'];

const STATS = [
  { value: '10x', label: 'Faster document workflows' },
  { value: '2026', label: 'Built for modern enterprise' },
  { value: '∞', label: 'Automations, zero limits' },
];

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');

        .landing-root {
          font-family: 'Syne', sans-serif;
          background: #f5f2ee;
          color: #0f0e0d;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* NAV */
        .l-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 64px;
          transition: background 0.3s, border-color 0.3s;
        }
        .l-nav.scrolled {
          background: rgba(245,242,238,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e0dcd5;
        }
        .l-nav-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          letter-spacing: -0.5px;
          color: #0f0e0d;
        }
        .l-nav-links {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .l-nav-links a {
          font-size: 13px;
          font-weight: 500;
          color: #5a5550;
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: color 0.2s;
        }
        .l-nav-links a:hover { color: #0f0e0d; }
        .l-nav-cta {
          background: #0f0e0d;
          color: #f5f2ee !important;
          padding: 8px 20px;
          border-radius: 2px;
          font-size: 12px !important;
          font-weight: 600 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          transition: background 0.2s;
        }
        .l-nav-cta:hover { background: #2a2520 !important; color: #f5f2ee !important; }

        /* HERO */
        .l-hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 40px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .l-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,160,130,0.18) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.04) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.04) 40px);
          pointer-events: none;
        }
        .l-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f0e0d;
          color: #f5f2ee;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 1px;
          margin-bottom: 32px;
        }
        .l-hero-eyebrow span {
          width: 6px; height: 6px;
          background: #c5a55a;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .l-hero-h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(48px, 8vw, 96px);
          line-height: 1.0;
          letter-spacing: -0.03em;
          color: #0f0e0d;
          max-width: 900px;
          margin: 0 auto 12px;
        }
        .l-hero-h1 em {
          font-style: italic;
          color: #7a6a55;
        }
        .l-hero-sub {
          font-size: clamp(15px, 2vw, 18px);
          color: #5a5550;
          max-width: 560px;
          margin: 24px auto 48px;
          line-height: 1.65;
          font-weight: 400;
        }
        .l-hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-primary {
          background: #0f0e0d;
          color: #f5f2ee;
          border: none;
          padding: 14px 32px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-primary:hover { background: #2a2520; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-ghost {
          background: transparent;
          color: #0f0e0d;
          border: 1.5px solid #c5bdb0;
          padding: 14px 32px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-ghost:hover { border-color: #0f0e0d; background: rgba(0,0,0,0.03); }

        /* MOCKUP */
        .l-mockup-wrap {
          max-width: 900px;
          margin: 80px auto 0;
          padding: 0 40px;
          position: relative;
        }
        .l-mockup {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #d0c9bf;
          box-shadow: 0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08);
        }
        .l-mockup-bar {
          background: #e8e3dc;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid #d0c9bf;
        }
        .l-mockup-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #c9bdb0;
        }
        .l-mockup-url {
          margin: 0 auto;
          background: #f5f2ee;
          border: 1px solid #d0c9bf;
          border-radius: 3px;
          padding: 3px 14px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #5a5550;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .l-mockup-body {
          display: flex;
          background: #faf9f7;
          min-height: 340px;
        }
        .l-mockup-sidebar {
          width: 180px;
          background: #f0ede7;
          border-right: 1px solid #d0c9bf;
          padding: 20px 12px;
          flex-shrink: 0;
        }
        .l-mockup-sidebar-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8a8078;
          margin-bottom: 12px;
          padding: 0 4px;
        }
        .l-mockup-nav-item {
          padding: 8px 10px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 500;
          color: #5a5550;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
          cursor: default;
        }
        .l-mockup-nav-item.active {
          background: #0f0e0d;
          color: #f5f2ee;
        }
        .l-mockup-nav-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
        }
        .l-mockup-main {
          flex: 1;
          padding: 28px 24px;
        }
        .l-mockup-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .l-mockup-card {
          background: #fff;
          border: 1px solid #e0dcd5;
          border-radius: 4px;
          padding: 14px;
        }
        .l-mockup-card-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #8a8078;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .l-mockup-bar-fill {
          height: 4px;
          border-radius: 2px;
          background: #0f0e0d;
          margin-bottom: 6px;
        }
        .l-mockup-line {
          height: 3px;
          border-radius: 2px;
          background: #e0dcd5;
          margin-bottom: 4px;
        }

        /* TRUST */
        .l-trust {
          border-top: 1px solid #e0dcd5;
          border-bottom: 1px solid #e0dcd5;
          padding: 28px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 60px;
          flex-wrap: wrap;
          background: #eeebe6;
        }
        .l-trust-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8078;
        }
        .l-trust-logos {
          display: flex;
          gap: 40px;
          align-items: center;
          flex-wrap: wrap;
        }
        .l-trust-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: #b0a898;
        }

        /* STATS */
        .l-stats {
          padding: 80px 40px;
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #e0dcd5;
          border: 1px solid #e0dcd5;
          border-radius: 4px;
          overflow: hidden;
        }
        .l-stat {
          background: #f5f2ee;
          padding: 48px 40px;
          text-align: center;
        }
        .l-stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 56px;
          color: #0f0e0d;
          line-height: 1;
          margin-bottom: 12px;
        }
        .l-stat-label {
          font-size: 13px;
          color: #7a7068;
          font-weight: 400;
          letter-spacing: 0.02em;
        }

        /* FEATURES */
        .l-features {
          padding: 100px 40px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .l-section-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8a8078;
          margin-bottom: 16px;
        }
        .l-section-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(36px, 5vw, 56px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: #0f0e0d;
          max-width: 600px;
          margin-bottom: 64px;
        }
        .l-section-title em { font-style: italic; color: #7a6a55; }
        .l-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #e0dcd5;
          border: 1px solid #e0dcd5;
          border-radius: 4px;
          overflow: hidden;
        }
        .l-feature-card {
          background: #f5f2ee;
          padding: 36px 32px;
          transition: background 0.2s;
          cursor: default;
        }
        .l-feature-card:hover { background: #efebe4; }
        .l-feature-icon {
          font-size: 22px;
          margin-bottom: 16px;
          color: #c5a55a;
          display: block;
        }
        .l-feature-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: #0f0e0d;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .l-feature-desc {
          font-size: 13.5px;
          color: #6a6258;
          line-height: 1.65;
          font-weight: 400;
        }

        /* HOW IT WORKS */
        .l-how {
          padding: 100px 40px;
          background: #0f0e0d;
          color: #f5f2ee;
        }
        .l-how-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .l-how .l-section-eyebrow { color: #7a7068; }
        .l-how .l-section-title { color: #f5f2ee; }
        .l-how .l-section-title em { color: #c5a55a; }
        .l-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 48px;
          margin-top: 64px;
        }
        .l-step-num {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #c5a55a;
          margin-bottom: 20px;
        }
        .l-step-title {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          color: #f5f2ee;
          margin-bottom: 10px;
        }
        .l-step-desc {
          font-size: 13px;
          color: #7a7068;
          line-height: 1.65;
        }
        .l-step-line {
          height: 1px;
          background: #2a2520;
          margin-bottom: 24px;
          position: relative;
        }
        .l-step-line::after {
          content: '';
          position: absolute;
          left: 0; top: -1px;
          width: 32px; height: 2px;
          background: #c5a55a;
        }

        /* CTA */
        .l-cta {
          padding: 120px 40px;
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
        }
        .l-cta-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(40px, 6vw, 72px);
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #0f0e0d;
          margin-bottom: 24px;
        }
        .l-cta-title em { font-style: italic; color: #7a6a55; }
        .l-cta-sub {
          font-size: 16px;
          color: #6a6258;
          margin-bottom: 48px;
          line-height: 1.6;
        }

        /* FOOTER */
        .l-footer {
          background: #0f0e0d;
          color: #f5f2ee;
          padding: 60px 40px 40px;
        }
        .l-footer-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .l-footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 40px;
          flex-wrap: wrap;
          padding-bottom: 48px;
          border-bottom: 1px solid #2a2520;
          margin-bottom: 32px;
        }
        .l-footer-brand {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: #f5f2ee;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        .l-footer-tagline {
          font-size: 13px;
          color: #5a5550;
          max-width: 240px;
          line-height: 1.6;
        }
        .l-footer-cols {
          display: flex;
          gap: 64px;
          flex-wrap: wrap;
        }
        .l-footer-col-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #4a4540;
          margin-bottom: 16px;
        }
        .l-footer-col-links {
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .l-footer-col-links li a {
          font-size: 13px;
          color: #7a7068;
          text-decoration: none;
          transition: color 0.2s;
        }
        .l-footer-col-links li a:hover { color: #f5f2ee; }
        .l-footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .l-footer-copy {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #4a4540;
          letter-spacing: 0.04em;
        }
        .l-footer-legal-links {
          display: flex;
          gap: 24px;
        }
        .l-footer-legal-links a {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #4a4540;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.2s;
        }
        .l-footer-legal-links a:hover { color: #7a7068; }

        /* PRIVACY MODAL */
        .l-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,14,13,0.7);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .l-modal {
          background: #f5f2ee;
          border-radius: 4px;
          max-width: 640px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          padding: 48px;
        }
        .l-modal-title {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          color: #0f0e0d;
          margin-bottom: 8px;
        }
        .l-modal-date {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #8a8078;
          letter-spacing: 0.1em;
          margin-bottom: 32px;
        }
        .l-modal-section-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f0e0d;
          margin: 24px 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: 'Syne', sans-serif;
        }
        .l-modal p {
          font-size: 13.5px;
          color: #5a5550;
          line-height: 1.7;
          margin-bottom: 12px;
        }
        .l-modal-close {
          margin-top: 32px;
          display: block;
          width: 100%;
          padding: 12px;
          background: #0f0e0d;
          color: #f5f2ee;
          border: none;
          border-radius: 2px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .l-nav { padding: 0 20px; }
          .l-nav-links { display: none; }
          .l-hero { padding: 100px 24px 60px; }
          .l-mockup-wrap { padding: 0 24px; }
          .l-trust { padding: 24px; gap: 24px; }
          .l-trust-logos { gap: 24px; }
          .l-stats { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; padding: 40px 24px; }
          .l-features { padding: 60px 24px; }
          .l-features-grid { grid-template-columns: 1fr; }
          .l-how { padding: 60px 24px; }
          .l-steps { grid-template-columns: 1fr 1fr; gap: 32px; }
          .l-cta { padding: 80px 24px; }
          .l-footer { padding: 48px 24px 32px; }
          .l-footer-top { flex-direction: column; }
          .l-modal { padding: 28px 24px; }
        }
      `}</style>

      {/* NAV */}
      <PrivacyModal />
      <nav className={`l-nav ${scrollY > 40 ? 'scrolled' : ''}`}>
        <div className="l-nav-logo">Stremini</div>
        <div className="l-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <button className="l-nav-cta" onClick={onGetStarted}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-bg" />
        <div className="l-hero-eyebrow">
          <span />
          Stremini Workspace · 2026
        </div>
        <h1 className="l-hero-h1">
          Your entire Google Workspace,<br />
          <em>working for you.</em>
        </h1>
        <p className="l-hero-sub">
          Stremini connects intelligence to every corner of Workspace — your Drive, Gmail, Forms, Slides, and Docs — so you spend less time managing files and more time on what matters.
        </p>
        <div className="l-hero-actions">
          <button className="btn-primary" onClick={onGetStarted}>Open Workspace</button>
          <a href="#features"><button className="btn-ghost">See Features</button></a>
        </div>

        {/* MOCKUP */}
        <div className="l-mockup-wrap">
          <div className="l-mockup">
            <div className="l-mockup-bar">
              <div className="l-mockup-dot" />
              <div className="l-mockup-dot" />
              <div className="l-mockup-dot" />
              <div className="l-mockup-url">
                <span>🔒</span> workspace.stremini.ai
              </div>
            </div>
            <div className="l-mockup-body">
              <div className="l-mockup-sidebar">
                <div className="l-mockup-sidebar-label">Workspace</div>
                {['Dashboard', 'Drive', 'Mail Queue', 'Documents', 'Databases', 'Forms', 'Slides'].map((item, i) => (
                  <div key={item} className={`l-mockup-nav-item ${i === activeFeature % 7 ? 'active' : ''}`}>
                    <div className="l-mockup-nav-dot" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="l-mockup-main">
                <div className="l-mockup-row">
                  {[['72%','Drive Usage'], ['14','Active Forms'], ['3','Pending Mails']].map(([val, lbl]) => (
                    <div className="l-mockup-card" key={lbl}>
                      <div className="l-mockup-card-label">{lbl}</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#0f0e0d', marginBottom: 8 }}>{val}</div>
                      <div className="l-mockup-bar-fill" style={{ width: val.includes('%') ? val : '45%' }} />
                    </div>
                  ))}
                </div>
                <div className="l-mockup-card">
                  <div className="l-mockup-card-label">Daily Synthesis — AI Briefing</div>
                  <div className="l-mockup-line" style={{ width: '90%' }} />
                  <div className="l-mockup-line" style={{ width: '75%' }} />
                  <div className="l-mockup-line" style={{ width: '82%' }} />
                  <div className="l-mockup-line" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div className="l-trust">
        <div className="l-trust-label">Built on</div>
        <div className="l-trust-logos">
          {LOGOS.map(l => <span key={l} className="l-trust-logo">{l}</span>)}
        </div>
      </div>

      {/* STATS */}
      <div style={{ padding: '80px 40px' }}>
        <div className="l-stats">
          {STATS.map(s => (
            <div className="l-stat" key={s.label}>
              <div className="l-stat-value">{s.value}</div>
              <div className="l-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="l-features" id="features">
        <div className="l-section-eyebrow">Core Capabilities</div>
        <h2 className="l-section-title">
          Every tool your<br />team <em>actually needs.</em>
        </h2>
        <div className="l-features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="l-feature-card">
              <span className="l-feature-icon">{f.icon}</span>
              <div className="l-feature-title">{f.title}</div>
              <div className="l-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="l-how" id="how">
        <div className="l-how-inner">
          <div className="l-section-eyebrow">Process</div>
          <h2 className="l-section-title">Up and running<br />in <em>minutes.</em></h2>
          <div className="l-steps">
            {[
              ['01', 'Connect', 'Sign in with your Google account. Stremini requests only the permissions it needs — nothing more.'],
              ['02', 'Explore', 'Your Dashboard shows a live briefing of recent emails, Drive files, and pending tasks in one view.'],
              ['03', 'Act', 'Build forms, generate slides, summarize threads, and query documents — all from one place.'],
              ['04', 'Ship', 'Publish directly to Google Workspace. Forms, presentations, and docs — ready to share instantly.'],
            ].map(([num, title, desc]) => (
              <div key={num}>
                <div className="l-step-line" />
                <div className="l-step-num">{num}</div>
                <div className="l-step-title">{title}</div>
                <div className="l-step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="l-cta">
        <h2 className="l-cta-title">
          Start doing<br />less. <em>Achieve more.</em>
        </h2>
        <p className="l-cta-sub">
          Join teams using Stremini to reclaim hours lost to manual Workspace management. No setup fees, no complex onboarding.
        </p>
        <button className="btn-primary" style={{ fontSize: 14, padding: '16px 48px' }} onClick={onGetStarted}>
          Open Workspace Free
        </button>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          <div className="l-footer-top">
            <div>
              <div className="l-footer-brand">Stremini</div>
              <div className="l-footer-tagline">Intelligent workflows for Google Workspace. Built for teams that move fast.</div>
            </div>
            <div className="l-footer-cols">
              <div>
                <div className="l-footer-col-label">Product</div>
                <ul className="l-footer-col-links">
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how">How it works</a></li>
                  <li><a href="#" onClick={e => { e.preventDefault(); onGetStarted(); }}>Sign In</a></li>
                </ul>
              </div>
              <div>
                <div className="l-footer-col-label">Legal</div>
                <ul className="l-footer-col-links">
                  <li><a href="#" id="open-privacy" onClick={e => { e.preventDefault(); (window as any).__openPrivacy?.(); }}>Privacy Policy</a></li>
                  <li><a href="#" onClick={e => { e.preventDefault(); (window as any).__openTerms?.(); }}>Terms of Service</a></li>
                  <li><a href="mailto:support@stremini.ai">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="l-footer-bottom">
            <div className="l-footer-copy">© 2026 Stremini AI. All rights reserved.</div>
            <div className="l-footer-legal-links">
              <a href="#" onClick={e => { e.preventDefault(); (window as any).__openPrivacy?.(); }}>Privacy</a>
              <a href="#" onClick={e => { e.preventDefault(); (window as any).__openTerms?.(); }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PrivacyModal() {
  const [open, setOpen] = useState<null | 'privacy' | 'terms'>(null);

  useEffect(() => {
    (window as any).__openPrivacy = () => setOpen('privacy');
    (window as any).__openTerms = () => setOpen('terms');
    return () => {
      delete (window as any).__openPrivacy;
      delete (window as any).__openTerms;
    };
  }, []);

  if (!open) return null;

  return (
    <div className="l-modal-overlay" onClick={() => setOpen(null)}>
      <div className="l-modal" onClick={e => e.stopPropagation()}>
        {open === 'privacy' ? (
          <>
            <div className="l-modal-title">Privacy Policy</div>
            <div className="l-modal-date">LAST UPDATED — JANUARY 2026</div>
            <div className="l-modal-section-title">1. What We Collect</div>
            <p>Stremini collects only the data necessary to deliver its service. This includes your Google account identity (name, email, profile photo) obtained via Google OAuth, and OAuth access tokens required to read and write data on your behalf within Google Workspace services (Gmail, Drive, Forms, Slides).</p>
            <p>We do not collect, store, or transmit the content of your emails, documents, or Drive files to any third-party servers. All processing occurs either in your browser or through secured cloud functions.</p>
            <div className="l-modal-section-title">2. How We Use Your Data</div>
            <p>Your Google identity is used solely to authenticate you and associate your Workspace data (notes, databases) with your account. Access tokens are stored locally in your browser and are never transmitted to Stremini servers except when proxying API calls on your behalf.</p>
            <div className="l-modal-section-title">3. Data Sharing</div>
            <p>We do not sell, rent, or share your personal data with third parties. We do not use your data for advertising purposes. Stremini AI is not supported by advertising.</p>
            <div className="l-modal-section-title">4. Data Retention</div>
            <p>User-generated content (documents, database records) is stored in Firestore under your user ID and can be deleted by you at any time. OAuth tokens are stored in your browser's local storage and are cleared on sign-out.</p>
            <div className="l-modal-section-title">5. Your Rights</div>
            <p>You may revoke Stremini's access to your Google account at any time via your Google Account settings at myaccount.google.com. To request deletion of your Firestore data, contact us at support@stremini.ai.</p>
            <div className="l-modal-section-title">6. Security</div>
            <p>All data in transit is encrypted via HTTPS/TLS. We follow Google's OAuth 2.0 best practices and request only the minimum scopes required for each feature.</p>
            <div className="l-modal-section-title">7. Contact</div>
            <p>Questions about this policy? Email us at privacy@stremini.ai.</p>
          </>
        ) : (
          <>
            <div className="l-modal-title">Terms of Service</div>
            <div className="l-modal-date">LAST UPDATED — JANUARY 2026</div>
            <div className="l-modal-section-title">1. Acceptance</div>
            <p>By accessing or using Stremini Workspace ("Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>
            <div className="l-modal-section-title">2. Service Description</div>
            <p>Stremini is a productivity layer that connects to your Google Workspace account to provide AI-enhanced document, email, drive, form, and presentation management tools.</p>
            <div className="l-modal-section-title">3. Acceptable Use</div>
            <p>You agree not to use Stremini to send spam, violate any laws, infringe on intellectual property rights, or engage in any activity that disrupts the service for other users.</p>
            <div className="l-modal-section-title">4. Google Workspace Compliance</div>
            <p>Your use of Stremini is also subject to Google's Terms of Service and the terms of any Google APIs we use. We are an independent service and are not affiliated with Google LLC.</p>
            <div className="l-modal-section-title">5. Disclaimer of Warranties</div>
            <p>The Service is provided "as is" without warranty of any kind. We do not guarantee uninterrupted or error-free operation. AI-generated content should be reviewed before use in any professional or legal context.</p>
            <div className="l-modal-section-title">6. Limitation of Liability</div>
            <p>Stremini shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including any data loss or unauthorized access beyond our reasonable control.</p>
            <div className="l-modal-section-title">7. Changes</div>
            <p>We may update these Terms at any time. Continued use after changes constitutes acceptance. Last updated: January 2026.</p>
            <div className="l-modal-section-title">8. Contact</div>
            <p>Legal inquiries: legal@stremini.ai</p>
          </>
        )}
        <button className="l-modal-close" onClick={() => setOpen(null)}>Close</button>
      </div>
    </div>
  );
}
