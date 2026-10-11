import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { saveKycDocument } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['volunteer']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get('document') as File | null;
    const documentType = formData.get('documentType') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Identity document file is required.' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ success: false, error: 'Document type is required (e.g. Aadhaar, Driving License, Passport, Voter ID).' }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save securely
    const saved = await saveKycDocument(buffer, file.name, file.type);

    // Update volunteer profile
    const updatedProfile = await db.volunteerProfiles.updateByUserId(auth.user.id, {
      kycStatus: 'PENDING_KYC',
      kycDocumentUrl: saved.secureEndpointUrl,
      kycDocumentType: documentType,
      kycSubmittedAt: new Date().toISOString(),
      kycRejectionReason: undefined,
    });

    // Notify coordinators
    const coordinators = await db.users.find({ role: 'coordinator' });
    for (const coord of coordinators) {
      await db.notifications.create({
        userId: coord._id.toString(),
        title: 'New KYC Document Submitted',
        message: `Volunteer ${auth.user.name} submitted a ${documentType} for review.`,
        type: 'kyc_update',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'KYC document submitted successfully and is awaiting coordinator review.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('KYC submit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
