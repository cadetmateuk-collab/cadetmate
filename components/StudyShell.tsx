'use client';
import { NoCopy } from '@/components/NoCopy';

/** Shared chrome styles for the user-facing flashcard pages.
 *  Mirrors the bp-* and trb-* aesthetic from the uploaded files. */
export function StudyShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{css}</style>
      <div className="bp-page">
        <div className="bp-dot-grid" aria-hidden="true" />
        <div className="bp-glow"     aria-hidden="true" />
        <div className="bp-noise"    aria-hidden="true" />
        <NoCopy className="bp-content">{children}</NoCopy>
      </div>
    </>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }

@keyframes fadeUp { from {opacity:0; transform:translateY(16px);} to {opacity:1; transform:translateY(0);} }
@keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
@keyframes fc-in  { from {opacity:0; transform:translateY(12px);} to {opacity:1; transform:translateY(0);} }
@keyframes pulseRing { 0%{transform:scale(.95); opacity:.6;} 70%{transform:scale(1.05); opacity:0;} 100%{transform:scale(.95); opacity:0;} }
@keyframes shimmer { 0%{background-position:-600px 0;} 100%{background-position:600px 0;} }
@keyframes pop { 0%{transform:scale(.4); opacity:0;} 60%{transform:scale(1.1); opacity:1;} 100%{transform:scale(1);} }

.bp-anim-1 { animation: fadeUp .4s ease both .05s; }
.bp-anim-2 { animation: fadeUp .4s ease both .12s; }
.bp-anim-3 { animation: fadeUp .4s ease both .20s; }
.bp-anim-4 { animation: fadeUp .4s ease both .28s; }

.bp-page { min-height:100dvh; background:hsl(var(--background)); position:relative; overflow-x:hidden; font-family:'DM Sans',sans-serif; color:hsl(var(--foreground)); }
.bp-dot-grid { pointer-events:none; position:fixed; inset:0; z-index:0; background-image:radial-gradient(circle, hsl(var(--foreground)/0.07) 1px, transparent 1px); background-size:28px 28px; mask-image:radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%); -webkit-mask-image:radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%); }
.bp-glow { pointer-events:none; position:fixed; top:-200px; left:50%; transform:translateX(-50%); z-index:0; width:900px; height:900px; border-radius:50%; background:radial-gradient(circle, hsl(var(--primary)/0.055) 0%, transparent 66%); }
.bp-noise { pointer-events:none; position:fixed; inset:0; z-index:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E"); background-repeat:repeat; background-size:180px 180px; opacity:.025; mix-blend-mode:multiply; }
.bp-content { position:relative; z-index:1; max-width:680px; margin:0 auto; padding:1.25rem 2.5rem 6rem; }
.bp-content.wide { max-width:1100px; }

/* Back link */
.bp-back { display:inline-flex; align-items:center; gap:.25rem; font-size:.6875rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:hsl(var(--muted-foreground)/.6); text-decoration:none; transition:color .15s; margin-bottom:1.75rem; cursor:pointer; background:none; border:none; padding:0; font-family:inherit; }
.bp-back:hover { color:hsl(var(--primary)); }

/* Header */
.bp-eyebrow { display:inline-flex; align-items:center; gap:.5rem; font-size:.75rem; font-weight:600; letter-spacing:.13em; text-transform:uppercase; color:hsl(var(--primary)); padding:.35rem .9rem; border:1px solid hsl(var(--primary)/.25); border-radius:999px; background:hsl(var(--primary)/.06); margin-bottom:1rem; }
.bp-eyebrow-dot { width:5px; height:5px; border-radius:50%; background:hsl(var(--primary)); animation:pulseRing 2s ease-out infinite; }
.bp-cat-badge { display:inline-block; font-size:.6875rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:hsl(var(--primary)); background:hsl(var(--primary)/.1); padding:.2rem .625rem; border-radius:999px; margin-bottom:.75rem; }
.bp-title { font-family:'Syne',sans-serif; font-size:clamp(2rem,5vw,3rem); font-weight:800; letter-spacing:-.03em; line-height:1.1; margin:0 0 1.25rem; background:linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)/.7) 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.bp-subtitle { font-size:1.0625rem; color:hsl(var(--muted-foreground)); max-width:520px; line-height:1.65; font-weight:300; }
.bp-divider { width:100%; border:none; border-top:1px solid hsl(var(--border)); margin-bottom:2rem; }

/* Progress + stats */
.fc-prog { margin-bottom:1.5rem; }
.fc-prog-meta { display:flex; justify-content:space-between; font-size:.72rem; color:hsl(var(--muted-foreground)); font-weight:500; margin-bottom:6px; }
.fc-prog-track { height:4px; background:hsl(var(--border)); border-radius:99px; overflow:hidden; }
.fc-prog-fill { height:100%; background:linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/.6)); border-radius:99px; transition:width .5s cubic-bezier(.4,0,.2,1); }
.fc-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:1.5rem; }
.fc-stat { background:hsl(var(--card, var(--background))/.85); border:1px solid hsl(var(--border)); border-radius:12px; padding:10px 8px; text-align:center; backdrop-filter:blur(8px); }
.fc-sv { font-family:'Lora',serif; font-size:20px; font-weight:700; line-height:1; color:hsl(var(--foreground)); }
.fc-sv.g { color:#16a34a; } .fc-sv.r { color:hsl(var(--destructive)); } .fc-sv.b { color:hsl(var(--primary)); }
.fc-sl { font-size:10px; color:hsl(var(--muted-foreground)); margin-top:3px; text-transform:uppercase; letter-spacing:.05em; font-weight:600; }

/* 3-D flip card */
.fc-scene { width:100%; perspective:1400px; perspective-origin:50% 38%; margin-bottom:1.25rem; }
.fc-scene.clickable { cursor:pointer; }
.fc-card {
  position:relative; width:100%; transform-style:preserve-3d;
  transition:transform .62s cubic-bezier(.4,0,.2,1); border-radius:20px; will-change:transform;
  display:grid;
}
.fc-card.is-flipped { transform:rotateY(180deg); }
.fc-card.is-entering { animation:fc-in .36s cubic-bezier(.4,0,.2,1) both; }
.fc-face {
  grid-area:1 / 1;
  position:relative;
  border-radius:20px;
  backface-visibility:hidden; -webkit-backface-visibility:hidden;
  display:flex; flex-direction:column; align-items:stretch;
  padding:16px 24px 14px; text-align:center;
  background:#ffffff;
  border:1px solid hsl(var(--border));
  box-shadow:0 4px 8px hsl(var(--foreground)/.04), 0 12px 32px hsl(var(--foreground)/.08);
  min-height:260px;
}
.fc-front::after {
  content:''; position:absolute; inset:0; border-radius:20px; pointer-events:none;
  background-image:repeating-linear-gradient(0deg, transparent, transparent 31px, hsl(var(--primary)/.04) 31px, hsl(var(--primary)/.04) 32px);
}
.fc-back {
  transform:rotateY(180deg);
  background:#ffffff;
}
.fc-back::after {
  content:''; position:absolute; inset:0; border-radius:20px; pointer-events:none;
  background:radial-gradient(circle at 25% 35%, hsl(var(--primary)/.06) 0%, transparent 55%);
}
.fc-cat {
  align-self:flex-start;
  margin-bottom:10px;
  font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  padding:3px 10px; border-radius:99px;
  color:hsl(var(--primary)); background:hsl(var(--primary)/.1);
  position:relative; z-index:1;
}
.fc-body {
  flex:1; width:100%; min-height:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  overflow-y:auto; padding:4px 0 8px;
  position:relative; z-index:1;
}
.fc-footer {
  flex-shrink:0; width:100%; padding-top:10px;
  position:relative; z-index:1;
}
.fc-img { max-height:110px; max-width:100%; object-fit:contain; margin-bottom:12px; border-radius:8px; }
.fc-corner { font-size:10.5px; font-style:italic; color:hsl(var(--muted-foreground)/.65); text-align:right; }
.fc-q { font-family:'Lora',serif; font-size:19px; font-weight:600; line-height:1.5; color:hsl(var(--foreground)); }
.fc-a { font-family:'Lora',serif; font-size:15px; font-weight:400; line-height:1.65; color:hsl(var(--foreground)); }
.fc-text { width:100%; text-align:left; }
.fc-text.fc-q, .fc-text.fc-a { text-align:center; }
.fc-text.fc-a { text-align:left; }
.fc-text p { margin:0 0 .45em; }
.fc-text p:last-child { margin-bottom:0; }
.fc-list {
  margin:0; padding-left:1.2em; text-align:left; width:100%;
  list-style:disc;
}
.fc-list li { margin-bottom:.35em; line-height:1.55; color:inherit; }
.fc-list li:last-child { margin-bottom:0; }
.fc-hint {
  margin-top:10px; font-size:11.5px; color:hsl(var(--muted-foreground));
  font-style:italic; width:100%;
}
.fc-cue { font-size:11px; color:hsl(var(--muted-foreground)/.6); text-align:center; white-space:nowrap; pointer-events:none; }

/* Buttons */
.fc-actions { display:flex; gap:10px; margin-top:12px; }
.fc-btn { flex:1; padding:12px 14px; border-radius:12px; border:none; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; cursor:pointer; transition:all .15s ease; display:flex; align-items:center; justify-content:center; gap:7px; }
.fc-btn-flip { background:hsl(var(--foreground)); color:hsl(var(--background)); flex:2; box-shadow:0 2px 8px hsl(var(--foreground)/.18); }
.fc-btn-flip:hover { transform:translateY(-1px); box-shadow:0 4px 16px hsl(var(--foreground)/.22); }
.fc-btn-skip { background:hsl(var(--card, var(--background))/.85); color:hsl(var(--muted-foreground)); border:1px solid hsl(var(--border)); }
.fc-btn-skip:hover { background:hsl(var(--background)); color:hsl(var(--foreground)); }

/* Ratings (SM-2) */
.fc-rlbl { font-size:11.5px; font-weight:700; color:hsl(var(--muted-foreground)); text-align:center; text-transform:uppercase; letter-spacing:.07em; margin:14px 0 11px; }
.fc-ratings { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.fc-rbtn { padding:13px 6px 11px; border-radius:14px; border:1.5px solid transparent; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:transform .14s ease, box-shadow .14s ease, background .14s ease, color .14s ease; display:flex; flex-direction:column; align-items:center; gap:5px; line-height:1; }
.fc-rbtn .em { font-size:20px; }
.fc-rbtn:hover { transform:translateY(-3px); }
.fc-rbtn.q0 { background:hsl(var(--destructive)/.06); color:hsl(var(--destructive)); border-color:hsl(var(--destructive)/.18); }
.fc-rbtn.q2 { background:#fff7ed; color:#c2410c; border-color:#fdba7444; }
.fc-rbtn.q4 { background:#f0fdf4; color:#16a34a; border-color:#bbf7d066; }
.fc-rbtn.q5 { background:hsl(var(--primary)/.07); color:hsl(var(--primary)); border-color:hsl(var(--primary)/.2); }

/* Library cards grid */
.fc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:18px; }
.fc-card-tile { position:relative; padding:18px; border-radius:16px; background:hsl(var(--card, var(--background))/.9); border:1px solid hsl(var(--border)); transition:all .18s ease; cursor:pointer; backdrop-filter:blur(8px); display:flex; flex-direction:column; gap:12px; min-height:170px; text-decoration:none; color:inherit; }
.fc-card-tile:hover { transform:translateY(-3px); border-color:hsl(var(--primary)/.4); box-shadow:0 8px 24px hsl(var(--foreground)/.06); }
.fc-card-row { display:flex; gap:12px; align-items:flex-start; }
.fc-card-title { font-family:'Syne',sans-serif; font-weight:700; font-size:1.05rem; line-height:1.25; margin:0; }
.fc-card-desc { font-size:.825rem; color:hsl(var(--muted-foreground)); line-height:1.5; flex:1; }
.fc-card-meta { display:flex; gap:6px; flex-wrap:wrap; font-size:.7rem; color:hsl(var(--muted-foreground)); text-transform:uppercase; letter-spacing:.06em; font-weight:600; }
.fc-pill { padding:2px 9px; border-radius:99px; background:hsl(var(--muted)); }
.fc-pill.prem { background:linear-gradient(135deg,#fef3c7,#fcd34d); color:#92400e; }

/* Mode picker */
.fc-modes { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:10px; margin:1.5rem 0; }
.fc-mode { padding:14px 12px; border-radius:14px; background:hsl(var(--card, var(--background))/.85); border:1px solid hsl(var(--border)); cursor:pointer; text-align:left; transition:all .15s ease; font-family:'DM Sans',sans-serif; color:inherit; }
.fc-mode:hover { border-color:hsl(var(--primary)/.5); transform:translateY(-2px); }
.fc-mode-em { font-size:22px; margin-bottom:6px; display:block; }
.fc-mode-title { font-weight:700; font-size:.92rem; margin-bottom:3px; }
.fc-mode-sub { font-size:.72rem; color:hsl(var(--muted-foreground)); line-height:1.45; }

/* Search */
.fc-search { width:100%; padding:.85rem 1rem .85rem 2.6rem; border-radius:14px; background:hsl(var(--card, var(--background))/.9); border:1px solid hsl(var(--border)); font-family:'DM Sans',sans-serif; font-size:.92rem; color:hsl(var(--foreground)); outline:none; transition:border-color .15s; backdrop-filter:blur(8px); }
.fc-search:focus { border-color:hsl(var(--primary)); }
.fc-filterbar { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 22px; }
.fc-chip { padding:6px 13px; border-radius:99px; font-size:.78rem; font-weight:600; border:1px solid hsl(var(--border)); background:transparent; color:hsl(var(--muted-foreground)); cursor:pointer; transition:all .15s; font-family:inherit; }
.fc-chip.on { background:hsl(var(--primary)); color:hsl(var(--primary-foreground, #fff)); border-color:hsl(var(--primary)); }

/* Skeleton */
.fc-skel { border-radius:16px; height:170px; background:linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/.5) 50%, hsl(var(--muted)) 75%); background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite; }

/* Celebration */
.fc-celebrate { display:flex; flex-direction:column; align-items:center; gap:14px; padding:36px 24px; text-align:center; animation:pop .5s cubic-bezier(.34,1.56,.64,1) both; }
.fc-celebrate .em { font-size:48px; }
.fc-celebrate h2 { font-family:'Syne',sans-serif; font-size:1.8rem; font-weight:800; margin:0; }
.fc-celebrate p { color:hsl(var(--muted-foreground)); font-size:.95rem; max-width:340px; line-height:1.6; }
.fc-xp-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding:8px 14px; border-radius:999px;
  background:hsl(var(--primary)/.1); color:hsl(var(--primary));
  font-size:13px; font-weight:700;
}
.fc-xp-pop {
  font-size:12px; font-weight:700; color:hsl(var(--primary));
  text-align:center; margin-top:-6px; margin-bottom:10px;
  animation:fadeUp .3s ease both;
}

@media (max-width:580px) {
  .bp-content { padding:1rem 1.1rem 4rem; }
  .bp-title { font-size:1.7rem; }
  .fc-face { min-height:220px; padding:14px 18px 12px; }
  .fc-stats { grid-template-columns:repeat(2,1fr); }
}
`;
