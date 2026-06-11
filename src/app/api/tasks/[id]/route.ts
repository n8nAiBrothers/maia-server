import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing task id" }, { status: 400 });
    }

    // Delete the task. Subtasks are cascade deleted by Prisma if configured,
    // or we can manually delete them first if Prisma schema is not configured with cascade on subtasks.
    // Wait, in schema.prisma we have: @relation(..., onDelete: Cascade)
    
    await prisma.card.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("API Error [DELETE Task]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
