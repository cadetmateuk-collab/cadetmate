"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifyHeading = slugifyHeading;
exports.splitContentSections = splitContentSections;
exports.extractHeadings = extractHeadings;
exports.extractFAQItems = extractFAQItems;
exports.renderArticleContent = renderArticleContent;
const link_1 = __importDefault(require("next/link"));
function slugifyHeading(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
}
function splitContentSections(content) {
    const match = content.match(/\n##\s+FAQ\s*\n/i);
    if (!match || match.index === undefined)
        return { body: content, faqSection: null };
    return {
        body: content.slice(0, match.index).trim(),
        faqSection: content.slice(match.index).trim(),
    };
}
function extractHeadings(content) {
    const headings = [];
    for (const block of content.split(/\n\n+/)) {
        const trimmed = block.trim();
        if (trimmed.startsWith('## ') && !trimmed.toUpperCase().startsWith('## FAQ')) {
            const text = trimmed.slice(3).trim();
            headings.push({ id: slugifyHeading(text), text, level: 2 });
        }
        else if (trimmed.startsWith('### ')) {
            const text = trimmed.slice(4).trim();
            headings.push({ id: slugifyHeading(text), text, level: 3 });
        }
    }
    return headings;
}
function extractFAQItems(faqSection) {
    var _a, _b, _c, _d;
    if (!faqSection)
        return [];
    const blocks = faqSection.split(/\n\n+/).slice(1);
    const faqs = [];
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i].trim();
        if (block.startsWith('### ')) {
            const question = block.slice(4).trim();
            const answerBlock = (_b = (_a = blocks[i + 1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
            if (answerBlock && !answerBlock.startsWith('#')) {
                faqs.push({ question, answer: stripMarkdown(answerBlock) });
                i++;
            }
        }
        else if (block.startsWith('**Q:') || block.startsWith('**Q :')) {
            const qMatch = block.match(/^\*\*Q:\*\*\s*(.+)$/i);
            const aBlock = (_d = (_c = blocks[i + 1]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : '';
            const aMatch = aBlock.match(/^\*\*A:\*\*\s*(.+)$/i);
            if (qMatch && aMatch) {
                faqs.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
                i++;
            }
        }
    }
    return faqs;
}
function stripMarkdown(text) {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}
function renderInline(text, keyPrefix) {
    const nodes = [];
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
    let lastIndex = 0;
    let match;
    let partIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }
        const token = match[0];
        if (token.startsWith('**')) {
            nodes.push(<strong key={`${keyPrefix}-b-${partIndex++}`}>{token.slice(2, -2)}</strong>);
        }
        else if (token.startsWith('*')) {
            nodes.push(<em key={`${keyPrefix}-i-${partIndex++}`}>{token.slice(1, -1)}</em>);
        }
        else {
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const [, label, href] = linkMatch;
                const isInternal = href.startsWith('/');
                nodes.push(isInternal ? (<link_1.default key={`${keyPrefix}-l-${partIndex++}`} href={href} className="text-primary underline-offset-2 hover:underline">
              {label}
            </link_1.default>) : (<a key={`${keyPrefix}-l-${partIndex++}`} href={href} className="text-primary underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
              {label}
            </a>));
            }
        }
        lastIndex = match.index + token.length;
    }
    if (lastIndex < text.length)
        nodes.push(text.slice(lastIndex));
    return nodes.length ? nodes : [text];
}
function renderListItem(line, key) {
    const text = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
    return <li key={key}>{renderInline(text, key)}</li>;
}
function renderTable(block, key) {
    const rows = block.split('\n').filter((line) => line.trim().includes('|'));
    if (rows.length < 2)
        return null;
    const headerCells = rows[0].split('|').map((c) => c.trim()).filter(Boolean);
    const bodyRows = rows.slice(2);
    return (<div key={key} className="overflow-x-auto my-2">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headerCells.map((cell) => (<th key={cell} className="border border-border bg-muted/40 px-3 py-2 text-left font-semibold">
                {renderInline(cell, `th-${key}`)}
              </th>))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, ri) => {
            const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
            return (<tr key={ri}>
                {cells.map((cell, ci) => (<td key={ci} className="border border-border px-3 py-2 align-top">
                    {renderInline(cell, `td-${key}-${ri}-${ci}`)}
                  </td>))}
              </tr>);
        })}
        </tbody>
      </table>
    </div>);
}
function renderArticleContent(content) {
    if (!content)
        return [];
    const { body } = splitContentSections(content);
    const blocks = body.split(/\n\n+/);
    return blocks
        .map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed)
            return null;
        if (trimmed.startsWith('### ')) {
            const text = trimmed.slice(4);
            const id = slugifyHeading(text);
            return (<h3 key={i} id={id} className="scroll-mt-24 text-center text-lg font-bold text-foreground">
            {text}
          </h3>);
        }
        if (trimmed.startsWith('## ')) {
            const text = trimmed.slice(3);
            const id = slugifyHeading(text);
            return (<h2 key={i} id={id} className="scroll-mt-24 border-b border-border pb-2 text-center text-xl font-bold text-foreground">
            {text}
          </h2>);
        }
        if (trimmed.startsWith('# ')) {
            return (<p key={i} className="text-lg font-bold text-foreground">
            {trimmed.slice(2)}
          </p>);
        }
        const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
            return (<figure key={i} className="my-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgMatch[2]} alt={imgMatch[1] || 'Article illustration'} loading="lazy" decoding="async" className="w-full rounded-lg object-cover"/>
            {imgMatch[1] && (<figcaption className="mt-2 text-center text-sm italic text-muted-foreground">
                {imgMatch[1]}
              </figcaption>)}
          </figure>);
        }
        if (trimmed.startsWith('> ')) {
            return (<blockquote key={i} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
            {renderInline(trimmed.replace(/^>\s?/gm, ''), `bq-${i}`)}
          </blockquote>);
        }
        if (trimmed.includes('|') && trimmed.split('\n').every((l) => l.includes('|') || !l.trim())) {
            return renderTable(trimmed, i);
        }
        const lines = trimmed.split('\n');
        if (lines.every((l) => /^[-*]\s+/.test(l))) {
            return (<ul key={i} className="list-disc space-y-1 pl-5 text-foreground">
            {lines.map((line, li) => renderListItem(line, `${i}-${li}`))}
          </ul>);
        }
        if (lines.every((l) => /^\d+\.\s+/.test(l))) {
            return (<ol key={i} className="list-decimal space-y-1 pl-5 text-foreground">
            {lines.map((line, li) => renderListItem(line, `${i}-${li}`))}
          </ol>);
        }
        return (<p key={i} className="text-[1.0625rem] leading-[1.82] text-foreground">
          {renderInline(trimmed, `p-${i}`)}
        </p>);
    })
        .filter(Boolean);
}
