import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.title || !data.cardId) {
      return NextResponse.json({ error: "Missing title or cardId" }, { status: 400 });
    }

    const newSubtask = await prisma.subtask.create({
      data: {
        title: data.title,
        cardId: data.cardId,
        isDone: false
      }
    });

    return NextResponse.json({ success: true, subtask: newSubtask }, { status: 201 });
  } catch (error) {
    console.error("API Error [POST Subtask]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
