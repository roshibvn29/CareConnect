import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req, ['volunteer', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { capabilities, address, latitude, longitude } = body;

    const updates: any = {};
    if (capabilities && Array.isArray(capabilities)) {
      updates.capabilities = capabilities;
    }
    if (address) {
      updates.address = address;
    }
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      updates.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    const updatedProfile = await db.volunteerProfiles.updateByUserId(auth.user.id, updates);

    // Also update User record address & location
    if (address || (typeof latitude === 'number' && typeof longitude === 'number')) {
      await db.users.updateById(auth.user.id, {
        ...(address ? { address } : {}),
        ...(typeof latitude === 'number' && typeof longitude === 'number'
          ? { location: { type: 'Point', coordinates: [longitude, latitude] } }
          : {}),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Volunteer profile updated successfully.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
