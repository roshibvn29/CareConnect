import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { reason } = await req.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: 'Rejection reason is required.' }, { status: 400 });
    }

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
      kycStatus: 'REJECTED',
      kycReviewedAt: new Date().toISOString(),
      kycRejectionReason: reason.trim(),
    });

    // Record review audit log
    await db.kycReviews.create({
      volunteerId: volunteerUserId,
      coordinatorId: auth.user.id,
      documentType: profile.kycDocumentType || 'Identity Document',
      documentUrl: profile.kycDocumentUrl || '',
      status: 'REJECTED',
      reviewReason: reason.trim(),
    });

    // In-app notification to volunteer
    await db.notifications.create({
      userId: volunteerUserId,
      title: 'KYC Document Rejected',
      message: `Your identity document verification was rejected. Reason: ${reason.trim()}. Please re-upload a clear document.`,
      type: 'kyc_update',
    });

    return NextResponse.json({
      success: true,
      message: 'Volunteer KYC has been rejected.',
      profile: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
