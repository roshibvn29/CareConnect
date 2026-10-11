import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getNextRadius, SEARCH_RADIUS_TIERS } from '@/lib/geo';
import { findEligibleVolunteers } from '@/lib/matching';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'requestId is required' }, { status: 400 });
    }

    const request = await db.assistanceRequests.findById(requestId);
    if (!request) {
      return NextResponse.json({ success: false, error: 'Assistance request not found' }, { status: 404 });
    }

    if (request.status === 'ASSIGNED' || request.status === 'ACTIVE' || request.status === 'COMPLETED') {
      return NextResponse.json({
        success: false,
        error: `Cannot expand radius. Request is already ${request.status}.`,
      }, { status: 400 });
    }

    const currentRadius = request.currentSearchRadius || 2;
    const nextRadius = getNextRadius(currentRadius);

    if (!nextRadius) {
      return NextResponse.json({
        success: false,
        maxReached: true,
        message: `Maximum search radius of ${SEARCH_RADIUS_TIERS[SEARCH_RADIUS_TIERS.length - 1]} km already reached.`,
        currentRadius,
      });
    }

    const eligible = await findEligibleVolunteers(request, nextRadius);
    const notifiedIds = eligible.map((m) =>
      (typeof m.user?._id === 'object' ? m.user._id.toString() : m.user?._id?.toString()) || ''
    ).filter(Boolean);

    await db.assistanceRequests.updateById(requestId, {
      currentSearchRadius: nextRadius,
      status: eligible.length > 0 ? 'MATCHING' : 'PENDING',
      notifiedVolunteers: Array.from(new Set([...(request.notifiedVolunteers || []), ...notifiedIds])),
    });

    // Notify newly reached volunteers
    for (const m of eligible) {
      const volUserId = typeof m.user?._id === 'object' ? m.user._id.toString() : m.user?._id;
      if (volUserId) {
        await db.notifications.create({
          userId: volUserId,
          title: 'Assistance Request Radius Expanded',
          message: `${request.category} now available ~${m.distanceKm} km away. Click to accept.`,
          type: 'request_matched',
          relatedRequestId: requestId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      previousRadius: currentRadius,
      newRadius: nextRadius,
      matchedCount: eligible.length,
      matchedVolunteers: eligible,
      message: `Expanded search radius from ${currentRadius} km to ${nextRadius} km. Found ${eligible.length} volunteer(s).`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
