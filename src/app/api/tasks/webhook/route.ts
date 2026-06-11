import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// POST /api/tasks/webhook — Webhook para agentes e n8n
// Permite criar tasks, completar tasks, e mover tasks entre listas
//
// Ações:
//   action: "create"   → Cria nova task no Kanban
//   action: "complete" → Move task para "Finalizado"
//   action: "update"   → Atualiza status/descrição
//   action: "move"     → Move para outra lista
//
// Auth: via header X-Agent-Key ou X-Member-Id
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const agentName = request.headers.get('X-Agent-Name') || 'Agente Desconhecido';
    const memberId = request.headers.get('X-Member-Id') || null;

    const action = data.action || 'create';

    switch (action) {

      // ============ CRIAR TASK ============
      case 'create': {
        if (!data.title) {
          return NextResponse.json({ error: 'Missing title' }, { status: 400 });
        }

        // Encontrar a lista alvo (por nome ou ID)
        let listId = data.listId;
        if (!listId && data.listName) {
          const list = await prisma.list.findFirst({
            where: { title: { contains: data.listName, mode: 'insensitive' } },
          });
          listId = list?.id;
        }
        // Fallback: primeira lista (Backlog)
        if (!listId) {
          const firstList = await prisma.list.findFirst({ orderBy: { order: 'asc' } });
          listId = firstList?.id;
        }
        if (!listId) {
          return NextResponse.json({ error: 'No list found' }, { status: 400 });
        }

        // Resolver assignee pelo memberId ou nome
        let assignee = data.assignee || null;
        if (!assignee && memberId) {
          const member = await prisma.member.findUnique({
            where: { id: memberId },
            select: { name: true },
          });
          assignee = member?.name.split(' ')[0] || null;
        }

        const card = await prisma.card.create({
          data: {
            title: data.title,
            description: data.description || '',
            priority: data.priority || 'Medium',
            assignee,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            listId,
            status: data.status || 'Standby',
            history: [{
              date: new Date().toISOString(),
              text: `Criado via webhook por ${agentName}`,
              agent: agentName,
              source: 'webhook',
            }],
          },
          include: { list: { select: { title: true } } },
        });

        return NextResponse.json({
          success: true,
          action: 'created',
          card: { id: card.id, title: card.title, list: card.list.title, status: card.status },
          message: `Task "${card.title}" criada em "${card.list.title}" por ${agentName}`,
        }, { status: 201 });
      }

      // ============ COMPLETAR TASK ============
      case 'complete': {
        const card = await findCard(data);
        if (!card) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Encontrar a lista "Finalizado" / "Done" / "Concluído"
        let doneList = await prisma.list.findFirst({
          where: {
            title: { in: ['Finalizado', 'Done', 'Concluído', 'Completed'] },
          },
        });
        // Fallback: última lista
        if (!doneList) {
          doneList = await prisma.list.findFirst({ orderBy: { order: 'desc' } });
        }

        const existingHistory = (card.history as any[]) || [];
        const updatedCard = await prisma.card.update({
          where: { id: card.id },
          data: {
            status: 'Finalizado',
            listId: doneList?.id || card.listId,
            history: [
              ...existingHistory,
              {
                date: new Date().toISOString(),
                text: data.summary || `Concluído por ${agentName}`,
                agent: agentName,
                source: 'webhook',
                result: data.result || null,
              },
            ],
          },
          include: { list: { select: { title: true } } },
        });

        return NextResponse.json({
          success: true,
          action: 'completed',
          card: { id: updatedCard.id, title: updatedCard.title, list: updatedCard.list.title, status: updatedCard.status },
          message: `Task "${updatedCard.title}" marcada como Finalizado por ${agentName}`,
        });
      }

      // ============ ATUALIZAR TASK ============
      case 'update': {
        const card = await findCard(data);
        if (!card) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const existingHistory = (card.history as any[]) || [];
        const updateData: any = {
          history: [
            ...existingHistory,
            {
              date: new Date().toISOString(),
              text: data.historyLog || `Atualizado por ${agentName}`,
              agent: agentName,
              source: 'webhook',
            },
          ],
        };

        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.priority) updateData.priority = data.priority;
        if (data.status) updateData.status = data.status;
        if (data.assignee) updateData.assignee = data.assignee;

        // Se mudou para "Em Andamento"
        if (data.status === 'Em Andamento') {
          const inProgressList = await prisma.list.findFirst({
            where: { title: { in: ['Em Andamento', 'In Progress', 'Doing'] } },
          });
          if (inProgressList) updateData.listId = inProgressList.id;
        }

        const updatedCard = await prisma.card.update({
          where: { id: card.id },
          data: updateData,
        });

        return NextResponse.json({
          success: true,
          action: 'updated',
          card: { id: updatedCard.id, title: updatedCard.title, status: updatedCard.status },
        });
      }

      // ============ MOVER TASK ============
      case 'move': {
        const card = await findCard(data);
        if (!card) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        let targetListId = data.targetListId;
        if (!targetListId && data.targetListName) {
          const list = await prisma.list.findFirst({
            where: { title: { contains: data.targetListName, mode: 'insensitive' } },
          });
          targetListId = list?.id;
        }
        if (!targetListId) {
          return NextResponse.json({ error: 'Target list not found' }, { status: 400 });
        }

        const existingHistory = (card.history as any[]) || [];
        const movedCard = await prisma.card.update({
          where: { id: card.id },
          data: {
            listId: targetListId,
            history: [
              ...existingHistory,
              {
                date: new Date().toISOString(),
                text: `Movido para "${data.targetListName || 'nova lista'}" por ${agentName}`,
                agent: agentName,
                source: 'webhook',
              },
            ],
          },
          include: { list: { select: { title: true } } },
        });

        return NextResponse.json({
          success: true,
          action: 'moved',
          card: { id: movedCard.id, title: movedCard.title, list: movedCard.list.title },
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Use: create, complete, update, move` }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper: encontrar card por id ou título
async function findCard(data: any) {
  if (data.taskId) {
    return prisma.card.findUnique({ where: { id: data.taskId } });
  }
  if (data.taskTitle) {
    return prisma.card.findFirst({
      where: { title: { contains: data.taskTitle, mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
    });
  }
  return null;
}

// GET /api/tasks/webhook — Documentação do webhook
export async function GET() {
  return NextResponse.json({
    webhook: '/api/tasks/webhook',
    methods: ['POST'],
    description: 'Webhook para agentes e n8n criarem/completarem tasks no CRM Kanban',
    headers: {
      'X-Agent-Name': '(recomendado) Nome do agente que está chamando',
      'X-Member-Id': '(opcional) ID do membro dono do agente',
    },
    actions: {
      create: {
        description: 'Criar nova task',
        required: ['title'],
        optional: ['description', 'priority', 'assignee', 'dueDate', 'listName', 'listId', 'status'],
        example: { action: 'create', title: 'Deploy v2.0', listName: 'Backlog', priority: 'High' },
      },
      complete: {
        description: 'Marcar task como Finalizado',
        required: ['taskId ou taskTitle'],
        optional: ['summary', 'result'],
        example: { action: 'complete', taskTitle: 'Deploy v2.0', summary: 'Deploy realizado com sucesso em produção' },
      },
      update: {
        description: 'Atualizar task (status, descrição, etc)',
        required: ['taskId ou taskTitle'],
        optional: ['title', 'description', 'priority', 'status', 'assignee', 'historyLog'],
        example: { action: 'update', taskTitle: 'Deploy v2.0', status: 'Em Andamento', historyLog: 'Build iniciado' },
      },
      move: {
        description: 'Mover task para outra lista',
        required: ['taskId ou taskTitle', 'targetListName ou targetListId'],
        example: { action: 'move', taskTitle: 'Deploy v2.0', targetListName: 'Em Andamento' },
      },
    },
  });
}
