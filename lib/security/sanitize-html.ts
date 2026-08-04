/**
 * Minimal HTML sanitizer for trusted-admin rich text (module blocks).
 * Strips scripts, event handlers, javascript: URLs, and exotic tags.
 * Prefer migrating to isomorphic-dompurify for stronger guarantees later.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'sub', 'sup',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'title', 'class', 'id', 'target', 'rel', 'colspan', 'rowspan',
]);

function isSafeUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (v.startsWith('javascript:') || v.startsWith('data:') || v.startsWith('vbscript:')) {
    return false;
  }
  return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/') || v.startsWith('#') || v.startsWith('mailto:');
}

/** Sanitize HTML string for safe use with dangerouslySetInnerHTML. */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';

  // Remove script/style/iframe/object entirely (including content)
  let html = dirty
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|link|meta|base|form|input|button|textarea|select)[\s\S]*?>/gi, '')
    .replace(/<\/(iframe|object|embed|form|button|textarea|select)>/gi, '');

  // Drop on* event handlers and style attrs
  html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Filter tags + attributes
  html = html.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tagName: string, attrs = '') => {
    const tag = tagName.toLowerCase();
    const closing = match.startsWith('</');
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (closing) return `</${tag}>`;

    const safeAttrs: string[] = [];
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrs)) !== null) {
      const name = m[1].toLowerCase();
      const value = m[3] ?? m[4] ?? m[5] ?? '';
      if (!ALLOWED_ATTRS.has(name)) continue;
      if (name === 'href' || name === 'src') {
        if (!isSafeUrl(value)) continue;
      }
      if (name === 'target' && value !== '_blank' && value !== '_self') continue;
      if (name === 'target' && value === '_blank') {
        safeAttrs.push('target="_blank"', 'rel="noopener noreferrer"');
        continue;
      }
      safeAttrs.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
    }

    return safeAttrs.length ? `<${tag} ${safeAttrs.join(' ')}>` : `<${tag}>`;
  });

  return html;
}
