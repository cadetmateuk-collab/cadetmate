"use client";
import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Anchor, BookOpen, FileText, Clock, GraduationCap, Sparkles, ShieldCheck } from 'lucide-react';

// ── Stripe config ─────────────────────────────────────────────────────────────
const stripeTables = {
  all: {
    pricingTableId: 'prctbl_1SkSReRwygITQzeHqWUlfbRI',
    publishableKey: 'pk_test_51S8R2vRwygITQzeHn6B8EW7O3AmdwJHQBknayUD9sO2o7byW50Cp3uuxFL4VW9HDykuCjtdV0D2xoWj3jk8wZFAo0025ArN1iY',
  },
  modules:  { pricingTableId: 'prctbl_MODULES',  publishableKey: 'pk_test_YOUR_KEY_HERE' },
  trb:      { pricingTableId: 'prctbl_TRB',      publishableKey: 'pk_test_YOUR_KEY_HERE' },
  seatime:  { pricingTableId: 'prctbl_SEATIME',  publishableKey: 'pk_test_YOUR_KEY_HERE' },
  exams:    { pricingTableId: 'prctbl_EXAMS',    publishableKey: 'pk_test_YOUR_KEY_HERE' },
  extras:   { pricingTableId: 'prctbl_EXTRAS',   publishableKey: 'pk_test_YOUR_KEY_HERE' },
};

const categories: {
  id: keyof typeof stripeTables;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  { id: 'all',     label: 'All Plans',  icon: <Sparkles size={13} />,      description: 'Every product we offer' },
  { id: 'modules', label: 'Modules',    icon: <BookOpen size={13} />,      description: 'Study modules & guides' },
  { id: 'trb',     label: 'TRB',        icon: <FileText size={13} />,      description: 'Training record book' },
  { id: 'seatime', label: 'Sea Time',   icon: <Anchor size={13} />,        description: 'Sea time tracking tools' },
  { id: 'exams',   label: 'Exams',      icon: <GraduationCap size={13} />, description: 'Exam prep & CBT questions' },
  { id: 'extras',  label: 'Extras',     icon: <Clock size={13} />,         description: 'Add-ons & extras' },
];

// ── Stripe table component ────────────────────────────────────────────────────
function StripePricingTable({ category }: { category: keyof typeof stripeTables }) {
  React.useEffect(() => {
    if (document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="w-full">
      {React.createElement('stripe-pricing-table', {
        'pricing-table-id': stripeTables[category].pricingTableId,
        'publishable-key':  stripeTables[category].publishableKey,
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StorePage() {
  const [activeTab, setActiveTab] = useState<keyof typeof stripeTables>('all');
  const activeCat = categories.find(c => c.id === activeTab)!;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .store-anim-1 { animation: fadeUp 0.4s ease both 0.05s; }
        .store-anim-2 { animation: fadeUp 0.4s ease both 0.13s; }
        .store-anim-3 { animation: fadeUp 0.4s ease both 0.21s; }

        .store-page {
          min-height: 100dvh;
          background: hsl(var(--background));
          position: relative;
          overflow-x: hidden;
        }

        .store-glow {
          pointer-events: none;
          position: fixed; top: -200px; left: 50%; transform: translateX(-50%); z-index: 0;
          width: 900px; height: 900px; border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
        }
        .store-noise {
          pointer-events: none;
          position: fixed; inset: 0; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 180px 180px;
          opacity: 0.025; mix-blend-mode: multiply;
        }

        .store-content {
          position: relative; z-index: 1;
          width: 100%;
          padding: 3rem 0 7rem;
        }

        /* Header */
        .store-header { text-align: center; margin-bottom: 3.5rem; }
        .store-eyebrow {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: hsl(var(--primary));
          margin-bottom: 0.875rem;
        }
        .store-eyebrow-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: hsl(var(--primary)); opacity: 0.7;
        }
        .store-title {
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
          margin: 0 0 0.875rem;
          background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.7) 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .store-subtitle {
          font-size: 1rem; color: hsl(var(--muted-foreground));
          max-width: 480px; margin: 0 auto; line-height: 1.6;
        }

        /* Category nav */
        .store-nav {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 2.5rem;
        }
        .store-nav-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1.125rem;
          border-radius: 999px;
          font-size: 0.8125rem; font-weight: 600;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .store-nav-btn:hover {
          border-color: hsl(var(--primary) / 0.4);
          color: hsl(var(--foreground));
          background: hsl(var(--primary) / 0.05);
        }
        .store-nav-btn.active {
          background: hsl(var(--primary));
          color: white;
          border-color: hsl(var(--primary));
        }

        /* Mobile select */
        .store-mobile-select {
          display: none;
          width: 100%; padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem; font-weight: 600;
          margin-bottom: 1.5rem;
          appearance: none;
          cursor: pointer;
        }

        /* Panel */
        .store-panel {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 1.25rem;
          overflow: hidden;
        }
        .store-panel-head {
          padding: 1.75rem 2rem 1.5rem;
          border-bottom: 1px solid hsl(var(--border));
          display: flex; align-items: center; gap: 1rem;
          background: hsl(var(--muted) / 0.4);
        }
        .store-panel-icon {
          width: 2.5rem; height: 2.5rem; border-radius: 0.75rem;
          background: hsl(var(--primary) / 0.1);
          display: flex; align-items: center; justify-content: center;
          color: hsl(var(--primary)); flex-shrink: 0;
        }
        .store-panel-title {
          font-size: 1rem; font-weight: 700;
          color: hsl(var(--foreground)); margin: 0;
        }
        .store-panel-desc {
          font-size: 0.8125rem; color: hsl(var(--muted-foreground));
          margin: 0.125rem 0 0;
        }
        .store-panel-body { padding: 2rem; }

        /* Trust strip */
        .store-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 1.5rem; flex-wrap: wrap;
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid hsl(var(--border));
        }
        .store-trust-item {
          display: inline-flex; align-items: center; gap: 0.375rem;
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em;
          text-transform: uppercase; color: hsl(var(--muted-foreground));
        }
        .store-trust-divider { color: hsl(var(--border)); font-size: 1.25rem; line-height: 1; }

        @media (max-width: 640px) {
          .store-content { padding: 2rem 1.25rem 5rem; }
          .store-title { font-size: 2rem; }
          .store-nav { display: none; }
          .store-mobile-select { display: block; }
          .store-panel-head { padding: 1.25rem; }
          .store-panel-body { padding: 1.25rem; }
          .store-trust { gap: 1rem; }
          .store-trust-divider { display: none; }
        }
      `}</style>

      <div className="store-page">
        <div className="store-glow"     aria-hidden="true" />
        <div className="store-noise"    aria-hidden="true" />

        <div className="store-content">

          {/* Header */}
          <header className="store-header store-anim-1">
            <h1 className="store-title">Training Store</h1>
            <p className="store-subtitle">
              Everything you need to complete your cadetship — modules, exam prep, TRB tools and more.
            </p>
          </header>

          {/* Desktop nav */}
          <nav className="store-nav store-anim-2" aria-label="Product categories">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`store-nav-btn${activeTab === cat.id ? ' active' : ''}`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Mobile select */}
          <select
            className="store-mobile-select"
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as keyof typeof stripeTables)}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          {/* Panel */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as keyof typeof stripeTables)}>
            <div className="store-panel store-anim-3">
              {categories.map(cat => (
                <TabsContent key={cat.id} value={cat.id} className="mt-0 focus-visible:outline-none">
                  <div className="store-panel-head">
                    <div className="store-panel-icon">{cat.icon}</div>
                    <div>
                      <p className="store-panel-title">{cat.label}</p>
                      <p className="store-panel-desc">{cat.description}</p>
                    </div>
                  </div>
                  <div className="store-panel-body">
                    <StripePricingTable category={cat.id} />
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>

          {/* Trust strip */}
          <div className="store-trust store-anim-3">
            <span className="store-trust-item">
              <ShieldCheck size={13} style={{ color: 'hsl(var(--primary))' }} />
              Secure payments via Stripe
            </span>
            <span className="store-trust-divider">·</span>
            <span className="store-trust-item">
              <Anchor size={13} style={{ color: 'hsl(var(--primary))' }} />
              Built for UK deck cadets
            </span>
            <span className="store-trust-divider">·</span>
            <span className="store-trust-item">
              <GraduationCap size={13} style={{ color: 'hsl(var(--primary))' }} />
              MCA approved content
            </span>
          </div>

        </div>
      </div>
    </>
  );
}