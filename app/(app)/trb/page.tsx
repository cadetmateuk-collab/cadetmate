"use client";
import { useState, useEffect } from "react";
import { Anchor } from "lucide-react";
import SearchBar from "./components/SearchBar";
import TaskList from "./components/TaskList";
import { createClient } from "@/lib/supabase/client";
import type { TRBTask } from "./data/trbTasks";

const supabase = createClient();

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState<TRBTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      const { data, error } = await supabase
        .from("trb_tasks")
        .select("*")
        .order("code");

      if (error) {
        setError(error.message);
      } else {
        setTasks(data as TRBTask[]);
      }
      setLoading(false);
    }

    loadTasks();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.95); opacity: 0.6; }
          70%  { transform: scale(1.05); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }

        .trb-anim-1 { animation: fadeUp 0.45s ease both 0.05s; }
        .trb-anim-2 { animation: fadeUp 0.45s ease both 0.14s; }
        .trb-anim-3 { animation: fadeUp 0.45s ease both 0.22s; }

        .trb-page {
          min-height: 100dvh;
          background-color: hsl(var(--background));
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .trb-dot-grid {
          pointer-events: none; position: fixed; inset: 0;
          background-image: radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
          z-index: 0;
        }
        .trb-glow {
          pointer-events: none; position: fixed;
          top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 900px; border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
          z-index: 0;
        }
        .trb-noise {
          pointer-events: none; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 180px 180px;
          opacity: 0.025; mix-blend-mode: multiply; z-index: 0;
        }

        .trb-content {
          position: relative; z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 2.5rem 6rem;
        }

        .trb-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .trb-eyebrow {
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
        .trb-eyebrow-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: hsl(var(--primary));
          animation: pulseRing 2s ease-out infinite;
        }
        .trb-title {
          font-family: 'Syne', sans-serif;
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
        .trb-subtitle {
          font-size: 1.0625rem;
          color: hsl(var(--muted-foreground));
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.65;
          font-weight: 300;
        }

        .trb-search-wrap {
          max-width: 560px;
          margin: 0 auto 2rem;
        }

        /* Skeleton loader */
        .trb-skeleton {
          border-radius: 12px;
          height: 68px;
          background: linear-gradient(
            90deg,
            hsl(var(--muted)) 25%,
            hsl(var(--muted) / 0.5) 50%,
            hsl(var(--muted)) 75%
          );
          background-size: 600px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @media (max-width: 580px) {
          .trb-content { padding: 2rem 1.25rem 4rem; }
          .trb-title { font-size: 2rem; }
        }
      `}</style>

      <div className="trb-page">
        <div className="trb-dot-grid" aria-hidden="true" />
        <div className="trb-glow" aria-hidden="true" />
        <div className="trb-noise" aria-hidden="true" />

        <div className="trb-content">

          {/* Header */}
          <div className="trb-header trb-anim-1">
            <div className="trb-eyebrow">
              <span className="trb-eyebrow-dot" />
              <Anchor size={9} />
              Deck TRB · HOW TO
            </div>
            <h1 className="trb-title">Training Tasks</h1>
            <p className="trb-subtitle">
              All training tasks from the Merchant Navy Deck Training Record Book.
              Click any task to view step-by-step instructions.
            </p>
          </div>

          {/* Search */}
          <div className="trb-search-wrap trb-anim-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* Task List / states */}
          <div className="trb-anim-3">
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="trb-skeleton" style={{ opacity: 1 - i * 0.12 }} />
                ))}
              </div>
            )}

            {error && !loading && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-semibold mb-1 text-red-500">Failed to load tasks</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <TaskList tasks={tasks} searchTerm={searchTerm} />
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Index;