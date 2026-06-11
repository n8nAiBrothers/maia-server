import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

type Params = { params: Promise<{ memberId: string }> };

// GET /api/quotas/[memberId] — Consultar quota de um membro
export async function GET(request: Request, { params }: Params) {
  try {
    const { memberId } = await params;
    const quota = await prisma.memberQuota.findUnique({
      where: { memberId },
      include: { member: { select: { id: true, name: true, tier: true, roles: true } } },
    });

    if (!quota) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quota: {
        ...quota,
        monthlyTokenLimit: Number(quota.monthlyTokenLimit),
        monthlyTokensUsed: Number(quota.monthlyTokensUsed),
        percentage: Math.round((Number(quota.monthlyTokensUsed) / Number(quota.monthlyTokenLimit)) * 100),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/quotas/[memberId] — Alterar quota de um membro
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { memberId } = await params;
    const data = await request.json();

    const updateData: any = {};
    if (data.monthlyTokenLimit !== undefined) updateData.monthlyTokenLimit = BigInt(data.monthlyTokenLimit);
    if (data.monthlyCostLimit !== undefined) updateData.monthlyCostLimit = data.monthlyCostLimit;
    if (data.overagePolicy !== undefined) updateData.overagePolicy = data.overagePolicy;
    if (data.overageRateBrl !== undefined) updateData.overageRateBrl = data.overageRateBrl;
    if (data.tier !== undefined) updateData.tier = data.tier;

    const updated = await prisma.memberQuota.update({
      where: { memberId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      quota: {
        ...updated,
        monthlyTokenLimit: Number(updated.monthlyTokenLimit),
        monthlyTokensUsed: Number(updated.monthlyTokensUsed),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
