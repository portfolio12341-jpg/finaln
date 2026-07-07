import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/auth';

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const sessionToken = req.cookies.get('nency_session')?.value;
  if (!sessionToken) return false;
  const payload = await verifyToken(sessionToken);
  return payload !== null && payload.role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Sanitize file name to avoid directory traversal
    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.svg', '.webp', '.mp4', '.webm', '.ogg', '.mov'];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanName = `${baseName}-${Date.now()}${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch {}

    const filePath = path.join(uploadsDir, cleanName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${cleanName}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}
