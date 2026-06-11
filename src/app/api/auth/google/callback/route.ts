import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import prisma from '../../../../../lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const memberId = url.searchParams.get('state');

  if (!code || !memberId) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    let expiryDate = null;
    if (tokens.expiry_date) {
        expiryDate = new Date(tokens.expiry_date);
    }

    // Salva ou atualiza a integração
    await prisma.memberIntegration.upsert({
      where: {
        memberId_provider: {
          memberId: memberId,
          provider: 'google'
        }
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiryDate: expiryDate,
        scope: tokens.scope
      },
      create: {
        memberId: memberId,
        provider: 'google',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiryDate: expiryDate,
        scope: tokens.scope
      }
    });

    return NextResponse.redirect(new URL('/dashboard', req.url));

  } catch (error) {
    console.error('Error during Google Auth Callback:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
  }
}
