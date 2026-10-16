import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedData';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Seed API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Seeding failed' }, { status: 500 });
  }
}
