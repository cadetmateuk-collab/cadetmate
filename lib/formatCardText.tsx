'use client';

import type { ReactNode } from 'react';
import { Fragment, useMemo } from 'react';

/* ── Block types ─────────────────────────────────────────────────────────── */

type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'checklist'; items: { checked: boolean; text: string }[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'code'; code: string; lang?: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' }
  | { type: 'image'; alt: string; src: string }
  | { type: 'details'; summary: string; body: string };

/* ── Block parser ────────────────────────────────────────────────────────── */

function isTableSeparator(line: string): boolean {
  return /^\|?[\s:-]+\|[\s|:-]*$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function parseBlocks(raw: string): MdBlock[] {
  if (!raw?.trim()) return [];

  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: MdBlock[] = [];
  let i = 0;

  const skipBlank = () => {
    while (i < lines.length && !lines[i].trim()) i += 1;
  };

  while (i < lines.length) {
    skipBlank();
    if (i >= lines.length) break;

    const line = lines[i];
    const trimmed = line.trim();

    // HTML <details> collapsible
    if (/^<details>/i.test(trimmed)) {
      const chunk: string[] = [lines[i]];
      i += 1;
      while (i < lines.length && !/^<\/details>/i.test(lines[i].trim())) {
        chunk.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) chunk.push(lines[i]);
      i += 1;
      const html = chunk.join('\n');
      const summary = html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]?.trim() ?? 'More';
      const body = html
        .replace(/<details[^>]*>/i, '')
        .replace(/<\/details>/i, '')
        .replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, '')
        .trim();
      blocks.push({ type: 'details', summary, body });
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Heading
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    // Standalone image
    const imgAlone = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgAlone) {
      blocks.push({ type: 'image', alt: imgAlone[1], src: imgAlone[2] });
      i += 1;
      continue;
    }

    // Table
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = parseTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        qLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'blockquote', lines: qLines });
      continue;
    }

    // Checklist
    if (/^[-*•]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const items: { checked: boolean; text: string }[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^[-*•]\s+\[([ xX])\]\s+(.+)$/);
        if (!m) break;
        items.push({ checked: m[1].toLowerCase() === 'x', text: m[2] });
        i += 1;
      }
      blocks.push({ type: 'checklist', items });
      continue;
    }

    // Bullet list
    if (/^[-*•]\s+/.test(trimmed) && !/^[-*•]\s+\[/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^[-*•]\s+(.+)$/);
        if (!m || /^[-*•]\s+\[/.test(lines[i].trim())) break;
        items.push(m[1]);
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^\d+\.\s+(.+)$/);
        if (!m) break;
        items.push(m[1]);
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph — collect until blank or special block
    const para: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next) break;
      if (
        next.startsWith('#') ||
        next.startsWith('```') ||
        next.startsWith('>') ||
        /^!\[/.test(next) ||
        /^<details>/i.test(next) ||
        /^(-{3,}|\*{3,})$/.test(next) ||
        /^[-*•]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        (next.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
      ) break;
      para.push(next);
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: para.join(' ') });
  }

  return blocks;
}

/* ── Inline parser ─────────────────────────────────────────────────────────── */

type InlineRule = { re: RegExp; render: (m: RegExpMatchArray, key: number) => ReactNode };

const INLINE_RULES: InlineRule[] = [
  { re: /`([^`]+)`/, render: (m, k) => <code key={k} className="fc-md-code">{m[1]}</code> },
  { re: /\*\*([^*]+)\*\*/, render: (m, k) => <strong key={k}>{m[1]}</strong> },
  { re: /__([^_]+)__/, render: (m, k) => <strong key={k}>{m[1]}</strong> },
  { re: /==([^=]+)==/, render: (m, k) => <mark key={k} className="fc-md-mark">{m[1]}</mark> },
  { re: /\+\+([^+]+)\+\+/, render: (m, k) => <u key={k}>{m[1]}</u> },
  { re: /~~([^~]+)~~/, render: (m, k) => <s key={k}>{m[1]}</s> },
  { re: /\*([^*]+)\*/, render: (m, k) => <em key={k}>{m[1]}</em> },
  { re: /_([^_]+)_/, render: (m, k) => <em key={k}>{m[1]}</em> },
  { re: /!\[([^\]]*)\]\(([^)]+)\)/, render: (m, k) => (
    <img key={k} src={m[2]} alt={m[1] || 'Diagram'} className="fc-md-inline-img" loading="lazy" />
  )},
  { re: /\[([^\]]+)\]\(([^)]+)\)/, render: (m, k) => (
    <a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className="fc-md-link" onClick={(e) => e.stopPropagation()}>{m[1]}</a>
  )},
];

function renderInline(text: string, keyPrefix = ''): ReactNode[] {
  if (!text) return [];

  let earliest: { index: number; len: number; node: ReactNode } | null = null;

  for (const rule of INLINE_RULES) {
    const m = text.match(rule.re);
    if (m && m.index !== undefined) {
      if (!earliest || m.index < earliest.index) {
        earliest = {
          index: m.index,
          len: m[0].length,
          node: rule.render(m, 0),
        };
      }
    }
  }

  if (!earliest) return [text];

  const before = text.slice(0, earliest.index);
  const after = text.slice(earliest.index + earliest.len);
  const key = `${keyPrefix}-${earliest.index}`;

  return [
    ...(before ? renderInline(before, `${key}-b`) : []),
    <Fragment key={key}>{earliest.node}</Fragment>,
    ...renderInline(after, `${key}-a`),
  ];
}

/* ── Block renderer ────────────────────────────────────────────────────────── */

function renderBlock(block: MdBlock, i: number): ReactNode {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3';
      return <Tag key={i} className={`fc-md-h${block.level}`}>{renderInline(block.text)}</Tag>;
    }
    case 'paragraph':
      return <p key={i} className="fc-md-p">{renderInline(block.text)}</p>;
    case 'ul':
      return (
        <ul key={i} className="fc-md-ul">
          {block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      );
    case 'ol':
      return (
        <ol key={i} className="fc-md-ol">
          {block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ol>
      );
    case 'checklist':
      return (
        <ul key={i} className="fc-md-checklist">
          {block.items.map((item, j) => (
            <li key={j} className={item.checked ? 'is-checked' : ''}>
              <span className="fc-md-check" aria-hidden>{item.checked ? '☑' : '☐'}</span>
              {renderInline(item.text)}
            </li>
          ))}
        </ul>
      );
    case 'blockquote':
      return (
        <blockquote key={i} className="fc-md-quote">
          {block.lines.map((ln, j) => <p key={j}>{renderInline(ln)}</p>)}
        </blockquote>
      );
    case 'code':
      return (
        <pre key={i} className="fc-md-pre">
          <code className={block.lang ? `lang-${block.lang}` : undefined}>{block.code}</code>
        </pre>
      );
    case 'table':
      return (
        <div key={i} className="fc-md-table-wrap">
          <table className="fc-md-table">
            <thead>
              <tr>{block.headers.map((h, j) => <th key={j}>{renderInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr key={i} className="fc-md-hr" />;
    case 'image':
      return (
        <figure key={i} className="fc-md-figure">
          <img src={block.src} alt={block.alt || 'Diagram'} className="fc-md-img" loading="lazy" />
          {block.alt && <figcaption>{block.alt}</figcaption>}
        </figure>
      );
    case 'details':
      return (
        <details key={i} className="fc-md-details" onClick={(e) => e.stopPropagation()}>
          <summary>{renderInline(block.summary)}</summary>
          <div className="fc-md-details-body">
            <FormattedCardText text={block.body} variant="answer" />
          </div>
        </details>
      );
    default:
      return null;
  }
}

/* ── Public component ──────────────────────────────────────────────────────── */

export type CardTextVariant = 'question' | 'answer';

export function FormattedCardText({
  text,
  className,
  variant = 'answer',
}: {
  text: string;
  className?: string;
  variant?: CardTextVariant;
}) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  if (blocks.length === 0) return null;

  return (
    <div
      className={['fc-md', `fc-md--${variant}`, className].filter(Boolean).join(' ')}
      onClick={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest('details, a, summary')) e.stopPropagation();
      }}
    >
      {blocks.map(renderBlock)}
    </div>
  );
}

/** @deprecated Use FormattedCardText — kept for compatibility */
export function parseCardText(text: string) {
  return parseBlocks(text);
}
