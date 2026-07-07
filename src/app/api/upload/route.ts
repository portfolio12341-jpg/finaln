import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/auth';
import sharp from 'sharp';

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
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch {}

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let cleanName = '';
    let finalBuffer: Buffer;

    if (isImage) {
      cleanName = `${baseName}-${Date.now()}.webp`;
      try {
        let quality = 80;
        const sharpImg = sharp(buffer);
        const metadata = await sharpImg.metadata();
        const width = metadata.width || 1200;
        
        if (width > 1200) {
          finalBuffer = await sharpImg
            .resize(1200)
            .webp({ quality })
            .toBuffer();
        } else {
          finalBuffer = await sharpImg
            .webp({ quality })
            .toBuffer();
        }
        
        // If still over 200KB, downscale more
        if (finalBuffer.length > 200 * 1024) {
          finalBuffer = await sharp(buffer)
            .resize(width > 900 ? 900 : width)
            .webp({ quality: 60 })
            .toBuffer();
        }
      } catch (err) {
        console.warn("Server-side image compression fallback failed, writing original:", err);
        finalBuffer = buffer;
        cleanName = `${baseName}-${Date.now()}${ext}`;
      }
    } else {
      cleanName = `${baseName}-${Date.now()}${ext}`;
      finalBuffer = buffer;
    }

    const filePath = path.join(uploadsDir, cleanName);
    await fs.writeFile(filePath, finalBuffer);

    const fileUrl = `/uploads/${cleanName}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}
