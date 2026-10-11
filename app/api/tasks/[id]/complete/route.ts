import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req, ['volunteer', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const request = await db.assistanceRequests.findById(params.id);
    if (!request) {
      return NextResponse.json({ success: false, error: 'Assistance request not found' }, { status: 404 });
    }

    const assignedId = typeof request.assignedVolunteerId === 'object'
      ? request.assignedVolunteerId?._id?.toString()
      : request.assignedVolunteerId?.toString();

    if (auth.user.role !== 'coordinator' && assignedId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not the assigned volunteer for this task.' },
        { status: 403 }
      );
    }

    if (request.status !== 'ACTIVE' && request.status !== 'ASSIGNED') {
      return NextResponse.json(
        { success: false, error: `Cannot mark task complete from current status: ${request.status}` },
        { status: 400 }
      );
    }

    // Set status to COMPLETION_PENDING
    const updated = await db.assistanceRequests.updateById(params.id, {
      status: 'COMPLETION_PENDING',
    });

    const requesterId = typeof request.requesterId === 'object' ? request.requesterId._id : request.requesterId;

    // Notify requester that volunteer marked task complete and code verification is required
    await db.notifications.create({
      userId: requesterId,
      title: 'Task Completion Pending Confirmation',
      message: `Volunteer marked "${request.category}" completed. Please confirm using your code: ${request.confirmationCode}`,
      type: 'task_update',
      relatedRequestId: params.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Task marked complete. Waiting for requester confirmation code.',
      request: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
