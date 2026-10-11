import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const allRequests = await db.assistanceRequests.find({});
    const allVolunteers = await db.volunteerProfiles.find({});
    const allAssignments = await db.assignments.find({});

    const pendingRequests = allRequests.filter((r) => r.status === 'PENDING' || r.status === 'MATCHING').length;
    const activeAssignments = allRequests.filter((r) => r.status === 'ASSIGNED' || r.status === 'ACTIVE' || r.status === 'COMPLETION_PENDING').length;
    const completedTasks = allRequests.filter((r) => r.status === 'COMPLETED').length;
    const cancelledRequests = allRequests.filter((r) => r.status === 'CANCELLED').length;

    const pendingKyc = allVolunteers.filter((v) => v.kycStatus === 'PENDING_KYC').length;
    const approvedVolunteers = allVolunteers.filter((v) => v.kycStatus === 'APPROVED').length;
    const rejectedVolunteers = allVolunteers.filter((v) => v.kycStatus === 'REJECTED').length;

    const recentRequests = allRequests.slice(0, 6);
    const recentKycPending = allVolunteers.filter((v) => v.kycStatus === 'PENDING_KYC').slice(0, 5);
    const recentAssignments = allAssignments.slice(0, 6);

    return NextResponse.json({
      success: true,
      stats: {
        pendingRequests,
        activeAssignments,
        completedTasks,
        cancelledRequests,
        pendingKyc,
        approvedVolunteers,
        rejectedVolunteers,
        totalVolunteers: allVolunteers.length,
        totalRequests: allRequests.length,
      },
      recentRequests,
      recentKycPending,
      recentAssignments,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
