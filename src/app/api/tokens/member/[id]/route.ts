import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/tokens/member/[id] — Consumo total de um membro
export async function GET(request: Request, { params }: Params) {
  try {
    const { id: memberId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default: // monthly
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Buscar membro com quota
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { quota: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Buscar todos os deliverables do membro
    const deliverables = await prisma.deliverable.findMany({
      where: { ownerId: memberId },
      select: {
        id: true,
        name: true,
        category: true,
        totalTokensUsed: true,
        totalCostBrl: true,
        totalSessions: true,
        status: true,
        lastActiveAt: true,
      },
    });

    // Buscar logs do período (via deliverables do membro)
    const deliverableIds = deliverables.map((d: any) => d.id);

    const logs = await prisma.tokenUsageLog.findMany({
      where: {
        deliverableId: { in: deliverableIds },
        createdAt: { gte: startDate },
      },
      select: {
        totalTokens: true,
        estimatedCostBrl: true,
        model: true,
        usageType: true,
        createdAt: true,
        deliverableId: true,
      },
    });

    // Agregar por deliverable
    const byDeliverable: Record<string, { tokens: number; cost: number; sessions: number }> = {};
    for (const log of logs) {
      if (!byDeliverable[log.deliverableId]) {
        byDeliverable[log.deliverableId] = { tokens: 0, cost: 0, sessions: 0 };
      }
      byDeliverable[log.deliverableId].tokens += log.totalTokens;
      byDeliverable[log.deliverableId].cost += log.estimatedCostBrl;
      byDeliverable[log.deliverableId].sessions += 1;
    }

    // Agregar por dia (para gráficos)
    const byDay: Record<string, { tokens: number; cost: number }> = {};
    for (const log of logs) {
      const day = log.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { tokens: 0, cost: 0 };
      byDay[day].tokens += log.totalTokens;
      byDay[day].cost += log.estimatedCostBrl;
    }

    const periodTokens = logs.reduce((s: any, l: any) => s + l.totalTokens, 0);
    const periodCost = logs.reduce((s: any, l: any) => s + l.estimatedCostBrl, 0);

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        tier: member.tier,
        roles: member.roles,
      },
      quota: member.quota
        ? {
            limit: Number(member.quota.monthlyTokenLimit),
            used: Number(member.quota.monthlyTokensUsed),
            percentage: Math.round(
              (Number(member.quota.monthlyTokensUsed) / Number(member.quota.monthlyTokenLimit)) * 100
            ),
            costUsed: member.quota.monthlyCostUsed,
            overagePolicy: member.quota.overagePolicy,
          }
        : null,
      period,
      periodTokens,
      periodCost: Math.round(periodCost * 100) / 100,
      deliverables: deliverables.map((d: any) => ({
        ...d,
        totalTokensUsed: Number(d.totalTokensUsed),
        periodUsage: byDeliverable[d.id] || { tokens: 0, cost: 0, sessions: 0 },
      })),
      chartData: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data })),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
