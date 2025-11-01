import { NextResponse } from 'next/server';
import { frappeServer } from '@/lib/frappe';

export const runtime = 'edge';

export async function POST() {
  try {
    const db = frappeServer.db();
    
    // Update the Site Config to mark that user has entered
    await db.updateDoc('Site Config', 'Site Config', {
      inauguration_splash_screen: 0
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking as entered:', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
