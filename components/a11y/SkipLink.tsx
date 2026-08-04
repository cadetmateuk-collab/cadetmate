import Link from 'next/link';

/** First focusable control — jump past chrome to main content (WCAG 2.4.1). */
export function SkipLink({ href = '#main-content' }: { href?: string }) {
  return (
    <Link href={href} className="skip-link">
      Skip to main content
    </Link>
  );
}
