/** Unwrap a Supabase embedded relation, which arrives as an object or a one-item array. */
export function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
