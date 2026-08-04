import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Page Not Found', '/404');

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-center px-6">
      <div className="relative h-24 w-24 mb-6">
        <Image
          src="/images/c2.webp"
          alt="CadetMate logo"
          fill
          sizes="96px"
          className="object-contain"
          priority
        />
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold text-white">
        You&apos;ve gone off course, sailor
      </h1>

      <p className="mt-2 text-white/80">
        Head back to the cross track
      </p>

      <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Helpful links">
        <Link
          href="/home"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-primary font-semibold hover:bg-white/90 transition"
        >
          Back to Home
        </Link>
        <Link
          href="/free-content"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/40 text-white font-semibold hover:bg-white/10 transition"
        >
          Free Articles
        </Link>
      </nav>
    </div>
  );
}
