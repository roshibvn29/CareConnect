import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const request = await db.assistanceRequests.findById(params.id);
    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Assistance request not found' },
        { status: 404 }
      );
    }

    // Role check: requester can see their own, assigned volunteer can see it, coordinator can see all
    const reqUserId = typeof request.requesterId === 'object' ? request.requesterId._id?.toString() : request.requesterId?.toString();
    const volUserId = typeof request.assignedVolunteerId === 'object' ? request.assignedVolunteerId._id?.toString() : request.assignedVolunteerId?.toString();

    if (
      auth.user.role !== 'coordinator' &&
      reqUserId !== auth.user.id &&
      volUserId !== auth.user.id &&
      !(request.notifiedVolunteers || []).map(String).includes(auth.user.id)
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this request' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req, ['requester', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const existing = await db.assistanceRequests.findById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Assistance request not found' },
        { status: 404 }
      );
    }

    const reqUserId = typeof existing.requesterId === 'object' ? existing.requesterId._id?.toString() : existing.requesterId?.toString();
    if (auth.user.role !== 'coordinator' && reqUserId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to edit this request' },
        { status: 403 }
      );
    }

    const updated = await db.assistanceRequests.updateById(params.id, body);

    return NextResponse.json({
      success: true,
      message: 'Request updated successfully',
      request: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
