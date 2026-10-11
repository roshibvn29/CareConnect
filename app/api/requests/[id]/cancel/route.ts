import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req, ['requester', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const request = await db.assistanceRequests.findById(params.id);
    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Assistance request not found' },
        { status: 404 }
      );
    }

    const reqUserId = typeof request.requesterId === 'object' ? request.requesterId._id?.toString() : request.requesterId?.toString();
    if (auth.user.role !== 'coordinator' && reqUserId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to cancel this request' },
        { status: 403 }
      );
    }

    if (request.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a completed request' },
        { status: 400 }
      );
    }

    const updated = await db.assistanceRequests.updateById(params.id, {
      status: 'CANCELLED',
    });

    // Notify assigned volunteer if any
    const volId = typeof request.assignedVolunteerId === 'object' ? request.assignedVolunteerId?._id?.toString() : request.assignedVolunteerId?.toString();
    if (volId) {
      await db.notifications.create({
        userId: volId,
        title: 'Assistance Request Cancelled',
        message: `The assistance request for ${request.category} was cancelled.`,
        type: 'task_update',
        relatedRequestId: params.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Request cancelled successfully.',
      request: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
