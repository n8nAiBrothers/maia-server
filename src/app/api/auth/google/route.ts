import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('maia_session')?.value;
  
  if (!sessionToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const member = await prisma.member.findUnique({ where: { accessHash: sessionToken } });
  if (!member) {
    return NextResponse.json({ error: 'Membro não encontrado' }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive',
    'https://mail.google.com/'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: member.id // Passamos o memberId para recuperar no callback
  });

  return NextResponse.redirect(url);
}
