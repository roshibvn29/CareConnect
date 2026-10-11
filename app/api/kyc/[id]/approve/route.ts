import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    let profile = await db.volunteerProfiles.findById(params.id);
    if (!profile) {
      profile = await db.volunteerProfiles.findByUserId(params.id);
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Volunteer profile not found' }, { status: 404 });
    }

    const volunteerUserId = typeof profile.userId === 'object' ? profile.userId._id.toString() : profile.userId.toString();

    // Update volunteer profile
    const updated = await db.volunteerProfiles.updateById(profile._id.toString(), {
      kycStatus: 'APPROVED',
      kycReviewedAt: new Date().toISOString(),
      kycRejectionReason: undefined,
    });

    // Record review audit log
    await db.kycReviews.create({
      volunteerId: volunteerUserId,
      coordinatorId: auth.user.id,
      documentType: profile.kycDocumentType || 'Identity Document',
      documentUrl: profile.kycDocumentUrl || '',
      status: 'APPROVED',
      reviewReason: 'Document verified and approved by coordinator.',
    });

    // In-app notification to volunteer
    await db.notifications.create({
      userId: volunteerUserId,
      title: 'KYC Verification Approved!',
      message: 'Congratulations! Your identity document has been verified. You can now receive and accept community assistance requests.',
      type: 'kyc_update',
    });

    return NextResponse.json({
      success: true,
      message: 'Volunteer KYC has been approved.',
      profile: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
