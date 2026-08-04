"use client";
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Anchor, GraduationCap, ShieldCheck, Sparkles, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getStoreTables, type StoreTableId } from '@/lib/stripe/store-tables';

const categories = getStoreTables().map((t) => ({
  ...t,
  icon: t.id === 'premium' ? <Crown size={13} /> : <Sparkles size={13} />,
}));

function StripePricingTable({
  category,
  clientReferenceId,
}: {
  category: StoreTableId;
  clientReferenceId?: string | null;
}) {
  const table = categories.find((c) => c.id === category)!;

  useEffect(() => {
    if (document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const attrs: Record<string, string> = {
    'pricing-table-id': table.pricingTableId,
    'publishable-key': table.publishableKey,
  };
  if (clientReferenceId) attrs['client-reference-id'] = clientReferenceId;

  return <div className="w-full">{React.createElement('stripe-pricing-table', attrs)}</div>;
}

export default function StorePage() {
  const [activeTab, setActiveTab] = useState<StoreTableId>('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .store-anim-1 { animation: fadeUp 0.4s ease both 0.05s; }
        .store-anim-2 { animation: fadeUp 0.4s ease both 0.13s; }
        .store-anim-3 { animation: fadeUp 0.4s ease both 0.21s; }
        .store-page { min-height: 100dvh; background: hsl(var(--background)); position: relative; overflow-x: hidden; }
        .store-glow {
          pointer-events: none; position: fixed; top: -200px; left: 50%; transform: translateX(-50%); z-index: 0;
          width: 900px; height: 900px; border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
        }
        .store-content { position: relative; z-index: 1; width: 100%; padding: 3rem 0 7rem; }
        .store-header { text-align: center; margin-bottom: 3.5rem; }
        .store-title {
          font-size: clamp(2.25rem, 5vw, 3.75rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
          margin: 0 0 0.875rem;
          background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.7) 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .store-subtitle { font-size: 1rem; color: hsl(var(--muted-foreground)); max-width: 480px; margin: 0 auto; line-height: 1.6; }
        .store-nav { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-bottom: 2.5rem; }
        .store-nav-btn {
          display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.125rem; border-radius: 999px;
          font-size: 0.8125rem; font-weight: 600; border: 1px solid hsl(var(--border));
          background: hsl(var(--background)); color: hsl(var(--muted-foreground)); cursor: pointer; transition: all 0.15s;
        }
        .store-nav-btn:hover { border-color: hsl(var(--primary) / 0.4); color: hsl(var(--foreground)); background: hsl(var(--primary) / 0.05); }
        .store-nav-btn.active { background: hsl(var(--primary)); color: white; border-color: hsl(var(--primary)); }
        .store-mobile-select {
          display: none; width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid hsl(var(--border));
          background: hsl(var(--background)); color: hsl(var(--foreground)); font-size: 0.875rem; font-weight: 600;
          margin-bottom: 1.5rem; appearance: none; cursor: pointer;
        }
        .store-panel { background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: 1.25rem; overflow: hidden; }
        .store-panel-head {
          padding: 1.75rem 2rem 1.5rem; border-bottom: 1px solid hsl(var(--border));
          display: flex; align-items: center; gap: 1rem; background: hsl(var(--muted) / 0.4);
        }
        .store-panel-icon {
          width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; background: hsl(var(--primary) / 0.1);
          display: flex; align-items: center; justify-content: center; color: hsl(var(--primary)); flex-shrink: 0;
        }
        .store-panel-title { font-size: 1rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0; }
        .store-panel-desc { font-size: 0.8125rem; color: hsl(var(--muted-foreground)); margin: 0.125rem 0 0; }
        .store-panel-body { padding: 2rem; }
        .store-trust {
          display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap;
          margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid hsl(var(--border));
        }
        .store-trust-item {
          display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase; color: hsl(var(--muted-foreground));
        }
        .store-trust-divider { color: hsl(var(--border)); font-size: 1.25rem; line-height: 1; }
        .store-hint { text-align: center; font-size: 0.8125rem; color: hsl(var(--muted-foreground)); margin-bottom: 1rem; }
        @media (max-width: 640px) {
          .store-content { padding: 2rem 1.25rem 5rem; }
          .store-title { font-size: 2rem; }
          .store-nav { display: none; }
          .store-mobile-select { display: block; }
          .store-panel-head { padding: 1.25rem; }
          .store-panel-body { padding: 1.25rem; }
          .store-trust-divider { display: none; }
        }
      `}</style>

      <div className="store-page">
        <div className="store-glow" aria-hidden="true" />
        <div className="store-content">
          <header className="store-header store-anim-1">
            <h1 className="store-title">Training Store</h1>
            <p className="store-subtitle">
              Unlock Premium for full modules, simulators and TRB tools — or pick individual products.
            </p>
          </header>

          <nav className="store-nav store-anim-2" aria-label="Product categories">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`store-nav-btn${activeTab === cat.id ? ' active' : ''}`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </nav>

          <select
            className="store-mobile-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as StoreTableId)}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {!userId && (
            <p className="store-hint store-anim-2">
              Sign in before checkout so Premium unlocks on your account automatically.
            </p>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StoreTableId)}>
            <div className="store-panel store-anim-3">
              {categories.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-0 focus-visible:outline-none">
                  <div className="store-panel-head">
                    <div className="store-panel-icon">{cat.icon}</div>
                    <div>
                      <p className="store-panel-title">{cat.label}</p>
                      <p className="store-panel-desc">{cat.description}</p>
                    </div>
                  </div>
                  <div className="store-panel-body">
                    <StripePricingTable category={cat.id} clientReferenceId={userId} />
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>

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
              Instant Premium unlock
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
