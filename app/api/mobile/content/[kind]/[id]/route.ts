import { NextResponse } from 'next/server';
import { requireUserApi } from '@/lib/auth/require-user-api';
import type { ContentKind } from '@cadet-mate/shared';
import { verifyOfflineLicence } from '@/lib/offline/licence';
import { getContentPackage, resolveUserEntitlement, userMayDownload } from '@/lib/offline/session-check';

const KINDS: ContentKind[] = ['module', 'flashcard_pack', 'article', 'survival', 'quiz_bank', 'trb'];

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const { kind: rawKind, id } = await context.params;
  const kind = KINDS.find((item) => item === rawKind);
  if (!kind) return NextResponse.json({ error: 'Unknown content kind' }, { status: 400 });

  const licenceHeader = request.headers.get('X-Offline-Licence');
  if (licenceHeader) {
    try {
      const claims = await verifyOfflineLicence(licenceHeader);
      if (claims.sub !== auth.user.id) {
        return NextResponse.json({ error: 'Licence does not match this account' }, { status: 403 });
      }
    } catch {
      /* Expired or invalid licence is ignored; live billing decides downloads. */
    }
  }

  const packaged = await getContentPackage(kind, decodeURIComponent(id));
  if (!packaged) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const entitlement = await resolveUserEntitlement(auth.user.id);
  if (
    !userMayDownload(
      packaged.manifest.kind,
      packaged.manifest.id,
      entitlement.entitled,
      entitlement.entitlements,
    )
  ) {
    return NextResponse.json({ error: 'Not entitled to download this content' }, { status: 403 });
  }

  return NextResponse.json({
    manifest: packaged.manifest,
    payload: packaged.payload,
  });
}
