import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title || !data.boardId) return NextResponse.json({ error: "Missing title or boardId" }, { status: 400 });

    const newList = await prisma.list.create({
      data: {
        title: data.title,
        boardId: data.boardId,
        order: data.order || 99,
        id: `list_${Date.now()}` // explicit id to match previous pattern
      }
    });

    return NextResponse.json({ success: true, list: newList }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    if (!data.id || !data.title) return NextResponse.json({ error: "Missing id or title" }, { status: 400 });

    const updatedList = await prisma.list.update({
      where: { id: data.id },
      data: { title: data.title }
    });

    return NextResponse.json({ success: true, list: updatedList }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
