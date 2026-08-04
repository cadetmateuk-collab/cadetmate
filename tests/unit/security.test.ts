import { describe, expect, it } from 'vitest';
import {
  safeRedirectPath,
  escapeHtml,
  escapeIlike,
} from '@/lib/security/env';
import { sanitizeHtml } from '@/lib/security/sanitize-html';

describe('safeRedirectPath', () => {
  it('returns fallback for empty values', () => {
    expect(safeRedirectPath(null)).toBe('/dashboard');
    expect(safeRedirectPath(undefined)).toBe('/dashboard');
    expect(safeRedirectPath('')).toBe('/dashboard');
  });

  it('allows safe relative paths', () => {
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard');
    expect(safeRedirectPath('/flashcards/colregs?mode=study')).toBe(
      '/flashcards/colregs?mode=study',
    );
  });

  it('rejects open redirects and protocol tricks', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard');
    expect(safeRedirectPath('//evil.com')).toBe('/dashboard');
    expect(safeRedirectPath('/\\evil.com')).toBe('/dashboard');
    expect(safeRedirectPath('dashboard')).toBe('/dashboard');
    expect(safeRedirectPath('/auth@evil')).toBe('/dashboard');
  });

  it('respects custom fallback', () => {
    expect(safeRedirectPath(null, '/home')).toBe('/home');
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe(
      '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;',
    );
  });
});

describe('escapeIlike', () => {
  it('escapes PostgREST wildcards', () => {
    expect(escapeIlike('100%_test\\')).toBe('100\\%\\_test\\\\');
  });
});

describe('sanitizeHtml', () => {
  it('strips script tags and event handlers', () => {
    const dirty =
      '<p onclick="alert(1)">Hi</p><script>alert(2)</script><a href="javascript:alert(3)">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('<p>');
    expect(clean).toContain('Hi');
  });

  it('keeps safe links and adds noopener for _blank', () => {
    const clean = sanitizeHtml(
      '<a href="https://cadetmate.co.uk" target="_blank">CadetMate</a>',
    );
    expect(clean).toContain('href="https://cadetmate.co.uk"');
    expect(clean).toContain('rel="noopener noreferrer"');
  });

  it('returns empty string for non-strings', () => {
    expect(sanitizeHtml('' as string)).toBe('');
  });
});
