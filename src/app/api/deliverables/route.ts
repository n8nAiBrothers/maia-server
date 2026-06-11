import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/deliverables — Listar todos os deliverables
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const ownerId = searchParams.get('ownerId');
    const projectName = searchParams.get('projectName');
    const status = searchParams.get('status');

    const where: any = {};
    if (category) where.category = category;
    if (ownerId) where.ownerId = ownerId;
    if (projectName) where.projectName = projectName;
    if (status) where.status = status;

    const deliverables = await prisma.deliverable.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatar: true, roles: true } },
        _count: { select: { usageLogs: true, schedules: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Serialize BigInt fields
    const serialized = deliverables.map((d: any) => ({
      ...d,
      totalTokensUsed: Number(d.totalTokensUsed),
    }));

    return NextResponse.json({ success: true, deliverables: serialized });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/deliverables — Registrar novo deliverable
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.name || !data.ownerId || !data.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ownerId, category' },
        { status: 400 }
      );
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        category: data.category,
        description: data.description || null,
        agentType: data.agentType || null,
        platform: data.platform || null,
        defaultModel: data.defaultModel || null,
        defaultLlm: data.defaultLlm || 'auto',
        repoUrl: data.repoUrl || null,
        deployUrl: data.deployUrl || null,
        techStack: data.techStack || [],
        projectName: data.projectName || null,
        configJson: data.configJson || null,
        status: data.status || 'active',
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, deliverable: { ...deliverable, totalTokensUsed: Number(deliverable.totalTokensUsed) } },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
