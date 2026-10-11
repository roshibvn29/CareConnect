import { NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    const seedScript = path.join(process.cwd(), 'scripts', 'seed.ts');
    await execPromise(`npx tsx "${seedScript}"`, { cwd: process.cwd() });
    return NextResponse.json({
      success: true,
      message: 'Database successfully seeded with demo coordinators, requesters, volunteers, requests, and KYC files!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
