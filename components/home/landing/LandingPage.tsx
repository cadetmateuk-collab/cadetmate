'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, BookOpen, WalletCards, Mic, Zap, MessageSquare,
  BarChart3, Flame, Smartphone, Check, Sparkles, TrendingUp,
  Clock, Target, ChevronRight, Anchor, Shield, GraduationCap,
} from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { Reveal, CountUp } from './Reveal';
import { LANDING_FAQS } from '@/lib/seo/faqs';
import './landing.css';

export type LandingData = {
  stats: {
    users: number;
    modules: number;
    flashcards: number;
    posts: number;
    questions: number;
    simulators: number;
  };
  posts: Array<{
    id: string;
    title: string;
    body: string;
    vote_score: number;
    created_at: string;
  }>;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Poster-first LCP image; skip heavy WebM on slow/mobile/save-data. */
const HeroMascot = memo(function HeroMascot() {
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const saveData = connection?.saveData === true;
    const slowNet =
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g' ||
      connection?.effectiveType === '3g';
    const narrow = window.matchMedia('(max-width: 768px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile / constrained networks: keep the lightweight poster only
    if (saveData || slowNet || narrow || reduced) return;

    const start = () => setPlayVideo(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(start, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 2000);
    return () => window.clearTimeout(t);
  }, []);

  if (!playVideo) {
    return (
      <Image
        src="/images/captain-320.webp"
        alt="CadetMate captain mascot"
        width={448}
        height={560}
        priority
        sizes="(max-width: 640px) 280px, 448px"
        className="lp-mascot relative drop-shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
      />
    );
  }

  return (
    <video
      src="/images/captain-wave.webm"
      poster="/images/captain.webp"
      autoPlay
      loop
      muted
      playsInline
      width={448}
      height={560}
      preload="none"
      className="lp-mascot relative drop-shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
      aria-label="CadetMate animated captain mascot"
    />
  );
});

const DashboardMockup = memo(function DashboardMockup() {
  return (
    <div className="lp-browser w-full max-w-lg mx-auto">
      <div className="lp-browser-bar">
        <span className="lp-browser-dot" aria-hidden="true" />
        <span className="lp-browser-dot" aria-hidden="true" />
        <span className="lp-browser-dot" aria-hidden="true" />
        <span className="ml-3 text-[10px] text-muted-foreground font-medium">cadetmate.co.uk/dashboard</span>
      </div>
      <div className="p-5 space-y-4 bg-gradient-to-b from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Welcome back</p>
            <p className="text-sm font-semibold mt-0.5">Continue studying</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold">
            <Flame className="h-3 w-3" /> 12
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Streak', val: '12d' },
            { label: 'XP', val: '2.4k' },
            { label: 'Ready', val: '78%' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-foreground/[0.06] bg-background/80 p-2.5 text-center">
              <p className="text-xs font-bold">{s.val}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {['COLREGs — Rule 5', 'Navigation — Chart Work', 'Cargo — Stability'].map((m, i) => (
            <div key={m} className="flex items-center gap-3 p-2.5 rounded-lg border border-foreground/[0.05] bg-background/60">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{m}</p>
                <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${72 - i * 18}%` }} />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{72 - i * 18}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const FlashcardMockup = memo(function FlashcardMockup() {
  return (
    <div className="relative w-full max-w-xs mx-auto lp-float">
      <div className="lp-card p-6 relative">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-3">Flashcard · COLREGs</p>
        <p className="text-base font-semibold leading-snug">What does Rule 5 require every vessel to maintain?</p>
        <div className="mt-6 pt-4 border-t border-foreground/[0.06] flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Tap to reveal</span>
          <div className="flex gap-1">
            {['Again', 'Good', 'Easy'].map((l) => (
              <span key={l} className="text-[9px] px-2 py-1 rounded-md bg-muted font-medium">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const SYLLABUS_TOPICS = [
  { label: 'COLREGS & rules of the road', href: '/free-content?q=COLREGS' },
  { label: 'Navigation & chartwork', href: '/resources' },
  { label: 'TRB & sea-phase evidence', href: '/free-content?q=TRB' },
  { label: 'STCW & sea survival', href: '/resources' },
  { label: 'Cargo, stability & meteorology', href: '/pricing' },
  { label: 'MCA oral exam prep', href: '/pricing' },
];

export function LandingPage({ data }: { data: LandingData }) {
  const { stats, posts } = data;
  const displayUsers = stats.users > 0 ? stats.users : 500;
  const displayModules = stats.modules > 0 ? stats.modules : 40;
  const displayFlashcards = stats.flashcards > 0 ? stats.flashcards : 20;

  return (
    <div className="lp-root">
        <div className="lp-content">
          {/* ── HERO ── */}
          <section className="lp-section flex items-center pt-8 sm:pt-12 pb-14 sm:pb-20 lg:pb-24">
            <div className="w-full grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center">
              <div className="text-left">
                <p className="lp-eyebrow mb-6 w-fit">
                  <Anchor className="h-3 w-3" />
                  CadetMate · UK deck cadet training
                </p>
                <h1 className="lp-headline text-left">
                  UK deck cadet training for{' '}
                  <span className="text-primary">COLREGS, TRB &amp; MCA orals</span>
                </h1>
                <p className="lp-lead mt-6">
                  The cadetship companion for merchant navy deck cadets — college modules,
                  sea phases, flashcards, and oral prep in one place. Free to start.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-start">
                  <Link href="/auth?mode=signup" className="lp-btn-primary">
                    Start Learning Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/free-content" className="lp-btn-ghost">
                    Browse Free Guides
                  </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Free to join · No credit card · Built for future Officers of the Watch
                </p>
              </div>

              <div className="flex justify-center lg:justify-end">
                <HeroMascot />
              </div>
            </div>
          </section>

          {/* ── TRUST / PROOF ── */}
          <section className="lp-section lp-section-fade border-y border-foreground/[0.05] py-16 lg:py-20" aria-labelledby="trust-heading">
            <div className="w-full ">
              <Reveal>
                <h2 id="trust-heading" className="sr-only">
                  Why UK deck cadets use CadetMate
                </h2>
                <p className="text-center text-sm text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Built for the UK deck pathway — MCA syllabus topics, sea-phase reality, and oral exam preparation
                </p>
              </Reveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 w-full mb-12">
                {[
                  { icon: GraduationCap, title: 'MCA-aligned study', text: 'Modules and revision mapped to how UK deck cadets actually train.' },
                  { icon: Shield, title: 'By mariners, for cadets', text: 'Practical content shaped around college, TRB, and life at sea.' },
                  { icon: BookOpen, title: 'Free learning guides', text: 'Open articles on cadetship, TRB, and training — no account required.' },
                  { icon: MessageSquare, title: 'Cadet community', text: 'Ask questions and learn from cadets on the same journey.' },
                ].map((item, i) => (
                  <Reveal key={item.title} delay={i * 60}>
                    <div className="text-center p-1">
                      <item.icon className="h-5 w-5 text-primary mx-auto mb-3" aria-hidden />
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
                {[
                  { label: 'Cadets on the platform', value: displayUsers, suffix: '+' },
                  { label: 'Learning modules', value: displayModules, suffix: '+' },
                  { label: 'Flashcard packs', value: displayFlashcards, suffix: '+' },
                  { label: 'Practice questions', value: 2500, suffix: '+' },
                  { label: 'Emergency scenarios', value: stats.simulators || 12, suffix: '' },
                  { label: 'Community posts', value: stats.posts > 0 ? stats.posts : 100, suffix: stats.posts > 0 ? '' : '+' },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 50}>
                    <div className="lp-card px-4 py-5 text-center">
                      <p className="text-2xl lg:text-3xl font-bold tracking-tight">
                        <CountUp value={s.value} suffix={s.suffix} />
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── WHAT'S COVERED ── */}
          <section className="lp-section py-24 lg:py-32 " aria-labelledby="syllabus-heading">
            <div className="w-full">
              <Reveal className="text-center mb-12">
                <p className="lp-eyebrow mb-4 mx-auto w-fit">What&apos;s covered</p>
                <h2 id="syllabus-heading" className="lp-headline-sm">
                  Deck cadet topics that match real search intent
                </h2>
                <p className="lp-lead mt-4 text-base mx-auto">
                  From COLREGS revision to TRB evidence and MCA oral prep — study the subjects
                  UK deck cadets need between college and qualification.
                </p>
              </Reveal>
              <div className="grid sm:grid-cols-2 gap-3">
                {SYLLABUS_TOPICS.map((topic, i) => (
                  <Reveal key={topic.label} delay={i * 40}>
                    <Link
                      href={topic.href}
                      className="flex items-center justify-between gap-3 lp-card px-5 py-4 group hover:border-primary/25 transition-colors"
                    >
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{topic.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </Link>
                  </Reveal>
                ))}
              </div>
              <Reveal>
                <p className="text-center text-sm text-muted-foreground mt-8">
                  Prefer reading first?{' '}
                  <Link href="/resources" className="text-primary font-medium hover:underline">
                    Explore free learning resources
                  </Link>
                  {' · '}
                  <Link href="/about" className="text-primary font-medium hover:underline">
                    About CadetMate
                  </Link>
                </p>
              </Reveal>
            </div>
          </section>

          {/* ── PLATFORM PREVIEW ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 bg-muted/20">
            <div className="w-full">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <Reveal className="text-center lg:text-left">
                  <p className="lp-eyebrow mb-4 mx-auto lg:mx-0 w-fit">Study progress</p>
                  <h2 className="lp-headline-sm">
                    Track college modules, sea phase &amp; TRB progress
                  </h2>
                  <p className="lp-lead mt-4 text-base mx-auto lg:mx-0">
                    Pick up the same COLREGS module, chartwork revision, or assignment at college
                    or in your cabin — with streaks and phase tracking so you always know where you stand.
                  </p>
                  <ul className="mt-8 space-y-3 inline-block text-left">
                    {[
                      'Resume modules across college and sea phases',
                      'Daily goals and study streaks that keep you consistent',
                      'Progress visibility from Phase 1 through oral readiness',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div>
                    <Link href="/auth?mode=signup" className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-8 hover:gap-2 transition-all">
                      Create a free account <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>
                <Reveal delay={120}>
                  <DashboardMockup />
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── TRAINING TOOLS ── */}
          <section className="lp-section py-24 lg:py-32 ">
            <div className="w-full">
              <Reveal className="w-full text-center mb-16">
                <p className="lp-eyebrow mb-4 mx-auto w-fit">Training tools</p>
                <h2 className="lp-headline-sm">
                  College modules, COLREGS flashcards &amp; MCA oral practice
                </h2>
              </Reveal>

              <div className="grid lg:grid-cols-12 gap-4 lg:gap-5">
                <Reveal className="lg:col-span-7">
                  <div className="lp-card p-8 lg:p-10 h-full flex flex-col justify-between min-h-[280px] group">
                    <div>
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight">College modules &amp; assignments</h3>
                      <p className="mt-3 text-muted-foreground leading-relaxed max-w-md">
                        Academic content for UK deck cadets — quizzes, resources, and section-by-section
                        progress from your first college phase through revision for exams and orals.
                      </p>
                    </div>
                    <Link href="/resources" className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-8 group-hover:gap-2 transition-all">
                      Explore free resources <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>

                <div className="lg:col-span-5 grid gap-4 lg:gap-5">
                  {[
                    {
                      icon: WalletCards,
                      title: 'COLREGS flashcards & revision',
                      desc: 'Drill rules of the road, signals, and key topics with spaced repetition — ideal between lectures or watches.',
                      href: '/pricing',
                      cta: 'See revision plans',
                    },
                    {
                      icon: Mic,
                      title: 'MCA oral exam practice',
                      desc: 'Mock oral-style practice and a large question bank for when you reach the final stage of deck cadet training.',
                      href: '/pricing',
                      cta: 'View oral prep',
                    },
                    {
                      icon: Zap,
                      title: 'Emergency scenario training',
                      desc: 'Work through fire, man overboard, and flooding responses before you face them at sea.',
                      href: '/pricing',
                      cta: 'Learn about simulators',
                    },
                  ].map((f, i) => (
                    <Reveal key={f.title} delay={i * 80}>
                      <div className="lp-card p-6 group">
                        <f.icon className="h-5 w-5 text-primary mb-3" />
                        <h3 className="font-semibold text-sm">{f.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                        <Link href={f.href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3 group-hover:gap-1.5 transition-all">
                          {f.cta} <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── PRODUCT SHOWCASE ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 bg-muted/15 overflow-hidden">
            <div className="w-full">
              <Reveal className="text-center w-full mb-16">
                <p className="lp-eyebrow mb-4 mx-auto w-fit">See it in action</p>
                <h2 className="lp-headline-sm">
                  Revise COLREGS, ask sea-phase questions, practise emergencies
                </h2>
              </Reveal>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <Reveal delay={0}>
                  <div className="space-y-4 text-center">
                    <FlashcardMockup />
                    <div>
                      <h3 className="font-semibold">COLREGS flashcards</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Spaced-repetition decks for rules of the road and core nautical topics — with XP that rewards consistent study.
                      </p>
                      <Link href="/auth?mode=signup" className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary mt-3">
                        Try free flashcards <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <div className="lp-card overflow-hidden">
                    <div className="p-4 border-b border-foreground/[0.06] bg-muted/30">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Community</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {(posts.length > 0 ? posts.slice(0, 3) : [
                        { id: '1', title: 'Best way to revise COLREGs?', vote_score: 24, body: '' },
                        { id: '2', title: 'TRB task tips for sea phase', vote_score: 18, body: '' },
                        { id: '3', title: 'Chart work resources?', vote_score: 12, body: '' },
                      ]).map((p) => (
                        <div key={p.id} className="flex gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                          <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground shrink-0 w-8">
                            <TrendingUp className="h-3 w-3" />
                            {p.vote_score ?? 0}
                          </div>
                          <p className="text-xs font-medium leading-snug line-clamp-2">{p.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Ask TRB, COLREGS, and sea-phase questions — get answers from cadets who&apos;ve been there.
                  </p>
                  <Link href="/community-preview" className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary mt-2 w-full">
                    Preview the community <ChevronRight className="h-4 w-4" />
                  </Link>
                </Reveal>

                <Reveal delay={200}>
                  <div className="lp-card p-6 bg-gradient-to-br from-primary/[0.04] to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-sm">Emergency simulator</h3>
                    </div>
                    <div className="space-y-2">
                      {['Engine room fire', 'Man overboard', 'Flooding'].map((s, i) => (
                        <div key={s} className="flex items-center justify-between p-3 rounded-lg border border-foreground/[0.06] bg-background/60">
                          <span className="text-xs font-medium">{s}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            {i === 0 ? 'In progress' : 'Locked'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Practise real emergency responses before you need them on board.
                  </p>
                  <Link href="/pricing" className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary mt-2 w-full">
                    See Premium tools <ChevronRight className="h-4 w-4" />
                  </Link>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── JOURNEY ── */}
          <section className="lp-section py-24 lg:py-32 border-y border-foreground/[0.05]">
            <div className="w-full">
              <Reveal className="w-full text-center mb-16">
                <p className="lp-eyebrow mb-4 mx-auto w-fit">Your cadetship</p>
                <h2 className="lp-headline-sm">From first day at college to qualified OOW</h2>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  CadetMate supports each stage of UK deck training — not only last-minute exam cramming.
                </p>
              </Reveal>

              <div className="relative">
                <div className="hidden lg:block absolute top-10 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 lg:gap-4">
                  {[
                    { step: '01', label: 'College', desc: 'Modules, assignments, and syllabus revision from day one.', href: '/resources' },
                    { step: '02', label: 'TRB', desc: 'Guidance for Training Record Book tasks and sea-phase evidence.', href: '/free-content?q=TRB' },
                    { step: '03', label: 'Sea phase', desc: 'Onboard learning support between watches and in the cabin.', href: '/community-preview' },
                    { step: '04', label: 'Revision', desc: 'COLREGS flashcards, quizzes, and structured study streaks.', href: '/free-content' },
                    { step: '05', label: 'MCA orals', desc: 'Oral-style practice and readiness tracking toward OOW.', href: '/pricing' },
                  ].map((item, i) => (
                    <Reveal key={item.step} delay={i * 70} className={i % 2 === 1 ? 'lg:mt-10' : ''}>
                      <Link href={item.href} className="group block text-center">
                        <div className="text-[10px] font-bold text-primary mb-3 tracking-wider">{item.step}</div>
                        <div className="h-px w-8 mx-auto bg-foreground/15 mb-4 group-hover:w-12 group-hover:bg-primary/40 transition-all duration-300" />
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{item.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── E-E-A-T / ABOUT ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 bg-muted/20" aria-labelledby="eeat-heading">
            <div className="w-full text-center">
              <Reveal>
                <p className="lp-eyebrow mb-4 mx-auto w-fit">Experience &amp; expertise</p>
                <h2 id="eeat-heading" className="lp-headline-sm">
                  Built around real UK deck cadet experience
                </h2>
                <p className="lp-lead mt-4 text-base mx-auto">
                  CadetMate exists because textbooks and scattered PDFs don&apos;t match how cadets
                  actually learn — between lectures, during sea phases, and while preparing for MCA orals.
                  We focus on practical maritime training workflows, clear revision tools, and a supportive cadet community.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/about" className="lp-btn-ghost">
                    Meet the CadetMate mission
                  </Link>
                  <Link href="/contact" className="lp-btn-ghost">
                    Contact the team
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── COMMUNITY ── */}
          <section className="lp-section py-24 lg:py-32 ">
            <div className="w-full grid lg:grid-cols-2 gap-16 items-start">
              <Reveal className="text-center lg:text-left">
                <p className="lp-eyebrow mb-4 mx-auto lg:mx-0 w-fit">Community</p>
                <h2 className="lp-headline-sm">Learn alongside UK deck cadets who get it</h2>
                <p className="lp-lead mt-4 text-base mx-auto lg:mx-0">
                  Discuss COLREGS revision, TRB tasks, sea-phase tips, and oral prep with cadets
                  on the same pathway. Preview discussions free — join to post and vote.
                </p>

                <div className="mt-8 flex flex-wrap gap-2 justify-center lg:justify-start">
                  {[
                    { label: 'COLREGs', href: '/free-content?q=COLREGS' },
                    { label: 'TRB', href: '/free-content?q=TRB' },
                    { label: 'Sea Phase', href: '/community-preview' },
                    { label: 'Orals', href: '/pricing' },
                    { label: 'Sea Survival', href: '/resources' },
                  ].map((tag) => (
                    <Link
                      key={tag.label}
                      href={tag.href}
                      className="text-xs px-3 py-1.5 rounded-full border border-foreground/[0.08] bg-muted/40 font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      #{tag.label}
                    </Link>
                  ))}
                </div>

                <p className="mt-8 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground"><CountUp value={displayUsers} suffix="+" /></span> cadets exploring the platform
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/auth?mode=signup" className="lp-btn-primary">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/community-preview" className="lp-btn-ghost">
                    Community preview
                  </Link>
                </div>
              </Reveal>

              <div className="space-y-3">
                {(posts.length > 0 ? posts : []).map((post, i) => (
                  <Reveal key={post.id} delay={i * 80}>
                    <Link
                      href="/community-preview"
                      className="lp-card block p-5 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">{post.title}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{post.body}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary tabular-nums">{post.vote_score ?? 0}</p>
                          <p className="text-[10px] text-muted-foreground">votes</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3">{timeAgo(post.created_at)}</p>
                    </Link>
                  </Reveal>
                ))}
                {posts.length === 0 && (
                  <Reveal>
                    <div className="lp-card p-8 text-center text-sm text-muted-foreground">
                      Be the first to start a discussion after you sign up.
                    </div>
                  </Reveal>
                )}
              </div>
            </div>
          </section>

          {/* ── STUDY ANYWHERE (compressed) ── */}
          <section className="lp-section lp-section-fade py-20 lg:py-24 bg-muted/15 border-y border-foreground/[0.05]">
            <div className="w-full grid lg:grid-cols-2 gap-12 items-center">
              <Reveal className="order-2 lg:order-1 flex justify-center">
                <div className="relative w-[260px]">
                  <div className="relative rounded-[2rem] border-[6px] border-foreground/10 bg-background shadow-2xl overflow-hidden">
                    <div className="h-6 bg-muted/50 flex items-center justify-center">
                      <div className="w-16 h-1 rounded-full bg-foreground/10" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">Daily Quiz</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">What is the minimum safe manning document required for...</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['A', 'B', 'C', 'D'].map((o) => (
                          <div key={o} className="text-[10px] p-2 rounded-lg border border-foreground/[0.06] text-center font-medium">{o}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal className="order-1 lg:order-2 text-center lg:text-left">
                <p className="lp-eyebrow mb-4 mx-auto lg:mx-0 w-fit">Study between watches</p>
                <h2 className="lp-headline-sm">Flashcards on the train. Quizzes between watches.</h2>
                <p className="lp-lead mt-4 text-base mx-auto lg:mx-0">
                  CadetMate fits around college, sea phase, and leave — so STCW topics and COLREGS
                  revision happen in the gaps, not only the night before an exam.
                </p>
                <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
                  {[
                    { icon: Flame, label: 'Daily streaks' },
                    { icon: BarChart3, label: 'Progress sync' },
                    { icon: Target, label: 'Phase tracking' },
                    { icon: Clock, label: 'Short study sessions' },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <f.icon className="h-4 w-4 text-primary shrink-0" />
                      {f.label}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── PREMIUM (short) ── */}
          <section className="lp-section py-24 lg:py-28 ">
            <div className="w-full text-center">
              <Reveal>
                <p className="lp-eyebrow mb-4 mx-auto w-fit">Free &amp; Premium</p>
                <h2 className="lp-headline-sm">Start free. Unlock the full library when you need it.</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  Free covers community, quizzes, limited flashcards, and free maritime guides.
                  Premium adds the full module library, unlimited revision, oral practice, and simulators.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth?mode=signup" className="lp-btn-primary">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/pricing" className="lp-btn-ghost">
                    Compare Free vs Premium
                    <Sparkles className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 bg-muted/20 border-y border-foreground/[0.05]" aria-labelledby="faq-heading">
            <div className="w-full">
              <Reveal className="text-center mb-12">
                <p className="lp-eyebrow mb-4 mx-auto w-fit">FAQ</p>
                <h2 id="faq-heading" className="lp-headline-sm">
                  Deck cadet training — common questions
                </h2>
              </Reveal>
              <div className="space-y-6">
                {LANDING_FAQS.map((faq, i) => (
                  <Reveal key={faq.question} delay={i * 50}>
                    <div className="lp-card p-6">
                      <h3 className="font-semibold text-base">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{faq.answer}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal>
                <p className="text-center text-sm text-muted-foreground mt-10">
                  Still unsure?{' '}
                  <Link href="/contact" className="text-primary font-medium hover:underline">
                    Contact CadetMate
                  </Link>
                  {' · '}
                  <Link href="/about" className="text-primary font-medium hover:underline">
                    Read about us
                  </Link>
                </p>
              </Reveal>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="lp-section py-24 lg:py-32 ">
            <Reveal>
              <div className="w-full text-center">
                <h2 className="lp-headline-sm">
                  Start UK deck cadet training<br />with CadetMate
                </h2>
                <p className="text-muted-foreground mt-4 text-lg max-w-lg mx-auto leading-relaxed">
                  Join <CountUp value={displayUsers} suffix="+" /> cadets using CadetMate for modules,
                  COLREGS revision, TRB support, and MCA oral prep — free to begin.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth?mode=signup" className="lp-btn-primary">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/free-content" className="lp-btn-ghost">
                    Browse Free Guides
                  </Link>
                </div>
                <nav className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground" aria-label="More about CadetMate">
                  <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                  <Link href="/resources" className="hover:text-primary transition-colors">Resources</Link>
                  <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
                  <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                </nav>
              </div>
            </Reveal>
          </section>
        </div>
      </div>
  );
}
