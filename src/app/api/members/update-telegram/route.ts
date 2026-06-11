import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('maia_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { telegramHandle } = body;

    if (!telegramHandle) {
      return NextResponse.json({ error: 'Telegram handle é obrigatório' }, { status: 400 });
    }

    const member = await prisma.member.update({
      where: { accessHash: sessionToken },
      data: { 
        telegramHandle: telegramHandle.startsWith('@') ? telegramHandle : `@${telegramHandle}` 
      }
    });

    return NextResponse.json({ success: true, member });

  } catch (error) {
    console.error('Update Telegram Error:', error);
    return NextResponse.json({ error: 'Falha ao atualizar o perfil' }, { status: 500 });
  }
}
