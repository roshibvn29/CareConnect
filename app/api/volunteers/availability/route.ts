import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req, ['volunteer', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { availability } = await req.json();

    if (!Array.isArray(availability)) {
      return NextResponse.json({ success: false, error: 'Availability array is required.' }, { status: 400 });
    }

    const updatedProfile = await db.volunteerProfiles.updateByUserId(auth.user.id, {
      availability,
    });

    return NextResponse.json({
      success: true,
      message: 'Availability schedule updated successfully.',
      availability: updatedProfile?.availability,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
