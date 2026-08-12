import { supabaseAdmin } from '@/lib/supabase/admin';

type FlaggedContentNotifyInput = {
  contentType: 'post' | 'comment';
  contentId: string;
  authorId: string;
  excerpt: string;
  categories?: string[];
};

/**
 * In-app notify all admins that community content needs review.
 * Fire-and-forget safe; never throws to callers.
 */
export async function notifyAdminsOfFlaggedContent(
  input: FlaggedContentNotifyInput,
): Promise<void> {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (error || !admins?.length) return;

    const kind = input.contentType === 'post' ? 'Post' : 'Comment';
    const cats =
      input.categories && input.categories.length > 0
        ? ` (${input.categories.slice(0, 3).join(', ')})`
        : '';
    const excerpt = input.excerpt.replace(/\s+/g, ' ').trim().slice(0, 120);

    const rows = admins
      .filter((a) => a.id !== input.authorId)
      .map((admin) => ({
        user_id: admin.id,
        type: 'community_moderation',
        title: `${kind} flagged for review${cats}`,
        body: excerpt || 'Open the moderation queue to approve or remove this content.',
        href: `/admin/community/moderation?focus=${input.contentType}:${input.contentId}`,
      }));

    if (rows.length === 0) return;

    await supabaseAdmin.from('notifications').insert(rows);
  } catch {
    // Non-fatal — moderation still holds the content
  }
}
