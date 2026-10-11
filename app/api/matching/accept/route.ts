import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['volunteer', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'requestId is required' }, { status: 400 });
    }

    const volunteerId = auth.user.id;

    // Check volunteer KYC status
    const profile = await db.volunteerProfiles.findByUserId(volunteerId);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Volunteer profile not found' }, { status: 404 });
    }

    if (profile.kycStatus !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: `Only APPROVED volunteers can accept assistance requests. Your current status is ${profile.kycStatus}.`,
      }, { status: 403 });
    }

    const request = await db.assistanceRequests.findById(requestId);
    if (!request) {
      return NextResponse.json({ success: false, error: 'Assistance request not found' }, { status: 404 });
    }

    if (request.assignedVolunteerId && request.assignedVolunteerId._id !== volunteerId) {
      return NextResponse.json({
        success: false,
        error: 'This request has already been assigned to another volunteer.',
      }, { status: 409 });
    }

    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        error: `Cannot accept request with status ${request.status}.`,
      }, { status: 400 });
    }

    // Update request to ACTIVE / ASSIGNED
    const updatedRequest = await db.assistanceRequests.updateById(requestId, {
      status: 'ACTIVE',
      assignedVolunteerId: volunteerId,
    });

    const requesterId = typeof request.requesterId === 'object' ? request.requesterId._id : request.requesterId;

    // Check or create Assignment record
    let assignment = await db.assignments.findOne({ requestId });
    if (!assignment) {
      assignment = await db.assignments.create({
        requestId,
        volunteerId,
        requesterId,
        status: 'ACTIVE',
        acceptedAt: new Date().toISOString(),
      });
    } else {
      assignment = await db.assignments.updateById(assignment._id, {
        status: 'ACTIVE',
        volunteerId,
        acceptedAt: new Date().toISOString(),
      });
    }

    // In-app notification to requester
    const volUser = await db.users.findById(volunteerId);
    await db.notifications.create({
      userId: requesterId,
      title: 'Volunteer Assigned!',
      message: `Volunteer ${volUser?.name || 'A volunteer'} has accepted your request for ${request.category}.`,
      type: 'request_accepted',
      relatedRequestId: requestId,
    });

    // In-app notification to volunteer
    await db.notifications.create({
      userId: volunteerId,
      title: 'Task Assigned',
      message: `You accepted the task: ${request.category}. Coordinate with requester when ready.`,
      type: 'task_update',
      relatedRequestId: requestId,
    });

    return NextResponse.json({
      success: true,
      message: 'Assistance request accepted successfully.',
      request: updatedRequest,
      assignment,
    });
  } catch (error: any) {
    console.error('Accept error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
