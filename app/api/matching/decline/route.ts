import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { runMatchingStep } from '@/lib/matching';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['volunteer', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'requestId is required' }, { status: 400 });
    }

    const volunteerId = auth.user.id;
    const request = await db.assistanceRequests.findById(requestId);
    if (!request) {
      return NextResponse.json({ success: false, error: 'Assistance request not found' }, { status: 404 });
    }

    const declinedList = Array.from(new Set([...(request.declinedVolunteers || []), volunteerId]));

    // If was assigned to this volunteer, revert status
    const wasAssigned = request.assignedVolunteerId && (request.assignedVolunteerId._id === volunteerId || request.assignedVolunteerId === volunteerId);

    await db.assistanceRequests.updateById(requestId, {
      declinedVolunteers: declinedList,
      ...(wasAssigned ? { assignedVolunteerId: null, status: 'PENDING' } : {}),
    });

    // Run next matching step to look for next nearby volunteer
    const matchResult = await runMatchingStep(requestId);

    return NextResponse.json({
      success: true,
      message: 'You have declined this request. Searching for other volunteers.',
      matchResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
