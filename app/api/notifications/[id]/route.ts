import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const updated = await db.notifications.markAsRead(params.id);
    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
