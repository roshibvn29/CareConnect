import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const reviews = await db.kycReviews.find({ volunteerId: profile.userId._id || profile.userId });

    return NextResponse.json({
      success: true,
      volunteer: profile,
      reviews,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
