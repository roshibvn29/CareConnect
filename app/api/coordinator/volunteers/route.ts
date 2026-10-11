import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const kycStatus = searchParams.get('kycStatus');

    const query: any = {};
    if (kycStatus && kycStatus !== 'ALL') {
      query.kycStatus = kycStatus;
    }

    const volunteers = await db.volunteerProfiles.find(query);

    return NextResponse.json({
      success: true,
      volunteers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
