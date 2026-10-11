import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getKycDocument } from '@/lib/storage';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Only authenticated coordinators or document owner can access
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const fileId = params.id;

    // Check authorization: if user is not coordinator, verify they own this KYC document
    if (auth.user.role !== 'coordinator') {
      const profile = await db.volunteerProfiles.findByUserId(auth.user.id);
      const isOwner = profile?.kycDocumentUrl && profile.kycDocumentUrl.includes(fileId);
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to access this document.' },
          { status: 403 }
        );
      }
    }

    const doc = await getKycDocument(fileId);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found or has been removed.' },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(doc.buffer), {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${fileId}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
