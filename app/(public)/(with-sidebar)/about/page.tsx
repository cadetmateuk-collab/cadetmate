import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Button } from '@/components/ui/button';
import { Anchor, Users, BookOpen, Target } from 'lucide-react';

export const metadata: Metadata = buildPageMetadata({
  title: 'About CadetMate',
  description: 'Learn about CadetMate — the maritime training platform built for UK deck cadets.',
  path: '/about',
});

const VALUES = [
  { icon: BookOpen, title: 'Built for Cadets', description: 'Every feature is designed around the real MCA syllabus and cadet journey.' },
  { icon: Users, title: 'Community First', description: 'Learn alongside fellow cadets. Ask questions, share knowledge, earn reputation.' },
  { icon: Target, title: 'Progress Driven', description: 'Streaks, XP, and exam readiness scores keep you motivated every day.' },
  { icon: Anchor, title: 'By Mariners', description: 'Content written and reviewed by qualified deck officers and instructors.' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">About CadetMate</h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
          We are building the maritime learning platform that cadets actually want to use every day.
        </p>
      </div>

      <div className="prose prose-slate max-w-none mb-12">
        <p className="text-muted-foreground leading-relaxed">
          CadetMate started with a simple observation: maritime cadets have access to textbooks, PDFs, and scattered online resources — but no unified platform that combines learning, practice, community, and progress tracking in one place.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-4">
          Our mission is to guide cadets from their first day of training through to their oral exams, with interactive modules, realistic simulators, a supportive community, and gamification that makes consistent study feel rewarding rather than tedious.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {VALUES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="p-6 rounded-2xl border border-border/60">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        ))}
      </div>

      <div className="text-center rounded-2xl bg-primary/5 border border-primary/20 p-8">
        <h2 className="text-xl font-bold">Ready to start your journey?</h2>
        <p className="text-muted-foreground mt-2 text-sm">Join thousands of cadets already using CadetMate.</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button asChild><Link href="/auth?mode=signup">Sign Up Free</Link></Button>
          <Button variant="outline" asChild><Link href="/pricing">View Pricing</Link></Button>
        </div>
      </div>
    </div>
  );
}
