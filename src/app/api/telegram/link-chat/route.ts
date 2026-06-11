import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, chatId } = body;

    if (!username || !chatId) {
      return NextResponse.json({ error: 'Username and chatId are required' }, { status: 400 });
    }

    // N8N sends username without @ usually, but let's normalize
    const normalizedUsername = username.startsWith('@') ? username : `@${username}`;

    const member = await prisma.member.updateMany({
      where: { 
        telegramHandle: {
          equals: normalizedUsername,
          mode: 'insensitive' // Just in case of casing differences
        }
      },
      data: { telegramChatId: String(chatId) }
    });

    if (member.count === 0) {
      return NextResponse.json({ error: 'Member not found with this handle' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Linked ${chatId} to ${normalizedUsername}` });

  } catch (error) {
    console.error('Link Telegram Chat ID Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
