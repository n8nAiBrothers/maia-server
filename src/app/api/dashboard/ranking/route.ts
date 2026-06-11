import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/dashboard/ranking — Ranking de consumo por membro (com gráficos)
export async function GET(request: Request) {
  try {
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
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Buscar todos os logs do período
    const logs = await prisma.tokenUsageLog.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        deliverable: {
          select: { ownerId: true, name: true, category: true },
        },
      },
    });

    // Agregar por membro
    const byMember: Record<string, {
      tokens: number;
      cost: number;
      sessions: number;
      byDeliverable: Record<string, { name: string; category: string; tokens: number; cost: number }>;
      byDay: Record<string, { tokens: number; cost: number }>;
      byModel: Record<string, number>;
    }> = {};

    for (const log of logs) {
      const memberId = log.deliverable.ownerId;
      if (!byMember[memberId]) {
        byMember[memberId] = { tokens: 0, cost: 0, sessions: 0, byDeliverable: {}, byDay: {}, byModel: {} };
      }
      const m = byMember[memberId];
      m.tokens += log.totalTokens;
      m.cost += log.estimatedCostBrl;
      m.sessions += 1;

      // Por deliverable
      if (!m.byDeliverable[log.deliverableId]) {
        m.byDeliverable[log.deliverableId] = {
          name: log.deliverable.name,
          category: log.deliverable.category,
          tokens: 0,
          cost: 0,
        };
      }
      m.byDeliverable[log.deliverableId].tokens += log.totalTokens;
      m.byDeliverable[log.deliverableId].cost += log.estimatedCostBrl;

      // Por dia
      const day = log.createdAt.toISOString().split('T')[0];
      if (!m.byDay[day]) m.byDay[day] = { tokens: 0, cost: 0 };
      m.byDay[day].tokens += log.totalTokens;
      m.byDay[day].cost += log.estimatedCostBrl;

      // Por modelo
      m.byModel[log.model] = (m.byModel[log.model] || 0) + log.totalTokens;
    }

    // Buscar nomes dos membros
    const memberIds = Object.keys(byMember);
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, tier: true, roles: true },
    });

    const memberMap = new Map<string, any>(members.map((m: any) => [m.id, m]));

    const ranking = Object.entries(byMember)
      .map(([memberId, data]) => ({
        memberId,
        memberName: memberMap.get(memberId)?.name || 'Desconhecido',
        tier: memberMap.get(memberId)?.tier || 'standard',
        roles: memberMap.get(memberId)?.roles || [],
        totalTokens: data.tokens,
        totalCost: Math.round(data.cost * 100) / 100,
        totalSessions: data.sessions,
        topDeliverables: Object.values(data.byDeliverable)
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 5),
        dailyChart: Object.entries(data.byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, d]) => ({ date, tokens: d.tokens, cost: Math.round(d.cost * 100) / 100 })),
        modelBreakdown: data.byModel,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    return NextResponse.json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      ranking,
      totals: {
        tokens: ranking.reduce((s, r) => s + r.totalTokens, 0),
        cost: Math.round(ranking.reduce((s, r) => s + r.totalCost, 0) * 100) / 100,
        sessions: ranking.reduce((s, r) => s + r.totalSessions, 0),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
