'use client';
import { NoCopy } from '@/components/NoCopy';

/** Shared chrome styles for the user-facing flashcard pages.
 *  Mirrors the bp-* and trb-* aesthetic from the uploaded files. */
export function StudyShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{css}</style>
      <div className="bp-page">
        <NoCopy className="bp-content">{children}</NoCopy>
      </div>
    </>
  );
}

const css = `
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

.bp-page { min-height:100dvh; background:transparent; position:relative; overflow-x:hidden; font-family:inherit; color:hsl(var(--foreground)); }
.bp-content { position:relative; z-index:1; width:100%; max-width:none; margin:0; padding:0 0 4rem; }

/* Back link */
.bp-back { display:inline-flex; align-items:center; gap:.25rem; font-size:.6875rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:hsl(var(--muted-foreground)/.6); text-decoration:none; transition:color .15s; margin-bottom:1.75rem; cursor:pointer; background:none; border:none; padding:0; font-family:inherit; }
.bp-back:hover { color:hsl(var(--primary)); }

/* Header */
.bp-eyebrow { display:inline-flex; align-items:center; gap:.5rem; font-size:.75rem; font-weight:600; letter-spacing:.13em; text-transform:uppercase; color:hsl(var(--primary)); padding:.35rem .9rem; border:1px solid hsl(var(--primary)/.25); border-radius:999px; background:hsl(var(--primary)/.06); margin-bottom:1rem; }
.bp-eyebrow-dot { width:5px; height:5px; border-radius:50%; background:hsl(var(--primary)); animation:pulseRing 2s ease-out infinite; }
.bp-cat-badge { display:inline-block; font-size:.6875rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:hsl(var(--primary)); background:hsl(var(--primary)/.1); padding:.2rem .625rem; border-radius:999px; margin-bottom:.75rem; }
.bp-title { font-size:clamp(2rem,5vw,3rem); font-weight:800; letter-spacing:-.03em; line-height:1.1; margin:0 0 1.25rem; color:hsl(var(--foreground)); -webkit-text-fill-color:currentColor; }
.bp-content, .bp-content *:not(.bp-title):not(.fc-md-link):not(.fc-rbtn):not(.fc-btn-flip) { -webkit-text-fill-color:currentColor; }
.bp-subtitle { font-size:1.0625rem; color:hsl(var(--muted-foreground)); max-width:520px; line-height:1.65; font-weight:300; }
.bp-divider { width:100%; border:none; border-top:1px solid hsl(var(--border)); margin-bottom:2rem; }

/* Progress + stats */
.fc-prog { margin-bottom:1.5rem; }
.fc-prog-meta { display:flex; justify-content:space-between; font-size:.72rem; color:hsl(var(--muted-foreground)); font-weight:500; margin-bottom:6px; }
.fc-prog-track { height:4px; background:hsl(var(--border)); border-radius:99px; overflow:hidden; }
.fc-prog-fill { height:100%; background:linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/.6)); border-radius:99px; transition:width .5s cubic-bezier(.4,0,.2,1); }
.fc-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:1.5rem; }
.fc-stat { background:hsl(var(--card, var(--background))/.85); border:1px solid hsl(var(--border)); border-radius:12px; padding:10px 8px; text-align:center; backdrop-filter:blur(8px); }
.fc-sv { font-size:20px; font-weight:700; line-height:1; color:hsl(var(--foreground)); }
.fc-sv.g { color:#16a34a; } .fc-sv.r { color:hsl(var(--destructive)); } .fc-sv.b { color:hsl(var(--primary)); }
.fc-sl { font-size:10px; color:hsl(var(--muted-foreground)); margin-top:3px; text-transform:uppercase; letter-spacing:.05em; font-weight:600; }

/* 3-D flip card */
.fc-scene {
  width:100%; min-height:300px; margin-bottom:1.25rem;
  perspective:1100px; perspective-origin:50% 50%;
  appearance:none; background:transparent; border:0; padding:0; text-align:inherit; font:inherit; color:inherit;
}
.fc-scene.clickable { cursor:pointer; -webkit-tap-highlight-color:transparent; }
.fc-scene:focus-visible { outline:2px solid hsl(var(--ring)); outline-offset:4px; border-radius:20px; }
.fc-card {
  position:relative; width:100%; height:100%; min-height:300px;
  transform-style:preserve-3d;
  transition:transform .58s cubic-bezier(0.23,1,0.32,1);
  border-radius:20px;
  will-change:transform;
}
.fc-card.is-flipped { transform:rotateY(180deg); }
/* Enter animation on wrapper — never override flip transform on .fc-card */
.fc-enter { width:100%; height:100%; min-height:300px; }
.fc-enter.is-entering { animation:fc-in .38s cubic-bezier(0.23,1,0.32,1) both; }

.fc-face {
  position:absolute; inset:0;
  border-radius:20px;
  backface-visibility:hidden; -webkit-backface-visibility:hidden;
  transform-style:preserve-3d;
  overflow:hidden;
  /* Opaque surface — prevents bleed-through during flip */
  background:#ffffff;
  border:1px solid hsl(var(--border));
  box-shadow:0 2px 4px hsl(var(--foreground)/.04), 0 8px 28px hsl(var(--foreground)/.09);
}
.fc-front { transform:rotateY(0deg) translateZ(2px); }
.fc-back  { transform:rotateY(180deg) translateZ(2px); }

.fc-face-inner {
  display:flex; flex-direction:column; align-items:stretch;
  height:100%; min-height:0;
  padding:18px 22px 14px;
  background:#ffffff;
  border-radius:inherit;
  box-sizing:border-box;
}
.fc-front .fc-face-inner {
  background:#ffffff;
}
.fc-back .fc-face-inner {
  background:#ffffff;
}

.fc-cat {
  align-self:flex-start; flex-shrink:0;
  margin-bottom:10px;
  font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  padding:3px 10px; border-radius:99px;
  color:hsl(var(--primary)); background:hsl(var(--primary)/.1);
}
.fc-body {
  flex:1; width:100%; min-height:0;
  display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start;
  overflow-x:hidden; overflow-y:auto;
  overscroll-behavior:contain;
  padding:2px 2px 6px;
  -webkit-overflow-scrolling:touch;
}
.fc-footer {
  flex-shrink:0; width:100%; padding-top:10px;
  border-top:1px solid hsl(var(--border)/.5);
  margin-top:4px;
}
.fc-img { max-height:120px; max-width:100%; object-fit:contain; margin:0 auto 12px; border-radius:10px; display:block; }
.fc-corner { font-size:10.5px; font-style:italic; color:hsl(var(--muted-foreground)/.7); text-align:center; }
.fc-hint {
  margin-top:12px; font-size:11.5px; color:hsl(var(--muted-foreground));
  font-style:italic; width:100%; text-align:center;
}
.fc-cue { font-size:11px; color:hsl(var(--muted-foreground)/.65); text-align:center; white-space:nowrap; pointer-events:none; }

/* ── Markdown content inside cards ── */
.fc-md { width:100%; max-width:100%; text-align:left; word-wrap:break-word; overflow-wrap:anywhere; }
.fc-md--question { text-align:center; font-size:18px; font-weight:600; line-height:1.5; color:hsl(var(--foreground)); }
.fc-md--question .fc-md-p { text-align:center; }
.fc-md--answer { font-size:14.5px; line-height:1.65; color:hsl(var(--foreground)); }

.fc-md-h1 { font-size:1.25rem; font-weight:800; margin:0 0 .5em; line-height:1.2; letter-spacing:-.02em; color:hsl(var(--foreground)); }
.fc-md-h2 { font-size:1.1rem; font-weight:700; margin:.6em 0 .4em; line-height:1.25; color:hsl(var(--foreground)); }
.fc-md-h3 { font-size:1rem; font-weight:700; margin:.5em 0 .35em; line-height:1.3; color:hsl(var(--foreground)/.9); }
.fc-md-p  { margin:0 0 .55em; line-height:1.65; }
.fc-md-p:last-child { margin-bottom:0; }

.fc-md-ul, .fc-md-ol { margin:.35em 0 .65em; padding-left:1.35em; }
.fc-md-ul li, .fc-md-ol li { margin-bottom:.3em; line-height:1.55; }
.fc-md-ul li:last-child, .fc-md-ol li:last-child { margin-bottom:0; }

.fc-md-checklist { list-style:none; padding-left:0; margin:.35em 0 .65em; }
.fc-md-checklist li { display:flex; gap:8px; align-items:flex-start; margin-bottom:.35em; line-height:1.55; }
.fc-md-checklist li.is-checked { color:hsl(var(--muted-foreground)); text-decoration:line-through; text-decoration-color:hsl(var(--muted-foreground)/.5); }
.fc-md-check { flex-shrink:0; font-size:14px; line-height:1.4; opacity:.75; }

.fc-md-quote {
  margin:.5em 0; padding:.55em .85em;
  border-left:3px solid hsl(var(--primary)/.45);
  background:hsl(var(--primary)/.04); border-radius:0 8px 8px 0;
  color:hsl(var(--foreground)/.85);
}
.fc-md-quote p { margin:0 0 .35em; font-style:italic; }
.fc-md-quote p:last-child { margin-bottom:0; }

.fc-md-pre {
  margin:.5em 0; padding:.65em .8em; border-radius:8px;
  background:hsl(var(--muted)); border:1px solid hsl(var(--border));
  overflow-x:auto; font-size:12px; line-height:1.5;
}
.fc-md-pre code { font-family:ui-monospace,'Cascadia Code',monospace; white-space:pre; }
.fc-md-code {
  font-family:ui-monospace,'Cascadia Code',monospace; font-size:.88em;
  padding:.1em .35em; border-radius:4px;
  background:hsl(var(--muted)); border:1px solid hsl(var(--border));
}

.fc-md-mark { background:#fef08a; color:inherit; padding:.05em .2em; border-radius:3px; }
.fc-md-link { color:hsl(var(--primary)); text-decoration:underline; text-underline-offset:2px; }

.fc-md-hr { border:none; border-top:1px solid hsl(var(--border)); margin:.75em 0; }

.fc-md-table-wrap { overflow-x:auto; margin:.5em 0; -webkit-overflow-scrolling:touch; }
.fc-md-table { width:100%; border-collapse:collapse; font-size:12.5px; }
.fc-md-table th, .fc-md-table td { border:1px solid hsl(var(--border)); padding:.35em .55em; text-align:left; }
.fc-md-table th { background:hsl(var(--muted)); font-weight:700; }

.fc-md-figure { margin:.5em 0; text-align:center; }
.fc-md-img, .fc-md-inline-img {
  max-width:100%; height:auto; border-radius:10px;
  border:1px solid hsl(var(--border));
  display:block; margin:0 auto;
}
.fc-md-inline-img { display:inline; margin:0 .15em; vertical-align:middle; max-height:1.6em; }
.fc-md-figure .fc-md-img { max-height:180px; object-fit:contain; }
.fc-md-figure figcaption { font-size:11px; color:hsl(var(--muted-foreground)); margin-top:.35em; font-style:italic; }

.fc-md-details {
  margin:.5em 0; border:1px solid hsl(var(--border)); border-radius:10px;
  background:hsl(var(--muted)/.35); overflow:hidden;
}
.fc-md-details summary {
  padding:.55em .75em; font-weight:600; font-size:13px; cursor:pointer;
  list-style:none; user-select:none;
}
.fc-md-details summary::-webkit-details-marker { display:none; }
.fc-md-details summary::before { content:'▸ '; opacity:.55; }
.fc-md-details[open] summary::before { content:'▾ '; }
.fc-md-details-body { padding:0 .75em .65em; font-size:13px; border-top:1px solid hsl(var(--border)/.6); }

/* Buttons */
.fc-actions { display:flex; gap:10px; margin-top:12px; }
.fc-btn { flex:1; padding:12px 14px; border-radius:12px; border:none; font-family:inherit; font-size:13.5px; font-weight:600; cursor:pointer; transition:all .15s ease; display:flex; align-items:center; justify-content:center; gap:7px; }
.fc-btn-flip { background:hsl(var(--foreground)); color:hsl(var(--background)); flex:2; box-shadow:0 2px 8px hsl(var(--foreground)/.18); }
.fc-btn-flip:hover { transform:translateY(-1px); box-shadow:0 4px 16px hsl(var(--foreground)/.22); }
.fc-btn-skip { background:hsl(var(--card, var(--background))/.85); color:hsl(var(--muted-foreground)); border:1px solid hsl(var(--border)); }
.fc-btn-skip:hover { background:hsl(var(--background)); color:hsl(var(--foreground)); }

/* Ratings (SM-2) */
.fc-rlbl { font-size:11.5px; font-weight:700; color:hsl(var(--muted-foreground)); text-align:center; text-transform:uppercase; letter-spacing:.07em; margin:14px 0 11px; }
.fc-ratings { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.fc-rbtn { padding:13px 6px 11px; border-radius:14px; border:1.5px solid transparent; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; transition:transform .14s ease, box-shadow .14s ease, background .14s ease, color .14s ease; display:flex; flex-direction:column; align-items:center; gap:5px; line-height:1; }
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
.fc-card-title { font-weight:700; font-size:1.05rem; line-height:1.25; margin:0; }
.fc-card-desc { font-size:.825rem; color:hsl(var(--muted-foreground)); line-height:1.5; flex:1; }
.fc-card-meta { display:flex; gap:6px; flex-wrap:wrap; font-size:.7rem; color:hsl(var(--muted-foreground)); text-transform:uppercase; letter-spacing:.06em; font-weight:600; }
.fc-pill { padding:2px 9px; border-radius:99px; background:hsl(var(--muted)); }
.fc-pill.prem { background:linear-gradient(135deg,#fef3c7,#fcd34d); color:#92400e; }

/* Mode picker */
.fc-modes { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:10px; margin:1.5rem 0; }
.fc-mode { padding:14px 12px; border-radius:14px; background:hsl(var(--card, var(--background))/.85); border:1px solid hsl(var(--border)); cursor:pointer; text-align:left; transition:all .15s ease; font-family:inherit; color:inherit; }
.fc-mode:hover { border-color:hsl(var(--primary)/.5); transform:translateY(-2px); }
.fc-mode-em { font-size:22px; margin-bottom:6px; display:block; }
.fc-mode-title { font-weight:700; font-size:.92rem; margin-bottom:3px; }
.fc-mode-sub { font-size:.72rem; color:hsl(var(--muted-foreground)); line-height:1.45; }

/* Search */
.fc-search { width:100%; padding:.85rem 1rem .85rem 2.6rem; border-radius:14px; background:hsl(var(--card, var(--background))/.9); border:1px solid hsl(var(--border)); font-family:inherit; font-size:.92rem; color:hsl(var(--foreground)); outline:none; transition:border-color .15s; backdrop-filter:blur(8px); }
.fc-search:focus { border-color:hsl(var(--primary)); }
.fc-filterbar { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 22px; }
.fc-chip { padding:6px 13px; border-radius:99px; font-size:.78rem; font-weight:600; border:1px solid hsl(var(--border)); background:transparent; color:hsl(var(--muted-foreground)); cursor:pointer; transition:all .15s; font-family:inherit; }
.fc-chip.on { background:hsl(var(--primary)); color:hsl(var(--primary-foreground, #fff)); border-color:hsl(var(--primary)); }

/* Skeleton */
.fc-skel { border-radius:16px; height:170px; background:linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/.5) 50%, hsl(var(--muted)) 75%); background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite; }

/* Celebration */
.fc-celebrate { display:flex; flex-direction:column; align-items:center; gap:14px; padding:36px 24px; text-align:center; animation:pop .5s cubic-bezier(.34,1.56,.64,1) both; }
.fc-celebrate .em { font-size:48px; }
.fc-celebrate h2 { font-size:1.8rem; font-weight:800; margin:0; color:hsl(var(--foreground)); }
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
  .bp-content { padding:1rem 0 4rem; }
  .bp-title { font-size:1.7rem; }
  .fc-scene { min-height:260px; }
  .fc-card { min-height:260px; }
  .fc-face-inner { padding:14px 16px 12px; }
  .fc-md--answer { font-size:13.5px; }
  .fc-md-h1 { font-size:1.1rem; }
  .fc-md-figure .fc-md-img { max-height:140px; }
  .fc-stats { grid-template-columns:repeat(2,1fr); }
}
`;
