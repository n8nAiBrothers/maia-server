import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/financeiro/contributions — Listar contribuições
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    const where: any = {};
    if (month) where.referenceMonth = month;
    if (status) where.status = status;

    const contributions = await prisma.memberContribution.findMany({
      where,
      include: { member: { select: { id: true, name: true, roles: true } } },
      orderBy: [{ referenceMonth: 'desc' }, { member: { name: 'asc' } }],
    });

    return NextResponse.json({ success: true, contributions });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/financeiro/contributions — Criar contribuição
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.memberId || !data.referenceMonth) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, referenceMonth' },
        { status: 400 }
      );
    }

    const contribution = await prisma.memberContribution.create({
      data: {
        memberId: data.memberId,
        amount: data.amount || 200,
        referenceMonth: data.referenceMonth,
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod || null,
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
        notes: data.notes || null,
      },
      include: { member: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, contribution }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Contribuição já existe para este membro neste mês' },
        { status: 409 }
      );
    }
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/financeiro/contributions — Atualizar status de contribuição
export async function PATCH(request: Request) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status === 'paid') updateData.paidAt = data.paidAt ? new Date(data.paidAt) : new Date();

    const updated = await prisma.memberContribution.update({
      where: { id: data.id },
      data: updateData,
      include: { member: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, contribution: updated });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
