/** Module pages live at /modules/<slug>, and slug is not category/subcategory. */
export function moduleHrefFromSlug(slug: string | null | undefined): string {
  if (!slug) return '/unit-modules';
  const parts = slug.split('/').filter(Boolean);
  if (parts.length < 2) return '/unit-modules';
  const category = parts[0];
  const subcategory = parts.slice(1).join('/');
  return `/modules/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}`;
}

export function moduleSlugFromParams(category: string, subcategory: string): string {
  return `${category}/${subcategory}`;
}
