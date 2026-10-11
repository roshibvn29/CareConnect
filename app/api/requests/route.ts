import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { generateConfirmationCode, runMatchingStep } from '@/lib/matching';
import { RequestCategory } from '@/types';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['requester', 'coordinator']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { category, description, preferredDate, preferredTime, address, latitude, longitude } = body;

    if (!category || !description || !preferredDate || !preferredTime || !address) {
      return NextResponse.json(
        { success: false, error: 'Category, description, preferred date, time, and address are required.' },
        { status: 400 }
      );
    }

    const lat = typeof latitude === 'number' ? latitude : 12.9716;
    const lon = typeof longitude === 'number' ? longitude : 77.5946;

    const confirmationCode = generateConfirmationCode();

    const newRequest = await db.assistanceRequests.create({
      requesterId: auth.user.id,
      category: category as RequestCategory,
      description: description.trim(),
      preferredDate,
      preferredTime,
      location: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      address: address.trim(),
      status: 'PENDING',
      currentSearchRadius: 2, // starts at 2km
      notifiedVolunteers: [],
      declinedVolunteers: [],
      assignedVolunteerId: null,
      confirmationCode,
    });

    // Run first matching step automatically!
    const matchResult = await runMatchingStep(newRequest._id.toString());

    return NextResponse.json({
      success: true,
      message: 'Assistance request created successfully.',
      request: newRequest,
      matchResult,
    });
  } catch (error: any) {
    console.error('Create request error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while creating request.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const myRequestsOnly = searchParams.get('my') === 'true';

    const query: any = {};

    if (auth.user.role === 'requester' || myRequestsOnly) {
      query.requesterId = auth.user.id;
    }

    if (status) {
      query.status = status;
    }

    const requests = await db.assistanceRequests.find(query);

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
