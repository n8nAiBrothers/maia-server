import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/schedule — Listar agendamentos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const deliverableId = searchParams.get('deliverableId');

    const where: any = {};
    if (status) where.status = status;
    if (deliverableId) where.deliverableId = deliverableId;

    const schedules = await prisma.agentSchedule.findMany({
      where,
      include: {
        deliverable: {
          select: { id: true, name: true, category: true, owner: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/schedule — Criar agendamento
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.deliverableId || !data.title) {
      return NextResponse.json(
        { error: 'Missing required fields: deliverableId, title' },
        { status: 400 }
      );
    }

    const schedule = await prisma.agentSchedule.create({
      data: {
        deliverableId: data.deliverableId,
        title: data.title,
        description: data.description || null,
        cronExpression: data.cronExpression || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        preferredLlm: data.preferredLlm || 'auto',
        priority: data.priority || 'normal',
        status: 'pending',
        estimatedTokens: data.estimatedTokens || null,
      },
    });

    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/schedule — Atualizar agendamento
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updateData: any = {};
    const fields = ['title', 'description', 'cronExpression', 'preferredLlm', 'priority', 'status', 'estimatedTokens'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.lastRunAt) updateData.lastRunAt = new Date(data.lastRunAt);
    if (data.nextRunAt) updateData.nextRunAt = new Date(data.nextRunAt);

    const updated = await prisma.agentSchedule.update({ where: { id: data.id }, data: updateData });
    return NextResponse.json({ success: true, schedule: updated });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/schedule — Remover agendamento
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.agentSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
