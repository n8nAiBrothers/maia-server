import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/projects — Listar projetos
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: { not: 'archived' } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/projects — Criar projeto
export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type || 'app',
        boardId: data.boardId || null,
        repoUrl: data.repoUrl || null,
        deployUrl: data.deployUrl || null,
        techStack: data.techStack || [],
        ownerId: data.ownerId || null,
        progress: data.progress || 0,
        status: data.status || 'active',
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/projects — Atualizar projeto
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updateData: any = {};
    const fields = ['name', 'description', 'type', 'boardId', 'repoUrl', 'deployUrl', 'techStack', 'ownerId', 'progress', 'status'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }

    const updated = await prisma.project.update({ where: { id: data.id }, data: updateData });
    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
