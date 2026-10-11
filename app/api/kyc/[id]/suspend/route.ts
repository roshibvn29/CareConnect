import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { reason } = await req.json();

    let profile = await db.volunteerProfiles.findById(params.id);
    if (!profile) {
      profile = await db.volunteerProfiles.findByUserId(params.id);
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Volunteer profile not found' }, { status: 404 });
    }

    const volunteerUserId = typeof profile.userId === 'object' ? profile.userId._id.toString() : profile.userId.toString();

    const updated = await db.volunteerProfiles.updateById(profile._id.toString(), {
      kycStatus: 'SUSPENDED',
      kycReviewedAt: new Date().toISOString(),
      kycRejectionReason: reason || 'Suspended by coordinator',
    });

    await db.kycReviews.create({
      volunteerId: volunteerUserId,
      coordinatorId: auth.user.id,
      documentType: profile.kycDocumentType || 'Identity Document',
      documentUrl: profile.kycDocumentUrl || '',
      status: 'SUSPENDED',
      reviewReason: reason || 'Suspended by coordinator',
    });

    await db.notifications.create({
      userId: volunteerUserId,
      title: 'Account Suspended',
      message: `Your volunteer privileges have been suspended. Reason: ${reason || 'Contact community coordinator'}.`,
      type: 'system',
    });

    return NextResponse.json({
      success: true,
      message: 'Volunteer has been suspended.',
      profile: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
