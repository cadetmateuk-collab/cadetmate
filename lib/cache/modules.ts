import { cacheAside, CONTENT_TTL_SECONDS } from '@/lib/cache/content';
import { createPublicSupabase } from '@/lib/db/public';

export type FreeModuleRecord = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  blocks: unknown;
  slug: string;
};

/** Public, non-premium module body. Premium rows are not stored. */
export function getFreeModuleBySlug(slug: string): Promise<FreeModuleRecord | null> {
  return cacheAside(`cm:modules:free:${slug}`, CONTENT_TTL_SECONDS, async () => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || data.hidden || data.is_premium) return null;
    return data as FreeModuleRecord;
  });
}
