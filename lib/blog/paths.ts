/** URL-safe segment from a category label or slug field */
export function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function resolveCategorySlug(post: {
  category_slug?: string | null;
  category: string;
}): string {
  const fromDb = post.category_slug?.trim();
  if (fromDb) return fromDb;
  const fromLabel = slugifySegment(post.category);
  return fromLabel || 'general';
}

export function buildBlogPostPath(
  post: { category_slug?: string | null; category: string; slug: string },
): string {
  const categorySlug = resolveCategorySlug(post);
  return `/free-content/${categorySlug}/${post.slug}`;
}
