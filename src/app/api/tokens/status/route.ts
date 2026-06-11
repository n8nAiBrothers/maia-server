import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/tokens/status — Saldo atual de cada assinatura LLM
export async function GET() {
  try {
    const subscriptions = await prisma.llmSubscription.findMany({
      where: { status: 'active' },
      orderBy: { provider: 'asc' },
    });

    const status = subscriptions.map((s: any) => {
      const limit = s.tokenLimit ? Number(s.tokenLimit) : null;
      const used = Number(s.tokensUsed);
      const remaining = limit ? limit - used : null;
      const percentage = limit ? Math.round((used / limit) * 100) : 0;

      // Calcular dias até renovação
      let daysUntilRenewal: number | null = null;
      if (s.renewalDay) {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), s.renewalDay);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, s.renewalDay);
        const renewalDate = thisMonth > now ? thisMonth : nextMonth;
        daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: s.id,
        provider: s.provider,
        planName: s.planName,
        isLocal: s.isLocal,
        monthlyCost: s.monthlyCost,
        tokenLimit: limit,
        tokensUsed: used,
        tokensRemaining: remaining,
        usagePercentage: percentage,
        renewalDay: s.renewalDay,
        daysUntilRenewal,
        status: s.status,
      };
    });

    return NextResponse.json({ success: true, subscriptions: status });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
