import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "Missing subtask id" }, { status: 400 });
    }

    const updatedSubtask = await prisma.subtask.update({
      where: { id },
      data: {
        isDone: data.isDone,
        title: data.title
      }
    });

    return NextResponse.json({ success: true, subtask: updatedSubtask }, { status: 200 });
  } catch (error) {
    console.error("API Error [PATCH Subtask]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing subtask id" }, { status: 400 });
    }

    await prisma.subtask.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("API Error [DELETE Subtask]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
