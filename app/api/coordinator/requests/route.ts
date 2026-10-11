import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }

    const requests = await db.assistanceRequests.find(query);

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
