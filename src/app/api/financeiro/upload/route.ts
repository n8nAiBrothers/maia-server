import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { cookies } from 'next/headers';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('maia_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { accessHash: sessionToken },
    });

    if (!member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('receipt') as File | null;
    const contributionId = formData.get('contributionId') as string;

    if (!file || !contributionId) {
      return NextResponse.json({ error: 'Arquivo e Contribution ID são obrigatórios' }, { status: 400 });
    }

    // Verify contribution ownership
    const contribution = await prisma.memberContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution || contribution.memberId !== member.id) {
      return NextResponse.json({ error: 'Contribuição inválida' }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save File
    const uploadsDir = path.join(process.cwd(), 'public/uploads/receipts');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Sanitize filename and add timestamp
    const extension = path.extname(file.name);
    const filename = `receipt_${member.id}_${contribution.referenceMonth}_${Date.now()}${extension}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    // Update Database
    await prisma.memberContribution.update({
      where: { id: contributionId },
      data: {
        receiptUrl: `/api/uploads/receipts/${filename}`,
        status: 'under_review',
        paymentMethod: 'pix',
      },
    });

    // Notify admins via Telegram
    try {
      const admins = await prisma.member.findMany({
        where: {
          telegramChatId: { not: null },
          OR: [
            { roles: { has: 'controller' } },
            { roles: { has: 'founder' } }
          ]
        }
      });

      const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/crm-notifica-telegram';
      const APP_URL = process.env.APP_URL || 'https://crm.waia88.com';
      
      const notifyPromises = admins.map((admin: any) => {
        if (!admin.telegramChatId) return Promise.resolve();
        
        const loginLink = `${APP_URL}/api/auth/login?token=${admin.accessHash}`;
        
        return fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: admin.telegramChatId,
            message: `💰 *Novo Pagamento Recebido!*\n\nO membro *${member.name}* enviou o comprovante referente a ${contribution.referenceMonth}.\n\n🔗 *Acesse o CRM para aprovar:* \n${loginLink}`
          })
        }).catch(e => console.error('Error notifying admin:', e));
      });
      await Promise.allSettled(notifyPromises);
    } catch (notifyErr) {
      console.error('Falha ao notificar admins no Telegram:', notifyErr);
    }

    return NextResponse.json({ success: true, receiptUrl: `/api/uploads/receipts/${filename}` });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Falha no processamento do comprovante' }, { status: 500 });
  }
}
