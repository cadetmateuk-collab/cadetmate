'use client';

import Link from 'next/link';
import {
  ArrowRight, BookOpen, WalletCards, Mic, Zap, MessageSquare,
  BarChart3, Flame, Smartphone, Check, Sparkles, TrendingUp,
  Users, Clock, Target, ChevronRight, Anchor,
} from 'lucide-react';
import { Reveal, CountUp } from './Reveal';
import { LANDING_STYLES } from './styles';

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

function DashboardMockup() {
  return (
    <div className="lp-browser w-full max-w-lg mx-auto">
      <div className="lp-browser-bar">
        <span className="lp-browser-dot" />
        <span className="lp-browser-dot" />
        <span className="lp-browser-dot" />
        <span className="ml-3 text-[10px] text-muted-foreground font-medium">cadetmate.com/dashboard</span>
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
}

function FlashcardMockup() {
  return (
    <div className="relative w-full max-w-xs mx-auto" style={{ animation: 'lp-float 5s ease-in-out infinite' }}>
      <div className="absolute -inset-4 rounded-2xl bg-primary/[0.06] blur-2xl" />
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
}

export function LandingPage({ data }: { data: LandingData }) {
  const { stats, posts } = data;
  const displayUsers = stats.users > 0 ? stats.users : 500;
  const displayModules = stats.modules > 0 ? stats.modules : 40;
  const displayFlashcards = stats.flashcards > 0 ? stats.flashcards : 20;

  return (
    <>
      <style>{LANDING_STYLES}</style>
      <div className="lp-root">
        <div className="lp-content">
          {/* ── HERO ── */}
          <section className="lp-section min-h-[90vh] flex items-center px-5 sm:px-8 lg:px-12 pt-10 pb-24 lg:pb-32">
            <div className="w-full">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center">
                <div className="max-w-2xl lg:max-w-none">
                  <Reveal>
                    <p className="lp-eyebrow mb-6">
                      <Anchor className="h-3 w-3" />
                      For UK deck cadets &amp; future Officers of the Watch
                    </p>
                  </Reveal>
                  <Reveal delay={80}>
                    <h1 className="lp-headline">
                      One platform for{' '}
                      <span className="text-primary">every stage</span> of your cadetship
                    </h1>
                  </Reveal>
                  <Reveal delay={160}>
                    <p className="lp-lead mt-6">
                      From your first day at college through sea phases, TRB tasks, assignments,
                      and revision — to preparing for your MCA orals. Learn with confidence,
                      stay organised, and build the knowledge you need at sea.
                    </p>
                  </Reveal>
                  <Reveal delay={240}>
                    <div className="mt-10 flex flex-col sm:flex-row gap-3">
                      <Link href="/auth?mode=signup" className="lp-btn-primary">
                        Start Learning Free
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href="/free-content" className="lp-btn-ghost">
                        Browse Free Content
                      </Link>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Free to join · No credit card · Trusted by <CountUp value={displayUsers} suffix="+" /> cadets
                    </p>
                  </Reveal>
                </div>

                <Reveal delay={280} className="flex justify-center lg:justify-end">
                  <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] xl:max-w-[520px]">
                    <div className="absolute -inset-12 rounded-full bg-primary/[0.06] blur-3xl" />
                    <video
                      src="/images/captain-wave.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="relative w-full h-auto object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.12)]"
                      aria-hidden
                    />
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── TRUST ── */}
          <section className="lp-section lp-section-fade border-y border-foreground/[0.05] py-16 lg:py-20">
            <div className="w-full">
              <Reveal>
                <p className="text-center text-sm text-muted-foreground mb-10">
                  Trusted by UK deck cadets at every stage of training
                </p>
              </Reveal>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                {[
                  { label: 'Cadets', value: displayUsers, suffix: '+' },
                  { label: 'Learning modules', value: displayModules, suffix: '+' },
                  { label: 'Flashcard packs', value: displayFlashcards, suffix: '+' },
                  { label: 'Practice questions', value: 2500, suffix: '+' },
                  { label: 'Scenarios', value: stats.simulators || 12, suffix: '' },
                  { label: 'Community posts', value: stats.posts > 0 ? stats.posts : 100, suffix: stats.posts > 0 ? '' : '+' },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 60}>
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

          {/* ── PLATFORM PREVIEW ── */}
          <section className="lp-section py-24 lg:py-32 px-5 sm:px-8 lg:px-12">
            <div className="w-full">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <Reveal>
                  <p className="lp-eyebrow mb-4">Platform preview</p>
                  <h2 className="lp-headline-sm">
                    Your cadetship,<br />organised in one place
                  </h2>
                  <p className="lp-lead mt-4 text-base">
                    Track modules, assignments, and revision progress across college
                    and sea phases — pick up exactly where you left off.
                  </p>
                  <ul className="mt-8 space-y-3">
                    {['Continue studying widgets', 'Daily goals & streaks', 'Progress across every phase'].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal delay={120}>
                  <DashboardMockup />
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── EVERYTHING YOU NEED ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 px-5 sm:px-8 lg:px-12 bg-muted/20">
            <div className="w-full">
              <Reveal className="max-w-2xl mb-16">
                <p className="lp-eyebrow mb-4">Everything you need</p>
                <h2 className="lp-headline-sm">Built for the full cadet journey,<br />not just exam cramming</h2>
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
                        Academic content aligned to your syllabus — with quizzes, resources,
                        and section-by-section progress from your first college phase onwards.
                      </p>
                    </div>
                    <Link href="/resources" className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-8 group-hover:gap-2 transition-all">
                      Explore resources <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>

                <div className="lg:col-span-5 grid gap-4 lg:gap-5">
                  {[
                    { icon: WalletCards, title: 'Flashcards & revision', desc: 'Drill COLREGs, signals, and key topics with spaced repetition.' },
                    { icon: Mic, title: 'Mock oral exams', desc: 'Realistic MCA oral practice when you reach the final stage.' },
                    { icon: Zap, title: 'Emergency scenarios', desc: 'Practise real-world responses before you face them at sea.' },
                  ].map((f, i) => (
                    <Reveal key={f.title} delay={i * 80}>
                      <div className="lp-card p-6 group">
                        <f.icon className="h-5 w-5 text-primary mb-3" />
                        <h3 className="font-semibold text-sm">{f.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── PRODUCT SHOWCASE ── */}
          <section className="lp-section py-24 lg:py-32 px-5 sm:px-8 lg:px-12 overflow-hidden">
            <div className="w-full">
              <Reveal className="text-center max-w-2xl mx-auto mb-16">
                <p className="lp-eyebrow mb-4 mx-auto w-fit">See it in action</p>
                <h2 className="lp-headline-sm">Tools that support you at college, at sea, and ashore</h2>
              </Reveal>

              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                <Reveal delay={0}>
                  <div className="space-y-4">
                    <FlashcardMockup />
                    <div>
                      <h3 className="font-semibold">Flashcards</h3>
                      <p className="text-sm text-muted-foreground mt-1">SM-2 spaced repetition with XP rewards</p>
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
                  <p className="text-sm text-muted-foreground mt-4">Ask questions. Get answers from cadets who&apos;ve been there.</p>
                </Reveal>

                <Reveal delay={200}>
                  <div className="lp-card p-6 bg-gradient-to-br from-primary/[0.04] to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">Emergency Simulator</span>
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
                  <p className="text-sm text-muted-foreground mt-4">Practice real emergency responses before you need them.</p>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── JOURNEY ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 px-5 sm:px-8 lg:px-12 border-y border-foreground/[0.05]">
            <div className="w-full">
              <Reveal className="max-w-xl mb-16">
                <p className="lp-eyebrow mb-4">Your cadetship</p>
                <h2 className="lp-headline-sm">From first day at college to qualified OOW</h2>
              </Reveal>

              <div className="relative">
                <div className="hidden lg:block absolute top-10 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
                  {[
                    { step: '01', label: 'College', desc: 'Modules & assignments' },
                    { step: '02', label: 'TRB', desc: 'Record sea-phase tasks' },
                    { step: '03', label: 'Sea phase', desc: 'Practical onboard learning' },
                    { step: '04', label: 'Revision', desc: 'Flashcards & resources' },
                    { step: '05', label: 'Community', desc: 'Learn with other cadets' },
                    { step: '06', label: 'Qualify', desc: 'Oral prep & OOW readiness' },
                  ].map((item, i) => (
                    <Reveal key={item.step} delay={i * 70} className={i % 2 === 1 ? 'lg:mt-10' : ''}>
                      <div className="group">
                        <div className="text-[10px] font-bold text-primary mb-3 tracking-wider">{item.step}</div>
                        <div className="h-px w-8 bg-foreground/15 mb-4 group-hover:w-12 group-hover:bg-primary/40 transition-all duration-300" />
                        <h3 className="font-semibold text-sm">{item.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── COMMUNITY ── */}
          <section className="lp-section py-24 lg:py-32 px-5 sm:px-8 lg:px-12">
            <div className="w-full grid lg:grid-cols-2 gap-16 items-start">
              <Reveal>
                <p className="lp-eyebrow mb-4">Community</p>
                <h2 className="lp-headline-sm">Learn alongside cadets who get it</h2>
                <p className="lp-lead mt-4 text-base">
                  Real discussions from real cadets. Ask questions, share tips,
                  and build reputation as you help others.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {['College', 'Sea Phase', 'TRB', 'COLREGs', 'Sea Survival', 'Orals'].map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1.5 rounded-full border border-foreground/[0.08] bg-muted/40 font-medium text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-6">
                  <div className="flex -space-x-2">
                    {['AC', 'JM', 'SK', 'TR'].map((initials) => (
                      <div key={initials} className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                        {initials}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground"><CountUp value={displayUsers} suffix="+" /></span> members active
                  </p>
                </div>

                <Link href="/auth?mode=signup" className="lp-btn-primary mt-10">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>

              <div className="space-y-3">
                {(posts.length > 0 ? posts : []).map((post, i) => (
                  <Reveal key={post.id} delay={i * 80}>
                    <Link
                      href={`/community/post/${post.id}`}
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
                      Be the first to start a discussion.
                    </div>
                  </Reveal>
                )}
              </div>
            </div>
          </section>

          {/* ── STUDY ANYWHERE ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 px-5 sm:px-8 lg:px-12 bg-muted/15 border-y border-foreground/[0.05]">
            <div className="w-full grid lg:grid-cols-2 gap-12 items-center">
              <Reveal className="order-2 lg:order-1 flex justify-center">
                <div className="relative w-[260px]">
                  <div className="absolute inset-0 rounded-[2.5rem] bg-primary/10 blur-3xl scale-110" />
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
              <Reveal className="order-1 lg:order-2">
                <p className="lp-eyebrow mb-4">Study anywhere</p>
                <h2 className="lp-headline-sm">Your companion at college, at sea, and ashore</h2>
                <p className="lp-lead mt-4 text-base">
                  Flashcards on the train. Quick quizzes between watches.
                  Full modules in your cabin. CadetMate fits around your cadetship.
                </p>
                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: Flame, label: 'Daily streaks' },
                    { icon: BarChart3, label: 'Progress sync' },
                    { icon: Target, label: 'Phase tracking' },
                    { icon: Clock, label: 'Study timers' },
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

          {/* ── PREMIUM TRANSFORMATION ── */}
          <section className="lp-section py-24 lg:py-32 px-5 sm:px-8 lg:px-12">
            <div className="w-full">
              <Reveal className="text-center max-w-2xl mx-auto mb-16">
                <p className="lp-eyebrow mb-4 mx-auto w-fit">Premium</p>
                <h2 className="lp-headline-sm">Go further when you&apos;re ready</h2>
                <p className="text-muted-foreground mt-4">Start free — upgrade for the full library when you need it.</p>
              </Reveal>

              <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
                <Reveal>
                  <div className="lp-card p-8 h-full">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">Free account</p>
                    <ul className="space-y-4">
                      {[
                        'Browse free resources & blog',
                        'Daily quiz & study streaks',
                        'Community access',
                        'Limited flashcard packs',
                        'Progress tracking basics',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-foreground/20 mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <div className="lp-card p-8 h-full border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-6 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Premium cadet
                    </p>
                    <ul className="space-y-4 relative">
                      {[
                        'Full module library unlocked',
                        'Unlimited flashcards & spaced repetition',
                        'Mock oral exams & practice questions',
                        'Emergency scenario simulators',
                        'Advanced analytics & certificates',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link href="/pricing" className="lp-btn-ghost mt-8 w-full sm:w-auto">
                      View pricing
                    </Link>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ── */}
          <section className="lp-section lp-section-fade py-24 lg:py-32 px-5 sm:px-8 lg:px-12 border-t border-foreground/[0.05]">
            <div className="w-full">
              <Reveal className="mb-14">
                <p className="lp-eyebrow mb-4">Testimonials</p>
                <h2 className="lp-headline-sm">Cadets who rely on CadetMate</h2>
              </Reveal>

              <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
                {[
                  { name: 'James M.', role: 'Deck Cadet, Phase 3', quote: 'I use it from college through sea phase — modules, TRB notes, and flashcards all in one place.', initials: 'JM' },
                  { name: 'Sarah K.', role: 'Officer Cadet', quote: 'The community answered questions my college couldn\'t. Felt like having mates on every ship.', initials: 'SK' },
                  { name: 'Tom R.', role: 'UK Deck Cadet', quote: 'Structured revision with real progress tracking. I knew exactly where I stood before my orals.', initials: 'TR' },
                ].map((t, i) => (
                  <Reveal key={t.name} delay={i * 90} className={i === 1 ? 'md:mt-8' : ''}>
                    <div className="lp-card p-7 flex flex-col h-full">
                      <p className="text-sm leading-relaxed text-muted-foreground flex-1">&ldquo;{t.quote}&rdquo;</p>
                      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-foreground/[0.06]">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {t.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="lp-section py-24 lg:py-32 px-5 sm:px-8 lg:px-12">
            <Reveal>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="lp-headline-sm">
                  Start your cadetship<br />with confidence
                </h2>
                <p className="text-muted-foreground mt-4 text-lg max-w-lg mx-auto leading-relaxed">
                  Join thousands of cadets building knowledge from day one — free to start,
                  with everything you need as you progress.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth?mode=signup" className="lp-btn-primary">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/free-content" className="lp-btn-ghost">
                    Browse Free Content
                  </Link>
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </div>
    </>
  );
}
