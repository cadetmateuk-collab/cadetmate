export type ModuleBlock = {
  id?: string;
  type: string;
  content?: Record<string, unknown>;
};

export type ModulePage = {
  id: string;
  title: string;
  estimatedMinutes: number;
  blocks: ModuleBlock[];
};

export type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string;
  slug: string;
  is_premium?: boolean | null;
  hidden?: boolean | null;
  image_url?: string | null;
  tags?: string[] | null;
  pages?: ModulePage[] | null;
  blocks?: ModuleBlock[] | null;
  content?: { pages?: ModulePage[]; blocks?: ModuleBlock[] } | null;
};

export function modulePages(data: ModuleRow): ModulePage[] {
  const pagesArr = data.pages || data.content?.pages;
  if (Array.isArray(pagesArr) && pagesArr.length > 0) {
    return pagesArr.map((p, i) => ({
      id: p.id || `page-${i}`,
      title: p.title || `Page ${i + 1}`,
      estimatedMinutes: p.estimatedMinutes || 5,
      blocks: p.blocks || [],
    }));
  }

  const raw = data.blocks || data.content?.blocks || [];
  if (!raw.length) {
    return [{ id: 'page-0', title: data.title, estimatedMinutes: 5, blocks: [] }];
  }

  const pages: ModulePage[] = [];
  let current: ModuleBlock[] = [];
  let idx = 0;
  for (const block of raw) {
    if (block.type === 'page-break') {
      pages.push({
        id: `page-${idx}`,
        title: String(block.content?.pageTitle || block.content?.label || `Page ${idx + 1}`),
        estimatedMinutes: Number(block.content?.estimatedMinutes || 5),
        blocks: current,
      });
      current = [];
      idx += 1;
    } else {
      current.push(block);
    }
  }
  if (current.length) {
    pages.push({
      id: `page-${idx}`,
      title: `Page ${idx + 1}`,
      estimatedMinutes: 5,
      blocks: current,
    });
  }
  return pages.length ? pages : [{ id: 'page-0', title: data.title, estimatedMinutes: 5, blocks: [] }];
}
