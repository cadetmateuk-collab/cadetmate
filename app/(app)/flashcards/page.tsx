"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  category: string;
  hint?: string;
}

interface CardState {
  card: FlashcardData;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: number;
  lastQuality: number;
}

type AnswerMode = "type" | "speech";
type SessionPhase = "answering" | "reviewing";

// ─── SM-2 ─────────────────────────────────────────────────────────────────────

function sm2(state: CardState, quality: number): CardState {
  let { interval, repetitions, easeFactor } = state;
  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );
  return {
    ...state,
    interval,
    repetitions,
    easeFactor,
    nextReview: Date.now() + interval * 86_400_000,
    lastQuality: quality,
  };
}

function initCardState(card: FlashcardData): CardState {
  return {
    card,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    lastQuality: -1,
  };
}

function pickNextCard(states: CardState[], excludeId?: string): CardState | null {
  const due = states.filter(
    (s) => s.nextReview <= Date.now() && s.card.id !== excludeId
  );
  if (due.length === 0)
    return [...states].sort((a, b) => a.nextReview - b.nextReview)[0] ?? null;
  const newCards = due.filter((s) => s.repetitions === 0);
  if (newCards.length > 0)
    return newCards[Math.floor(Math.random() * Math.min(newCards.length, 3))];
  return due.sort((a, b) => a.easeFactor - b.easeFactor)[0];
}

// ─── Speech hook ──────────────────────────────────────────────────────────────

function useSpeechRecognition(onResult: (text: string) => void) {
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-GB";
    r.onresult = (e: any) => {
      onResult(e.results[0][0].transcript);
      setListening(false);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
  }, [onResult]);

  const start = useCallback(() => {
    if (recRef.current && !listening) {
      recRef.current.start();
      setListening(true);
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (recRef.current && listening) {
      recRef.current.stop();
      setListening(false);
    }
  }, [listening]);

  return { listening, supported, start, stop };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_GOAL = 12;

const RATING_CONFIG = [
  { q: 0 as const, label: "Blackout", em: "💀", cls: "q0" },
  { q: 2 as const, label: "Hard",     em: "😓", cls: "q2" },
  { q: 4 as const, label: "Good",     em: "✅", cls: "q4" },
  { q: 5 as const, label: "Easy",     em: "⚡", cls: "q5" },
] as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Animations (matching sea-survival page) ─────────────────────────────── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fc-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes mpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
@keyframes spin    { to { transform: rotate(360deg); } }

.bp-anim-1 { animation: fadeUp 0.4s ease both 0.05s; }
.bp-anim-2 { animation: fadeUp 0.4s ease both 0.12s; }
.bp-anim-3 { animation: fadeUp 0.4s ease both 0.20s; }
.bp-anim-4 { animation: fadeUp 0.4s ease both 0.28s; }
.bp-anim-5 { animation: fadeIn 0.55s ease both 0.18s; }

/* ── Page chrome ─────────────────────────────────────────────────────────── */
.bp-page {
  min-height: 100dvh;
  background-color: hsl(var(--background));
  position: relative;
  overflow-x: hidden;
  font-family: 'DM Sans', sans-serif;
  color: hsl(var(--foreground));
}

.bp-dot-grid {
  pointer-events: none;
  position: fixed; inset: 0; z-index: 0;
  background-image: radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
}
.bp-glow {
  pointer-events: none;
  position: fixed; top: -200px; left: 50%; transform: translateX(-50%); z-index: 0;
  width: 900px; height: 900px; border-radius: 50%;
  background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
}
.bp-noise {
  pointer-events: none;
  position: fixed; inset: 0; z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat; background-size: 180px 180px;
  opacity: 0.025; mix-blend-mode: multiply;
}

/* ── Content shell ───────────────────────────────────────────────────────── */
.bp-content {
  position: relative; z-index: 1;
  max-width: 680px; margin: 0 auto;
  padding: 1.25rem 2.5rem 6rem;
}

/* ── Back link ───────────────────────────────────────────────────────────── */
.bp-back {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground) / 0.6);
  text-decoration: none; transition: color 0.15s;
  margin-bottom: 1.75rem;
}
.bp-back:hover { color: hsl(var(--primary)); }

/* ── Page title area ─────────────────────────────────────────────────────── */
.bp-cat-badge {
  display: inline-block;
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.07em;
  text-transform: uppercase;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
  padding: 0.2rem 0.625rem; border-radius: 999px;
  margin-bottom: 0.75rem;
}

.bp-title {
  font-family: 'Lora', serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
  margin: 0 0 1.25rem;
  background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.7) 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}

.bp-divider {
  width: 100%; border: none;
  border-top: 1px solid hsl(var(--border));
  margin-bottom: 2rem;
}

/* ── Loading / error ─────────────────────────────────────────────────────── */
.bp-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem; padding: 4rem 0;
  color: hsl(var(--muted-foreground));
}
.bp-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px solid hsl(var(--border));
  border-top-color: hsl(var(--primary));
  animation: spin 0.8s linear infinite;
}
.bp-error {
  background: hsl(var(--destructive) / 0.08);
  border: 1px solid hsl(var(--destructive) / 0.25);
  border-radius: 12px; padding: 1.25rem 1.5rem; text-align: center;
  color: hsl(var(--destructive)); font-size: 0.9rem;
}

/* ── Progress ────────────────────────────────────────────────────────────── */
.fc-prog { margin-bottom: 1.5rem; }
.fc-prog-meta {
  display: flex; justify-content: space-between;
  font-size: 0.72rem; color: hsl(var(--muted-foreground)); font-weight: 500; margin-bottom: 6px;
}
.fc-prog-track {
  height: 4px; background: hsl(var(--border)); border-radius: 99px; overflow: hidden;
}
.fc-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6));
  border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1);
}

/* ── Stats row ───────────────────────────────────────────────────────────── */
.fc-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 1.5rem;
}
.fc-stat {
  background: hsl(var(--card, var(--background)) / 0.85);
  border: 1px solid hsl(var(--border));
  border-radius: 12px; padding: 10px 8px; text-align: center;
  backdrop-filter: blur(8px);
}
.fc-sv   { font-family:'Lora',serif; font-size: 20px; font-weight: 700; line-height: 1; color: hsl(var(--foreground)); }
.fc-sv.g { color: #16a34a; }
.fc-sv.r { color: hsl(var(--destructive)); }
.fc-sv.b { color: hsl(var(--primary)); }
.fc-sl   { font-size: 10px; color: hsl(var(--muted-foreground)); margin-top: 3px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }

/* ── Card 3-D flip ───────────────────────────────────────────────────────── */
.fc-scene {
  width: 100%; height: 256px;
  perspective: 1400px; perspective-origin: 50% 38%;
  margin-bottom: 1.25rem;
}
.fc-scene.clickable { cursor: pointer; }

.fc-card {
  position: relative; width: 100%; height: 100%;
  transform-style: preserve-3d;
  transition: transform .62s cubic-bezier(.4,0,.2,1);
  border-radius: 20px; will-change: transform;
}
.fc-card.is-flipped  { transform: rotateY(180deg); }
.fc-card.is-entering { animation: fc-in .36s cubic-bezier(.4,0,.2,1) both; }

.fc-face {
  position: absolute; inset: 0; border-radius: 20px;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 34px 36px; text-align: center; overflow: hidden;
}

/* front — uses theme card surface */
.fc-front {
  background: hsl(var(--card, var(--background)));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 4px 8px hsl(var(--foreground) / 0.04),
              0 12px 32px hsl(var(--foreground) / 0.08),
              0 28px 56px hsl(var(--foreground) / 0.05);
}
.fc-front::after {
  content: ''; position: absolute; inset: 0; border-radius: 20px; pointer-events: none;
  background-image: repeating-linear-gradient(0deg, transparent, transparent 31px,
    hsl(var(--primary) / 0.06) 31px, hsl(var(--primary) / 0.06) 32px);
}

/* back — dark, consistent with the sea-survival dark article back */
.fc-back {
  background: hsl(var(--foreground));
  border: 1px solid hsl(var(--foreground) / 0.12);
  box-shadow: 0 4px 8px rgba(0,0,0,.18), 0 12px 32px rgba(0,0,0,.24), 0 28px 56px rgba(0,0,0,.18);
  transform: rotateY(180deg);
  color: hsl(var(--background));
}
.fc-back::after {
  content: ''; position: absolute; inset: 0; border-radius: 20px; pointer-events: none;
  background:
    radial-gradient(circle at 25% 35%, hsl(var(--primary) / 0.18) 0%, transparent 55%),
    radial-gradient(circle at 74% 70%, hsl(var(--primary) / 0.10) 0%, transparent 50%);
}

.fc-cat {
  position: absolute; top: 15px; left: 18px; z-index: 1;
  font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  padding: 3px 10px; border-radius: 99px;
}
.fc-front .fc-cat { color: hsl(var(--primary)); background: hsl(var(--primary) / 0.1); }
.fc-back  .fc-cat { color: hsl(var(--background) / 0.5); background: hsl(var(--background) / 0.12); }

.fc-corner {
  position: absolute; bottom: 13px; right: 16px; z-index: 1;
  font-size: 10.5px; font-style: italic;
}
.fc-front .fc-corner { color: hsl(var(--muted-foreground)); }
.fc-back  .fc-corner { color: hsl(var(--background) / 0.3); }

.fc-q {
  font-family: 'Lora', serif; font-size: 19px; font-weight: 600; line-height: 1.5;
  color: hsl(var(--foreground)); position: relative; z-index: 1;
}
.fc-a {
  font-family: 'Lora', serif; font-size: 15px; font-weight: 400; line-height: 1.8;
  color: hsl(var(--background)); position: relative; z-index: 1;
}

.fc-hint {
  position: absolute; bottom: 32px;
  font-size: 11.5px; color: hsl(var(--muted-foreground)); font-style: italic; z-index: 1;
}
.fc-cue {
  position: absolute; bottom: 13px; left: 50%; transform: translateX(-50%);
  font-size: 11px; color: hsl(var(--muted-foreground) / 0.6); white-space: nowrap; z-index: 1;
  pointer-events: none; display: flex; align-items: center; gap: 4px;
}

/* ── Below-card ──────────────────────────────────────────────────────────── */
.fc-below { min-height: 196px; }

/* mode toggle */
.fc-toggle {
  display: inline-flex;
  background: hsl(var(--card, var(--background)) / 0.8);
  border: 1px solid hsl(var(--border));
  border-radius: 10px; padding: 3px; gap: 3px; margin-bottom: 13px;
}
.fc-tbtn {
  padding: 6px 16px; border-radius: 7px; border: none; background: transparent;
  font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
  color: hsl(var(--muted-foreground)); cursor: pointer; transition: all .14s ease;
  display: flex; align-items: center; gap: 5px;
}
.fc-tbtn.on { background: hsl(var(--background)); color: hsl(var(--foreground)); box-shadow: 0 1px 4px hsl(var(--foreground) / 0.1); }
.fc-tbtn:disabled { opacity: .38; cursor: not-allowed; }

/* type area */
.fc-tbox {
  background: hsl(var(--card, var(--background)) / 0.85);
  border: 1px solid hsl(var(--border));
  border-radius: 14px; padding: 13px 15px; margin-bottom: 13px;
  transition: border-color .15s ease;
}
.fc-tbox:focus-within { border-color: hsl(var(--primary)); }
.fc-ta {
  width: 100%; background: transparent; border: none; outline: none;
  font-family: 'DM Sans', sans-serif; font-size: 14px;
  color: hsl(var(--foreground));
  resize: none; min-height: 58px; line-height: 1.6;
}
.fc-ta::placeholder { color: hsl(var(--muted-foreground) / 0.5); }

/* speech area */
.fc-sbox {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 8px 0; margin-bottom: 13px;
}
.fc-mic {
  width: 56px; height: 56px; border-radius: 50%; border: none;
  background: hsl(var(--primary)); color: hsl(var(--primary-foreground, #fff));
  font-size: 22px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .18s ease; box-shadow: 0 4px 14px hsl(var(--primary) / 0.38); flex-shrink: 0;
}
.fc-mic.on { background: hsl(var(--destructive)); box-shadow: 0 4px 14px hsl(var(--destructive) / 0.4); animation: mpulse 1.4s ease-in-out infinite; }
.fc-mhint { font-size: 12px; color: hsl(var(--muted-foreground)); font-weight: 500; }
.fc-transcript {
  width: 100%; padding: 9px 13px;
  background: hsl(var(--primary) / 0.05); border: 1px solid hsl(var(--primary) / 0.15);
  border-radius: 10px; font-size: 13.5px; color: hsl(var(--foreground)); line-height: 1.6; font-style: italic;
}

/* action buttons */
.fc-actions { display: flex; gap: 10px; }
.fc-btn {
  flex: 1; padding: 12px 14px; border-radius: 12px; border: none;
  font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
  cursor: pointer; transition: all .15s ease;
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.fc-btn-flip {
  background: hsl(var(--foreground)); color: hsl(var(--background)); flex: 2;
  box-shadow: 0 2px 8px hsl(var(--foreground) / 0.18);
}
.fc-btn-flip:hover  { transform: translateY(-1px); box-shadow: 0 4px 16px hsl(var(--foreground) / 0.22); }
.fc-btn-flip:active { transform: translateY(0); }
.fc-btn-skip {
  background: hsl(var(--card, var(--background)) / 0.85);
  color: hsl(var(--muted-foreground));
  border: 1px solid hsl(var(--border));
}
.fc-btn-skip:hover { background: hsl(var(--background)); color: hsl(var(--foreground)); }

/* rating section */
.fc-rlbl {
  font-size: 11.5px; font-weight: 700; color: hsl(var(--muted-foreground));
  text-align: center; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 11px;
}
.fc-ipill {
  text-align: center; margin-bottom: 10px; min-height: 22px;
  display: flex; align-items: center; justify-content: center;
}
.fc-ipill span {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600; color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.08); border: 1px solid hsl(var(--primary) / 0.18);
  padding: 2px 12px; border-radius: 99px;
}

.fc-ratings { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
.fc-rbtn {
  padding: 13px 6px 11px; border-radius: 14px; border: 1.5px solid transparent;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: transform .14s ease, box-shadow .14s ease, background .14s ease, color .14s ease;
  display: flex; flex-direction: column; align-items: center; gap: 5px; line-height: 1;
}
.fc-rbtn .em { font-size: 20px; }
.fc-rbtn:hover  { transform: translateY(-3px); }
.fc-rbtn:active { transform: translateY(0); }

.fc-rbtn.q0 { background: hsl(var(--destructive) / 0.06); color: hsl(var(--destructive)); border-color: hsl(var(--destructive) / 0.18); }
.fc-rbtn.q0:hover { background: hsl(var(--destructive)); color: #fff; box-shadow: 0 4px 14px hsl(var(--destructive) / 0.3); }
.fc-rbtn.q2 { background: rgba(234,88,12,.07); color: #ea580c; border-color: rgba(234,88,12,.18); }
.fc-rbtn.q2:hover { background: #ea580c; color: #fff; box-shadow: 0 4px 14px rgba(234,88,12,.3); }
.fc-rbtn.q4 { background: rgba(22,163,74,.07); color: #16a34a; border-color: rgba(22,163,74,.18); }
.fc-rbtn.q4:hover { background: #16a34a; color: #fff; box-shadow: 0 4px 14px rgba(22,163,74,.3); }
.fc-rbtn.q5 { background: hsl(var(--primary) / 0.07); color: hsl(var(--primary)); border-color: hsl(var(--primary) / 0.18); }
.fc-rbtn.q5:hover { background: hsl(var(--primary)); color: hsl(var(--primary-foreground, #fff)); box-shadow: 0 4px 14px hsl(var(--primary) / 0.3); }

/* done screen */
.fc-done {
  background: hsl(var(--card, var(--background)) / 0.85);
  border: 1px solid hsl(var(--border));
  border-radius: 22px; padding: 48px 32px; text-align: center;
  backdrop-filter: blur(12px);
}
.fc-done-ico  { font-size: 48px; margin-bottom: 14px; }
.fc-done-ttl  { font-family: 'Lora', serif; font-size: 26px; font-weight: 700; margin-bottom: 8px; color: hsl(var(--foreground)); }
.fc-done-sub  { font-size: 14px; color: hsl(var(--muted-foreground)); line-height: 1.65; margin-bottom: 26px; }
.fc-done-stats { display: flex; justify-content: center; gap: 14px; margin-bottom: 26px; }
.fc-restart {
  padding: 12px 28px; background: hsl(var(--foreground)); color: hsl(var(--background)); border: none;
  border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px;
  font-weight: 600; cursor: pointer; transition: all .18s ease;
}
.fc-restart:hover { transform: translateY(-1px); box-shadow: 0 4px 16px hsl(var(--foreground) / 0.2); }

@media (max-width: 520px) {
  .bp-content  { padding: 1rem 1.25rem 4rem; }
  .fc-stats    { grid-template-columns: repeat(2,1fr); }
  .fc-ratings  { grid-template-columns: repeat(2,1fr); }
  .fc-scene    { height: 228px; }
  .fc-face     { padding: 22px 18px; }
  .fc-q        { font-size: 17px; }
  .fc-a        { font-size: 14px; }
  .bp-title    { font-size: 2rem; }
}
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [current, setCurrent] = useState<CardState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [entering, setEntering] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>("answering");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("type");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [hoveredInterval, setHoveredInterval] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSpeech = useCallback((t: string) => setSpeechText(t), []);
  const { listening, supported, start, stop } = useSpeechRecognition(handleSpeech);

  // ── Fetch cards from Supabase ──────────────────────────────────────────────
  // Table: flashcards  Columns: id, front, back, category, hint (nullable)
  // Add your own .eq('deck_id', deckId) / RLS policy as needed.
  useEffect(() => {
    async function fetchCards() {
      try {
        const { data, error } = await supabase
  .from('flashcards')
  .select('id, front, back, category, hint')
  .order('id');

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("No flashcards found in this deck.");

        setCards(data as FlashcardData[]);
        const fresh = (data as FlashcardData[]).map(initCardState);
        setCardStates(fresh);
        const first = pickNextCard(fresh);
        setCurrent(first);
        triggerEnter();
      } catch (err: any) {
        setLoadError(err?.message ?? "Failed to load flashcards.");
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────
  function triggerEnter() {
    setEntering(true);
    setTimeout(() => setEntering(false), 380);
  }

  function loadCard(next: CardState | null) {
    setCurrent(next);
    setFlipped(false);
    setPhase("answering");
    setTypedAnswer("");
    setSpeechText("");
    setHoveredInterval(null);
    triggerEnter();
  }

  function handleFlip() {
    if (flipped) return;
    setFlipped(true);
    setPhase("reviewing");
  }

  function handleRate(quality: number) {
    if (!current) return;
    const updated = sm2(current, quality);
    const newStates = cardStates.map((s) =>
      s.card.id === current.card.id ? updated : s
    );
    setCardStates(newStates);

    if (quality >= 3) setSessionCorrect((n) => n + 1);
    else setSessionWrong((n) => n + 1);

    const newTotal = sessionTotal + 1;
    setSessionTotal(newTotal);

    if (newTotal >= SESSION_GOAL) {
      setTimeout(() => setSessionDone(true), 200);
      return;
    }
    setTimeout(() => loadCard(pickNextCard(newStates, current.card.id)), 200);
  }

  function handleSkip() {
    if (!current) return;
    loadCard(pickNextCard(cardStates, current.card.id));
  }

  function handleRestart() {
    const fresh = cards.map(initCardState);
    setCardStates(fresh);
    setSessionCorrect(0);
    setSessionWrong(0);
    setSessionTotal(0);
    setSessionDone(false);
    loadCard(pickNextCard(fresh));
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const progressPct = Math.round((sessionTotal / SESSION_GOAL) * 100);
  const accuracy    = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
  const mastered    = cardStates.filter((s) => s.repetitions >= 2).length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="bp-page">
        <div className="bp-dot-grid" aria-hidden="true" />
        <div className="bp-glow"     aria-hidden="true" />
        <div className="bp-noise"    aria-hidden="true" />

        <div className="bp-content">

          {/* Back link */}
          <div className="bp-anim-1">
            <a href="/" className="bp-back">
              ← Home
            </a>
          </div>

          {/* Title */}
          <div className="bp-anim-2">
            <span className="bp-cat-badge">SM-2 · Spaced Repetition</span>
            <h1 className="bp-title">Flashcards</h1>
          </div>

          <hr className="bp-divider bp-anim-3" />

          {/* ── Loading ── */}
          {loading && (
            <div className="bp-loading bp-anim-4">
              <div className="bp-spinner" />
              <span style={{ fontSize: '0.85rem' }}>Loading your deck…</span>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && loadError && (
            <div className="bp-error bp-anim-4">{loadError}</div>
          )}

          {/* ── Session done ── */}
          {!loading && !loadError && sessionDone && (
            <div className="fc-done bp-anim-4">
              <div className="fc-done-ico">
                {accuracy >= 80 ? "🎉" : accuracy >= 50 ? "💪" : "📚"}
              </div>
              <div className="fc-done-ttl">
                {accuracy >= 80 ? "Great session!" : accuracy >= 50 ? "Good effort!" : "Keep practising!"}
              </div>
              <div className="fc-done-sub">
                You reviewed {sessionTotal} cards with {accuracy}% accuracy.
                <br />SM-2 has scheduled your next reviews.
              </div>
              <div className="fc-done-stats">
                <div className="fc-stat" style={{ minWidth: 80 }}>
                  <div className="fc-sv g">{sessionCorrect}</div>
                  <div className="fc-sl">Correct</div>
                </div>
                <div className="fc-stat" style={{ minWidth: 80 }}>
                  <div className="fc-sv r">{sessionWrong}</div>
                  <div className="fc-sl">Wrong</div>
                </div>
                <div className="fc-stat" style={{ minWidth: 80 }}>
                  <div className="fc-sv">{mastered}</div>
                  <div className="fc-sl">Mastered</div>
                </div>
              </div>
              <button className="fc-restart" onClick={handleRestart}>
                Start new session →
              </button>
            </div>
          )}

          {/* ── All caught up ── */}
          {!loading && !loadError && !sessionDone && !current && cards.length > 0 && (
            <div className="fc-done bp-anim-4">
              <div className="fc-done-ico">🌟</div>
              <div className="fc-done-ttl">All caught up!</div>
              <div className="fc-done-sub">No cards are due right now.</div>
              <button className="fc-restart" onClick={handleRestart}>Reset deck</button>
            </div>
          )}

          {/* ── Main session ── */}
          {!loading && !loadError && !sessionDone && current && (
            <div className="bp-anim-4">

              {/* Progress */}
              <div className="fc-prog">
                <div className="fc-prog-meta">
                  <span>{sessionTotal} / {SESSION_GOAL} this session</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="fc-prog-track">
                  <div className="fc-prog-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Stats */}
              <div className="fc-stats">
                <div className="fc-stat">
                  <div className="fc-sv g">{sessionCorrect}</div>
                  <div className="fc-sl">Correct</div>
                </div>
                <div className="fc-stat">
                  <div className="fc-sv r">{sessionWrong}</div>
                  <div className="fc-sl">Wrong</div>
                </div>
                <div className="fc-stat">
                  <div className="fc-sv b">{sessionTotal > 0 ? accuracy + "%" : "—"}</div>
                  <div className="fc-sl">Accuracy</div>
                </div>
                <div className="fc-stat">
                  <div className="fc-sv">{cards.length}</div>
                  <div className="fc-sl">In deck</div>
                </div>
              </div>

              {/* Card */}
              <div
                className={`fc-scene${phase === "answering" ? " clickable" : ""}`}
                onClick={phase === "answering" ? handleFlip : undefined}
              >
                <div
                  key={current.card.id}
                  className={[
                    "fc-card",
                    flipped  ? "is-flipped"  : "",
                    entering ? "is-entering" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {/* Front */}
                  <div className="fc-face fc-front">
                    <div className="fc-cat">{current.card.category}</div>
                    <div className="fc-q">{current.card.front}</div>
                    {current.card.hint && (
                      <div className="fc-hint">Hint: {current.card.hint}</div>
                    )}
                    <div className="fc-cue">↕ click to reveal</div>
                    <div className="fc-corner">
                      {current.repetitions === 0 ? "New" : `×${current.repetitions}`}
                    </div>
                  </div>

                  {/* Back */}
                  <div className="fc-face fc-back">
                    <div className="fc-cat">{current.card.category}</div>
                    <div className="fc-a">{current.card.back}</div>
                    <div className="fc-corner">EF {current.easeFactor.toFixed(1)}</div>
                  </div>
                </div>
              </div>

              {/* Below-card area */}
              <div className="fc-below">

                {/* Answering phase */}
                {phase === "answering" && (
                  <>
                    <div className="fc-toggle">
                      <button
                        className={`fc-tbtn${answerMode === "type" ? " on" : ""}`}
                        onClick={() => setAnswerMode("type")}
                      >
                        ⌨️ Type
                      </button>
                      <button
                        className={`fc-tbtn${answerMode === "speech" ? " on" : ""}`}
                        onClick={() => setAnswerMode("speech")}
                        disabled={!supported}
                        title={!supported ? "Not supported in this browser" : undefined}
                      >
                        🎙️ Speak{!supported ? " —" : ""}
                      </button>
                    </div>

                    {answerMode === "type" && (
                      <div className="fc-tbox">
                        <textarea
                          ref={textareaRef}
                          className="fc-ta"
                          placeholder="Write your answer before flipping…"
                          value={typedAnswer}
                          onChange={(e) => setTypedAnswer(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}

                    {answerMode === "speech" && (
                      <div className="fc-sbox">
                        <button
                          className={`fc-mic${listening ? " on" : ""}`}
                          onClick={listening ? stop : start}
                        >
                          {listening ? "⏹" : "🎙"}
                        </button>
                        <span className="fc-mhint">
                          {listening ? "Listening… tap to stop" : "Tap to speak your answer"}
                        </span>
                        {speechText && (
                          <div className="fc-transcript">"{speechText}"</div>
                        )}
                      </div>
                    )}

                    <div className="fc-actions">
                      <button className="fc-btn fc-btn-flip" onClick={handleFlip}>
                        Flip &amp; compare →
                      </button>
                      <button className="fc-btn fc-btn-skip" onClick={handleSkip}>
                        Skip
                      </button>
                    </div>
                  </>
                )}

                {/* Reviewing phase */}
                {phase === "reviewing" && (
                  <>
                    <div className="fc-ipill">
                      {hoveredInterval !== null && (
                        <span>
                          📅 Next in {hoveredInterval} day{hoveredInterval !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="fc-rlbl">How well did you remember?</div>

                    <div className="fc-ratings">
                      {RATING_CONFIG.map(({ q, label, em, cls }) => (
                        <button
                          key={q}
                          className={`fc-rbtn ${cls}`}
                          onClick={() => handleRate(q)}
                          onMouseEnter={() =>
                            setHoveredInterval(current ? sm2(current, q).interval : 1)
                          }
                          onMouseLeave={() => setHoveredInterval(null)}
                        >
                          <span className="em">{em}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}