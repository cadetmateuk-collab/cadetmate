"use client"
import { useState } from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  category: string;
  description: string;
  website: string;
  accentColor: string;
  textColor: string;
  logo: string; // initials fallback or image src
}

const partners: Partner[] = [
  {
    id: '1',
    name: 'Airbus',
    category: 'Aviation',
    description: 'A global leader in aeronautics, space and related services, shaping the future of flight.',
    website: 'https://airbus.com',
    accentColor: '#00AEEF',
    textColor: '#ffffff',
    logo: 'AB',
  },
  {
    id: '2',
    name: 'Rolls-Royce',
    category: 'Engineering',
    description: 'Pioneering the power that matters — delivering advanced propulsion systems across land, sea and air.',
    website: 'https://rolls-royce.com',
    accentColor: '#C8A96E',
    textColor: '#0a0a0a',
    logo: 'RR',
  },
  {
    id: '3',
    name: 'BAE Systems',
    category: 'Defence',
    description: 'A premier global defence, aerospace and security company with world-class capabilities.',
    website: 'https://baesystems.com',
    accentColor: '#E8003D',
    textColor: '#ffffff',
    logo: 'BAE',
  },
  {
    id: '4',
    name: 'Boeing',
    category: 'Aviation',
    description: 'Leading innovator in commercial jetliners, military aircraft, satellites and launch systems.',
    website: 'https://boeing.com',
    accentColor: '#1F6DAC',
    textColor: '#ffffff',
    logo: 'BA',
  },
  {
    id: '5',
    name: 'Honeywell',
    category: 'Technology',
    description: 'Inventing and manufacturing technologies that address critical challenges in aerospace and industry.',
    website: 'https://honeywell.com',
    accentColor: '#FF6600',
    textColor: '#ffffff',
    logo: 'HW',
  },
  {
    id: '6',
    name: 'Thales',
    category: 'Defence',
    description: 'Building a future we can all trust — advancing technology for aerospace, transport and security.',
    website: 'https://thalesgroup.com',
    accentColor: '#C8002D',
    textColor: '#ffffff',
    logo: 'TH',
  },
  {
    id: '7',
    name: 'Safran',
    category: 'Engineering',
    description: 'International high-tech group in aerospace, defence and security with world-class propulsion expertise.',
    website: 'https://safran-group.com',
    accentColor: '#004B9B',
    textColor: '#ffffff',
    logo: 'SF',
  },
  {
    id: '8',
    name: 'GE Aerospace',
    category: 'Aviation',
    description: 'Inventing the future of flight with smarter, cleaner, more efficient jet engines and services.',
    website: 'https://geaerospace.com',
    accentColor: '#00A3E0',
    textColor: '#ffffff',
    logo: 'GE',
  },
  {
    id: '9',
    name: 'Leonardo',
    category: 'Technology',
    description: 'A global high-tech company and key enabler in aerospace, defence and security.',
    website: 'https://leonardo.com',
    accentColor: '#6D2077',
    textColor: '#ffffff',
    logo: 'LO',
  },
];

const categories = ['All', ...Array.from(new Set(partners.map(p => p.category)))];

export default function PartnersPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = activeCategory === 'All'
    ? partners
    : partners.filter(p => p.category === activeCategory);

  return (
    <>
      <style>{`

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.95); opacity: 0.6; }
          70%  { transform: scale(1.05); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }

        .pp-anim-1 { animation: fadeUp 0.45s ease both 0.05s; }
        .pp-anim-2 { animation: fadeUp 0.45s ease both 0.14s; }
        .pp-anim-3 { animation: fadeUp 0.45s ease both 0.22s; }
        .pp-anim-4 { animation: fadeUp 0.45s ease both 0.30s; }

        /* ── Page shell ── */
        .pp-page {
          min-height: 100dvh;
          background-color: hsl(var(--background));
          font-family: inherit;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Shared backgrounds ── */
        .pp-dot-grid {
          pointer-events: none; position: fixed; inset: 0;
          background-image: radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          z-index: 0;
        }
        .pp-glow {
          pointer-events: none; position: fixed;
          top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 900px; border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
          z-index: 0;
        }
        .pp-noise {
          pointer-events: none; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 180px 180px;
          opacity: 0.025; mix-blend-mode: multiply; z-index: 0;
        }

        /* ── Content ── */
        .pp-content {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 2.5rem 6rem;
        }

        /* ── Header ── */
        .pp-header {
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .pp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: hsl(var(--primary));
          margin-bottom: 1rem;
          padding: 0.35rem 0.9rem;
          border: 1px solid hsl(var(--primary) / 0.25);
          border-radius: 999px;
          background: hsl(var(--primary) / 0.06);
        }
        .pp-eyebrow-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: hsl(var(--primary));
          animation: pulseRing 2s ease-out infinite;
        }
        .pp-title {
          font-family: inherit;
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.08;
          margin: 0 0 0.75rem;
          background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.6) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pp-subtitle {
          font-size: 1.0625rem;
          color: hsl(var(--muted-foreground));
          max-width: 520px;
          margin: 0 auto 2.75rem;
          line-height: 1.65;
          font-weight: 300;
        }

        /* ── Stat bar ── */
        .pp-stats {
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .pp-stat {
          text-align: center;
        }
        .pp-stat-num {
          font-family: inherit;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.55));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 0.2rem;
        }
        .pp-stat-label {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
        }
        .pp-stat-divider {
          width: 1px;
          background: hsl(var(--border));
          height: 2.5rem;
          align-self: center;
        }

        /* ── Filter tabs ── */
        .pp-filters {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2.75rem;
          flex-wrap: wrap;
        }
        .pp-filter-btn {
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
          letter-spacing: 0.01em;
        }
        .pp-filter-btn:hover:not(.active) {
          border-color: hsl(var(--primary) / 0.4);
          color: hsl(var(--foreground));
        }
        .pp-filter-btn.active {
          background: hsl(var(--foreground));
          color: hsl(var(--background));
          border-color: hsl(var(--foreground));
        }

        /* ── Partner grid ── */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        /* ── Partner card ── */
        .pp-card {
          position: relative;
          border-radius: 0.875rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          overflow: hidden;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease;
        }
        .pp-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px -8px var(--card-accent-shadow, rgba(0,0,0,0.15));
        }

        /* Colour flood layer */
        .pp-card-flood {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.35s ease;
          z-index: 0;
          border-radius: inherit;
        }
        .pp-card:hover .pp-card-flood {
          opacity: 1;
        }

        /* Top stripe accent */
        .pp-card-stripe {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          z-index: 2;
          transition: height 0.3s ease;
        }
        .pp-card:hover .pp-card-stripe {
          height: 4px;
        }

        .pp-card-inner {
          position: relative;
          z-index: 1;
          padding: 1.75rem 1.75rem 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
          transition: color 0.3s ease;
        }

        /* Logo badge */
        .pp-logo-wrap {
          margin-bottom: 1.25rem;
        }
        .pp-logo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 3rem; height: 3rem;
          border-radius: 0.625rem;
          font-family: inherit;
          font-weight: 800;
          font-size: 0.8125rem;
          letter-spacing: 0.03em;
          transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .pp-card:hover .pp-logo-badge {
          border-color: transparent;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .pp-card-category {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
          transition: color 0.3s ease;
          color: hsl(var(--muted-foreground));
        }
        .pp-card:hover .pp-card-category {
          color: inherit;
          opacity: 0.75;
        }

        .pp-card-name {
          font-family: inherit;
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 0.6rem;
          transition: color 0.3s ease;
          color: hsl(var(--foreground));
          line-height: 1.2;
        }
        .pp-card:hover .pp-card-name { color: inherit; }

        .pp-card-desc {
          font-size: 0.875rem;
          line-height: 1.65;
          color: hsl(var(--muted-foreground));
          flex: 1;
          transition: color 0.3s ease;
          font-weight: 300;
        }
        .pp-card:hover .pp-card-desc { color: inherit; opacity: 0.85; }

        .pp-card-footer {
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color 0.3s ease;
        }
        .pp-card:hover .pp-card-footer { border-color: rgba(255,255,255,0.2); }

        .pp-visit-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          transition: color 0.2s, gap 0.2s;
        }
        .pp-card:hover .pp-visit-link { color: inherit; gap: 0.55rem; }

        .pp-link-arrow {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s, transform 0.2s;
        }
        .pp-card:hover .pp-link-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── CTA banner ── */
        .pp-cta {
          margin-top: 4rem;
          border-radius: 0.875rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--foreground) / 0.03);
          padding: 2.5rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .pp-cta-text h2 {
          font-family: inherit;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0 0 0.35rem;
          color: hsl(var(--foreground));
        }
        .pp-cta-text p {
          font-size: 0.9375rem;
          color: hsl(var(--muted-foreground));
          margin: 0;
          font-weight: 300;
        }
        .pp-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.5rem;
          border-radius: 0.6rem;
          background: hsl(var(--foreground));
          color: hsl(var(--background));
          font-size: 0.875rem;
          font-weight: 600;
          font-family: inherit;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          white-space: nowrap;
        }
        .pp-cta-btn:hover { opacity: 0.85; transform: translateY(-1px); }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .pp-grid { grid-template-columns: repeat(2, 1fr); }
          .pp-cta { padding: 2rem 1.75rem; }
        }
        @media (max-width: 580px) {
          .pp-content { padding: 2rem 1.25rem 4rem; }
          .pp-grid { grid-template-columns: 1fr; }
          .pp-title { font-size: 2rem; }
          .pp-stats { gap: 1.25rem; }
          .pp-cta { flex-direction: column; align-items: flex-start; }
          .pp-stat-divider { display: none; }
        }
      `}</style>

      <div className="pp-page">
        <div className="pp-dot-grid" aria-hidden="true" />
        <div className="pp-glow" aria-hidden="true" />
        <div className="pp-noise" aria-hidden="true" />

        <div className="pp-content">

          {/* Header */}
          <div className="pp-header pp-anim-1">
            <div className="pp-eyebrow">
              <span className="pp-eyebrow-dot" />
              Trusted Network
            </div>
            <h1 className="pp-title">Our Partners</h1>
            <p className="pp-subtitle">
              We work alongside the world's leading aerospace and defence organisations
              to open doors and create pathways for the next generation.
            </p>
          </div>

          {/* Stats */}
          <div className="pp-stats pp-anim-2">
            <div className="pp-stat">
              <div className="pp-stat-num">9+</div>
              <div className="pp-stat-label">Partners</div>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <div className="pp-stat-num">3</div>
              <div className="pp-stat-label">Industries</div>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <div className="pp-stat-num">40+</div>
              <div className="pp-stat-label">Countries</div>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <div className="pp-stat-num">500k+</div>
              <div className="pp-stat-label">Employees</div>
            </div>
          </div>

          {/* Filters */}
          <div className="pp-filters pp-anim-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pp-filter-btn${activeCategory === cat ? ' active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="pp-grid pp-anim-4">
            {filtered.map(partner => (
              <a
                key={partner.id}
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="pp-card"
                style={{
                  '--card-accent-shadow': `${partner.accentColor}33`,
                } as React.CSSProperties}
                onMouseEnter={() => setHoveredId(partner.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Colour flood */}
                <div
                  className="pp-card-flood"
                  style={{ background: partner.accentColor }}
                />

                {/* Top stripe */}
                <div
                  className="pp-card-stripe"
                  style={{ background: partner.accentColor }}
                />

                <div
                  className="pp-card-inner"
                  style={hoveredId === partner.id ? { color: partner.textColor } : {}}
                >
                  {/* Logo */}
                  <div className="pp-logo-wrap">
                    <div
                      className="pp-logo-badge"
                      style={hoveredId === partner.id ? {
                        background: partner.textColor === '#ffffff' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                        color: partner.textColor,
                      } : {}}
                    >
                      {partner.logo}
                    </div>
                  </div>

                  <div className="pp-card-category">{partner.category}</div>
                  <h2 className="pp-card-name">{partner.name}</h2>
                  <p className="pp-card-desc">{partner.description}</p>

                  <div className="pp-card-footer">
                    <span className="pp-visit-link">
                      <ExternalLink size={12} />
                      Visit website
                      <ArrowRight size={12} className="pp-link-arrow" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="pp-cta pp-anim-4">
            <div className="pp-cta-text">
              <h2>Interested in partnering with us?</h2>
              <p>We're always looking to grow our network with forward-thinking organisations.</p>
            </div>
            <button className="pp-cta-btn">
              Get in touch <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
