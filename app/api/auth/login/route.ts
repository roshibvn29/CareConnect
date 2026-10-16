import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { seedDatabase } from '@/lib/seedData';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await db.users.findOne({ email: cleanEmail });

    // If demo account not found, auto-seed demo data
    if (!user && cleanEmail.endsWith('@careconnect.org')) {
      console.log(`Demo user ${cleanEmail} not found. Running seedDatabase...`);
      await seedDatabase();
      user = await db.users.findOne({ email: cleanEmail });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    let kycStatus = undefined;
    if (user.role === 'volunteer') {
      const profile = await db.volunteerProfiles.findByUserId(user._id.toString());
      kycStatus = profile?.kycStatus || 'PENDING_KYC';
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
      message: 'Login successful.',
      user: sessionUser,
      token,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
