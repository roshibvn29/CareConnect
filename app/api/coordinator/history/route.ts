import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const assignments = await db.assignments.find({});
    const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED');
    const cancelledAssignments = assignments.filter((a) => a.status === 'CANCELLED');

    const kycReviews = await db.kycReviews.find({});

    return NextResponse.json({
      success: true,
      completedAssignments,
      cancelledAssignments,
      allAssignments: assignments,
      kycReviews,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
