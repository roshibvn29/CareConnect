import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false, user: null },
        { status: 401 }
      );
    }

    const user = await db.users.findById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, user: null },
        { status: 404 }
      );
    }

    let volunteerProfile = null;
    let kycStatus = undefined;

    if (user.role === 'volunteer') {
      volunteerProfile = await db.volunteerProfiles.findByUserId(user._id.toString());
      kycStatus = volunteerProfile?.kycStatus || 'PENDING_KYC';
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location,
        kycStatus,
        volunteerProfile,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
