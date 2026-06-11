import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/deliverables/[id] — Detalhes de um deliverable
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true, roles: true, tier: true } },
        usageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { subscription: { select: { provider: true, planName: true } } },
        },
        schedules: true,
        _count: { select: { usageLogs: true } },
      },
    });

    if (!deliverable) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deliverable: { ...deliverable, totalTokensUsed: Number(deliverable.totalTokensUsed) },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/deliverables/[id] — Atualizar deliverable
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: any = {};
    const fields = [
      'name', 'description', 'category', 'agentType', 'platform',
      'defaultModel', 'defaultLlm', 'repoUrl', 'deployUrl', 'techStack',
      'projectName', 'configJson', 'status',
    ];
    for (const field of fields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    if (data.lastActiveAt) updateData.lastActiveAt = new Date(data.lastActiveAt);

    const updated = await prisma.deliverable.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      deliverable: { ...updated, totalTokensUsed: Number(updated.totalTokensUsed) },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/deliverables/[id] — Arquivar deliverable
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const archived = await prisma.deliverable.update({
      where: { id },
      data: { status: 'archived' },
    });

    return NextResponse.json({ success: true, deliverable: { id: archived.id, status: archived.status } });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
