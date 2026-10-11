import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    // Check if ID is userId or volunteerProfileId
    let profile = await db.volunteerProfiles.findById(params.id);
    if (!profile) {
      profile = await db.volunteerProfiles.findByUserId(params.id);
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Volunteer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      volunteer: profile,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
