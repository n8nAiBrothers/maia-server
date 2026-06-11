import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.title || !data.listId) {
      return NextResponse.json({ error: "Missing title or listId" }, { status: 400 });
    }

    const newCard = await prisma.card.create({
      data: {
        title: data.title,
        description: data.description || "",
        priority: data.priority || "Medium",
        assignee: data.assignee || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        listId: data.listId,
        status: data.status || "Standby",
        history: [{ date: new Date().toISOString(), text: "Tarefa criada" }]
      }
    });

    return NextResponse.json({ success: true, card: newCard }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      include: { list: true }
    });
    return NextResponse.json({ success: true, cards }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: "Missing task id" }, { status: 400 });
    }

    // Fetch existing to append history
    const existing = await prisma.card.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let newHistory = (existing?.history as any[]) || [];
    if (data.historyLog) {
      newHistory = [...newHistory, { date: new Date().toISOString(), text: data.historyLog }];
    }

    // Build update object only with provided fields
    const updateData: any = {
      history: newHistory
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignee !== undefined) updateData.assignee = data.assignee;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.listId !== undefined) updateData.listId = data.listId;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedCard = await prisma.card.update({
      where: { id: data.id },
      data: updateData
    });

    return NextResponse.json({ success: true, card: updatedCard }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
