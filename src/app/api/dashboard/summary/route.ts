import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/dashboard/summary — Dados agregados para o dashboard principal
export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Tokens consumidos hoje (todos os deliverables)
    const logsToday = await prisma.tokenUsageLog.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalTokens: true, estimatedCostBrl: true },
      _count: true,
    });

    // 2. Tokens consumidos no mês
    const logsMonth = await prisma.tokenUsageLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, estimatedCostBrl: true },
      _count: true,
    });

    // 3. Deliverables ativos (com atividade nas últimas 24h)
    const activeLast24h = await prisma.deliverable.count({
      where: {
        lastActiveAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        status: 'active',
      },
    });

    const totalDeliverables = await prisma.deliverable.count({
      where: { status: { not: 'archived' } },
    });

    // 4. Próximas renovações
    const subscriptions = await prisma.llmSubscription.findMany({
      where: { status: 'active', isLocal: false },
    });

    const renewals = subscriptions.map((s: any) => {
      let daysUntil = 0;
      if (s.renewalDay) {
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), s.renewalDay);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, s.renewalDay);
        const renewalDate = thisMonth > now ? thisMonth : nextMonth;
        daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      return {
        provider: s.provider,
        planName: s.planName,
        renewalDay: s.renewalDay,
        daysUntilRenewal: daysUntil,
        monthlyCost: s.monthlyCost,
      };
    }).sort((a: any, b: any) => a.daysUntilRenewal - b.daysUntilRenewal);

    // 5. Ranking de consumo por membro
    const members = await prisma.member.findMany({
      where: { isActive: true },
      include: {
        quota: true,
        deliverables: {
          where: { status: { not: 'archived' } },
          select: { id: true, category: true, name: true, totalTokensUsed: true, totalCostBrl: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const ranking = members
      .map((m: any) => {
        const totalTokens = m.deliverables.reduce((s: any, d: any) => s + Number(d.totalTokensUsed), 0);
        const totalCost = m.deliverables.reduce((s: any, d: any) => s + d.totalCostBrl, 0);
        const activeDeliverables = m.deliverables.filter((d: any) => d.status === 'active').length;

        return {
          memberId: m.id,
          memberName: m.name,
          roles: m.roles,
          tier: m.tier,
          totalTokens,
          totalCost: Math.round(totalCost * 100) / 100,
          activeDeliverables,
          totalDeliverables: m.deliverables.length,
          quota: m.quota
            ? {
                limit: Number(m.quota.monthlyTokenLimit),
                used: Number(m.quota.monthlyTokensUsed),
                percentage: Math.round(
                  (Number(m.quota.monthlyTokensUsed) / Number(m.quota.monthlyTokenLimit)) * 100
                ),
              }
            : null,
          deliverablesByCategory: m.deliverables.reduce((acc: Record<string, number>, d: any) => {
            acc[d.category] = (acc[d.category] || 0) + 1;
            return acc;
          }, {}),
        };
      })
      .sort((a: any, b: any) => b.totalTokens - a.totalTokens);

    // 6. Balanço financeiro rápido
    const currentMonth = now.toISOString().slice(0, 7);
    const contributions = await prisma.memberContribution.aggregate({
      where: { referenceMonth: currentMonth },
      _sum: { amount: true },
      _count: true,
    });
    const expenses = await prisma.platformExpense.findMany({
      where: { status: 'active', billingCycle: 'monthly' },
    });
    const totalExpenses = expenses.reduce((s: any, e: any) => s + e.amount, 0);
    const totalRevenue = contributions._sum.amount || 0;

    return NextResponse.json({
      success: true,
      kpis: {
        tokensToday: logsToday._sum.totalTokens || 0,
        costToday: Math.round((logsToday._sum.estimatedCostBrl || 0) * 100) / 100,
        tokensMonth: logsMonth._sum.totalTokens || 0,
        costMonth: Math.round((logsMonth._sum.estimatedCostBrl || 0) * 100) / 100,
        activeLast24h,
        totalDeliverables,
        sessionsToday: logsToday._count,
      },
      renewals,
      ranking,
      financeiro: {
        receita: totalRevenue,
        despesa: Math.round(totalExpenses * 100) / 100,
        saldo: Math.round((totalRevenue - totalExpenses) * 100) / 100,
        margem: totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
