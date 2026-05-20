import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db';

export async function GET() {
  try {
    await setupDatabase();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
