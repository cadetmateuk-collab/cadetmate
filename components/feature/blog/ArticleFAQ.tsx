import type { FAQItem } from '@/lib/blog/types';

export function ArticleFAQ({ faqs }: { faqs: FAQItem[] }) {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-10 text-center" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading" className="mb-4 text-xl font-bold text-foreground">
        Frequently asked questions
      </h2>
      <div className="mx-auto max-w-3xl space-y-3 text-left">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="card group p-4"
          >
            <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
