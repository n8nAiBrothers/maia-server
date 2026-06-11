import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { cookies } from 'next/headers';

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

    // Apenas controllers (canViewFinancials) podem aprovar pagamentos
    if (!member || !member.canViewFinancials) {
      return NextResponse.json({ error: 'Acesso negado: Requer privilégios de Controller' }, { status: 403 });
    }

    const body = await req.json();
    const { contributionId, action } = body;

    if (!contributionId || !action) {
      return NextResponse.json({ error: 'Contribution ID e Action são obrigatórios' }, { status: 400 });
    }

    let updatedContribution;

    if (action === 'approve') {
      updatedContribution = await prisma.memberContribution.update({
        where: { id: contributionId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });
    } else if (action === 'reject') {
      updatedContribution = await prisma.memberContribution.update({
        where: { id: contributionId },
        data: {
          status: 'pending',
          receiptUrl: null, // Limpa o comprovante inválido
        },
      });
    } else if (action === 'force_approve') {
      updatedContribution = await prisma.memberContribution.update({
        where: { id: contributionId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod: 'direto', // indica que foi baixa manual
        },
      });
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    return NextResponse.json({ success: true, contribution: updatedContribution });
  } catch (error: any) {
    console.error('Approval Error:', error);
    return NextResponse.json({ error: 'Falha ao processar a ação' }, { status: 500 });
  }
}
