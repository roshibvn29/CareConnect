import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const pendingProfiles = await db.volunteerProfiles.find({ kycStatus: 'PENDING_KYC' });
    return NextResponse.json({
      success: true,
      pendingVolunteers: pendingProfiles,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
