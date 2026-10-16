import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { seedDatabase } from '@/lib/seedData';

const DEMO_EMAILS: Record<string, string> = {
  coordinator: 'admin@careconnect.org',
  volunteer: 'rahul@careconnect.org',
  requester: 'kamala@careconnect.org',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { role, email } = body;

    let targetEmail = (email || '').toLowerCase().trim();
    if (!targetEmail && role && DEMO_EMAILS[role]) {
      targetEmail = DEMO_EMAILS[role];
    }

    if (!targetEmail) {
      targetEmail = 'admin@careconnect.org';
    }

    let user = await db.users.findOne({ email: targetEmail });

    // If demo user is missing, auto-seed the demo database
    if (!user) {
      console.log(`Demo account ${targetEmail} not found. Auto-seeding CareConnect demo data...`);
      await seedDatabase();
      user = await db.users.findOne({ email: targetEmail });
    }

    // Fallback: If still not found by exact email, find by role
    if (!user && role) {
      user = await db.users.findOne({ role });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: `Demo user for role "${role || targetEmail}" could not be loaded.` },
        { status: 404 }
      );
    }

    let kycStatus = undefined;
    if (user.role === 'volunteer') {
      const profile = await db.volunteerProfiles.findByUserId(user._id.toString());
      kycStatus = profile?.kycStatus || 'APPROVED';
    }

    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      location: user.location,
      kycStatus,
    };

    const token = signToken(sessionUser);
    const response = NextResponse.json({
      success: true,
      message: `Switched to demo persona ${sessionUser.name} (${sessionUser.role}).`,
      user: sessionUser,
      token,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Demo switch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to switch demo persona.' },
      { status: 500 }
    );
  }
}
