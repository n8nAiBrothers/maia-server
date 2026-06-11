import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const sessionToken = (await cookies()).get('maia_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const member = await prisma.member.findUnique({ where: { accessHash: sessionToken } });
    if (!member) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!member.telegramChatId) {
      return NextResponse.json({ 
        error: 'Telegram Chat ID não vinculado. Mande uma mensagem para @Maia_Chat_Bot primeiro.' 
      }, { status: 400 });
    }

    const body = await req.json();
    const { message } = body;

    // Disparar para o N8N (substitua pela URL local do seu n8n se for diferente de host.docker.internal ou localhost)
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/crm-notifica-telegram';
    const APP_URL = process.env.APP_URL || 'https://crm.waia88.com';
    const loginLink = `${APP_URL}/api/auth/login?token=${member.accessHash}`;

    let finalMessage = message || `🤖 Boas-vindas ao time AI Brothers, ${member.name}!\n\nEsta é a sua primeira notificação oficial pelo canal Telegram!`;
    finalMessage += `\n\n🔗 *Acesse o CRM:* \n${loginLink}`;

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: member.telegramChatId,
        message: finalMessage
      })
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Notificação enviada ao N8N!' });
    } else {
      return NextResponse.json({ error: 'Falha ao comunicar com o N8N Webhook.' }, { status: 502 });
    }

  } catch (error) {
    console.error('Telegram Send Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
