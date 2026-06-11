import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { cookies } from 'next/headers';

async function checkController() {
  const sessionToken = (await cookies()).get('maia_session')?.value;
  if (!sessionToken) return false;
  const member = await prisma.member.findUnique({ where: { accessHash: sessionToken } });
  return member?.canViewFinancials ?? false;
}

export async function POST(req: NextRequest) {
  if (!(await checkController())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  try {
    const data = await req.json();
    const expense = await prisma.platformExpense.create({
      data: {
        name: data.name,
        provider: data.provider,
        category: data.category,
        amount: Number(data.amount),
        billingCycle: data.billingCycle,
        contractType: data.contractType || 'continuous',
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        renewalDay: data.startDate ? new Date(data.startDate).getUTCDate() : undefined,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        cancelDeadline: data.cancelDeadline ? new Date(data.cancelDeadline) : null,
      }
    });
    return NextResponse.json(expense);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await checkController())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    await prisma.platformExpense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await checkController())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const expense = await prisma.platformExpense.update({
      where: { id },
      data: {
        name: updateData.name,
        provider: updateData.provider,
        category: updateData.category,
        amount: Number(updateData.amount),
        billingCycle: updateData.billingCycle,
        contractType: updateData.contractType,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        renewalDay: updateData.startDate ? new Date(updateData.startDate).getUTCDate() : undefined,
        contractEndDate: updateData.contractEndDate ? new Date(updateData.contractEndDate) : null,
        cancelDeadline: updateData.cancelDeadline ? new Date(updateData.cancelDeadline) : null,
      }
    });
    return NextResponse.json(expense);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
