import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  try {
    const params = await props.params;
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...params.path);
    
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const contentType = ext === '.pdf' ? 'application/pdf' : 
                        ext === '.png' ? 'image/png' : 
                        (ext === '.jpeg' || ext === '.jpg') ? 'image/jpeg' : 
                        'application/octet-stream';
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new NextResponse('File not found', { status: 404 });
  }
}
