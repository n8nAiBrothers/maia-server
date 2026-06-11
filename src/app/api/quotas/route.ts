import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/quotas — Listar quotas de todos os membros
export async function GET() {
  try {
    const quotas = await prisma.memberQuota.findMany({
      include: {
        member: { select: { id: true, name: true, tier: true, roles: true, isActive: true } },
      },
      orderBy: { monthlyTokensUsed: 'desc' },
    });

    const serialized = quotas.map((q: any) => ({
      id: q.id,
      member: q.member,
      monthlyTokenLimit: Number(q.monthlyTokenLimit),
      monthlyTokensUsed: Number(q.monthlyTokensUsed),
      percentage: Math.round((Number(q.monthlyTokensUsed) / Number(q.monthlyTokenLimit)) * 100),
      monthlyCostUsed: q.monthlyCostUsed,
      overagePolicy: q.overagePolicy,
      tier: q.tier,
      alertAt50: q.alertAt50,
      alertAt80: q.alertAt80,
      alertAt100: q.alertAt100,
      cycleEndDate: q.cycleEndDate,
    }));

    return NextResponse.json({ success: true, quotas: serialized });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
