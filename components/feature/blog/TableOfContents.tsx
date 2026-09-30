import type { ContentHeading } from '@/lib/blog/types';

export function TableOfContents({ headings }: { headings: ContentHeading[] }) {
  if (headings.length < 3) return null;

  return (
    <aside
      className="card mb-8 p-5 text-center"
      aria-label="Table of contents"
    >
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        On this page
      </h2>
      <ol className="mx-auto w-fit space-y-2 text-left text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level === 3 ? 'pl-4' : undefined}
          >
            <a
              href={`#${heading.id}`}
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
