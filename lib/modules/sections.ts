type ModuleContent = {
  pages?: unknown;
  content?: unknown;
  blocks?: unknown;
  total_lessons?: number | null;
};

export type ModuleSectionTitle = {
  index: number;
  title: string;
};

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asPages(value: unknown): Array<Record<string, unknown>> | null {
  const parsed = parseMaybeJson(value);
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  return parsed as Array<Record<string, unknown>>;
}

function asBlocks(value: unknown): Array<Record<string, unknown>> {
  const parsed = parseMaybeJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed as Array<Record<string, unknown>>;
}

function pageTitle(page: Record<string, unknown>, index: number) {
  const content = asRecord(page.content);
  const title =
    (typeof page.title === 'string' && page.title) ||
    (typeof page.pageTitle === 'string' && page.pageTitle) ||
    (typeof page.label === 'string' && page.label) ||
    (typeof content?.pageTitle === 'string' && content.pageTitle) ||
    (typeof content?.title === 'string' && content.title) ||
    '';
  return title.trim() || `Page ${index + 1}`;
}

export function fallbackModuleSections(count: number): ModuleSectionTitle[] {
  const n = Math.max(1, Math.round(count));
  return Array.from({ length: n }, (_, index) => ({
    index,
    title: `Page ${index + 1}`,
  }));
}

export function listModuleSections(row: ModuleContent): ModuleSectionTitle[] {
  const content = asRecord(parseMaybeJson(row.content));
  const pagesArr =
    asPages(row.pages) ??
    asPages(content?.pages);

  if (pagesArr) {
    return pagesArr.map((page, index) => ({
      index,
      title: pageTitle(page, index),
    }));
  }

  const topBlocks = asBlocks(row.blocks);
  const rawBlocks = topBlocks.length > 0 ? topBlocks : asBlocks(content?.blocks);

  if (rawBlocks.length === 0) {
    if (row.total_lessons && row.total_lessons > 0) {
      return fallbackModuleSections(row.total_lessons);
    }
    return [];
  }

  const pages: ModuleSectionTitle[] = [];
  let hasTrailingContent = false;
  for (const block of rawBlocks) {
    if (block.type === 'page-break') {
      pages.push({
        index: pages.length,
        title: pageTitle(block, pages.length),
      });
      hasTrailingContent = false;
    } else {
      hasTrailingContent = true;
    }
  }
  if (hasTrailingContent) {
    pages.push({
      index: pages.length,
      title: `Page ${pages.length + 1}`,
    });
  }
  if (pages.length > 0) return pages;
  if (row.total_lessons && row.total_lessons > 0) {
    return fallbackModuleSections(row.total_lessons);
  }
  return fallbackModuleSections(1);
}
