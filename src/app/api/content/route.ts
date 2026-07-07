import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper to authenticate request
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const sessionToken = req.cookies.get('nency_session')?.value;
  if (!sessionToken) return false;
  const payload = await verifyToken(sessionToken);
  return payload !== null && payload.role === 'admin';
}

export async function GET() {
  try {
    const db = await getDb();
    // Return db content (except message credentials or sensitive details if any, but since it's personal and local, everything is safe)
    return NextResponse.json(db);
  } catch (error: any) {
    console.error('Error fetching database:', error);
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedData = await req.json();
    if (!updatedData) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    // Save updated data
    await saveDb(updatedData);

    return NextResponse.json({ success: true, message: 'Changes published instantly!' });
  } catch (error: any) {
    console.error('Error updating database:', error);
    return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 });
  }
}
