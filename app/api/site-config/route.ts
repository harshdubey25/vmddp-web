import { NextResponse } from 'next/server';
import { frappeServer } from '@/lib/frappe';

export const runtime = 'edge';

export async function GET() {
  try {
    const db = frappeServer.db();
    const result = await db.getDoc('Site Config', 'Site Config');
    
    return NextResponse.json({
      showSplash: result.inauguration_splash_screen === 1,
      inaugurationDate: result.inauguration_date || null
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    // Fallback to not showing splash screen on error
    return NextResponse.json({ showSplash: false, inaugurationDate: null });
  }
}