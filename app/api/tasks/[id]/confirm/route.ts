import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { confirmationCode } = await req.json();

    if (!confirmationCode || !confirmationCode.trim()) {
      return NextResponse.json(
        { success: false, error: 'Confirmation code is required (e.g. CARE-4821).' },
        { status: 400 }
      );
    }

    const request = await db.assistanceRequests.findById(params.id);
    if (!request) {
      return NextResponse.json({ success: false, error: 'Assistance request not found' }, { status: 404 });
    }

    if (request.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Task is already marked as COMPLETED.' }, { status: 400 });
    }

    // Verify confirmation code (case-insensitive, trimmed)
    const expectedCode = (request.confirmationCode || '').trim().toUpperCase();
    const providedCode = confirmationCode.trim().toUpperCase();

    if (expectedCode !== providedCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect confirmation code. Please verify the code provided by the requester.',
        },
        { status: 400 }
      );
    }

    // Code matches! Update Request to COMPLETED
    const updatedRequest = await db.assistanceRequests.updateById(params.id, {
      status: 'COMPLETED',
    });

    const assignedVolId = typeof request.assignedVolunteerId === 'object'
      ? request.assignedVolunteerId?._id?.toString()
      : request.assignedVolunteerId?.toString();

    const requesterId = typeof request.requesterId === 'object'
      ? request.requesterId?._id?.toString()
      : request.requesterId?.toString();

    // Update Assignment
    const assignment = await db.assignments.findOne({ requestId: params.id });
    if (assignment) {
      await db.assignments.updateById(assignment._id, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
    }

    // Increment volunteer completedTasks count
    if (assignedVolId) {
      const volProfile = await db.volunteerProfiles.findByUserId(assignedVolId);
      if (volProfile) {
        await db.volunteerProfiles.updateById(volProfile._id.toString(), {
          completedTasks: (volProfile.completedTasks || 0) + 1,
        });
      }

      // Notify volunteer
      await db.notifications.create({
        userId: assignedVolId,
        title: 'Task Successfully Completed!',
        message: `Assistance task for "${request.category}" was verified and completed. Thank you for your service!`,
        type: 'task_update',
        relatedRequestId: params.id,
      });
    }

    // Notify requester
    if (requesterId) {
      await db.notifications.create({
        userId: requesterId,
        title: 'Assistance Completed',
        message: `Task "${request.category}" has been successfully completed.`,
        type: 'task_update',
        relatedRequestId: params.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Task completion confirmed successfully!',
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error('Confirm task error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
