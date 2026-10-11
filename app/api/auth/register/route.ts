import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role, address, latitude, longitude, capabilities, availability } = body;

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, phone, password, and role are required.' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['requester', 'volunteer', 'coordinator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user role selected.' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const coords: [number, number] = [
      typeof longitude === 'number' ? longitude : 77.5946,
      typeof latitude === 'number' ? latitude : 12.9716,
    ];

    const newUser = await db.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role,
      address: address || 'Bangalore, Karnataka',
      location: {
        type: 'Point',
        coordinates: coords,
      },
    });

    let kycStatus = undefined;

    // If role is volunteer, create their initial VolunteerProfile
    if (role === 'volunteer') {
      kycStatus = 'PENDING_KYC';
      await db.volunteerProfiles.create({
        userId: newUser._id,
        capabilities: Array.isArray(capabilities) && capabilities.length > 0 ? capabilities : ['Grocery Pickup', 'Medicine Pickup'],
        availability: Array.isArray(availability) && availability.length > 0 ? availability : [
          { day: 'Monday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
          { day: 'Wednesday', slots: ['Morning (8 AM - 12 PM)', 'Evening (4 PM - 8 PM)'] },
          { day: 'Saturday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'] },
        ],
        location: {
          type: 'Point',
          coordinates: coords,
        },
        address: address || 'Bangalore, Karnataka',
        kycStatus: 'PENDING_KYC',
        completedTasks: 0,
      });

      // Send welcome notification
      await db.notifications.create({
        userId: newUser._id,
        title: 'Complete Your KYC Verification',
        message: 'Welcome to CareConnect! Please upload an identity document to become an approved volunteer.',
        type: 'kyc_update',
      });
    }

    const sessionUser = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      address: newUser.address,
      location: newUser.location,
      kycStatus: kycStatus as any,
    };

    const token = signToken(sessionUser);
    const response = NextResponse.json({
      success: true,
      message: 'Account successfully registered.',
      user: sessionUser,
      token,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
