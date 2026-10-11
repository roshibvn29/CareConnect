import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { runMatchingStep } from '@/lib/matching';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ success: false, error: 'requestId is required' }, { status: 400 });
    }

    const result = await runMatchingStep(requestId);
    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
