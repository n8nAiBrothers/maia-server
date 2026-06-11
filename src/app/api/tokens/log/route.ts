import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// POST /api/tokens/log — Registrar consumo de tokens
// Chamado por skills, n8n workflows e agentes
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.deliverableId || !data.subscriptionId || !data.model) {
      return NextResponse.json(
        { error: 'Missing required fields: deliverableId, subscriptionId, model' },
        { status: 400 }
      );
    }

    const totalTokens = (data.tokensInput || 0) + (data.tokensOutput || 0);

    // 1. Criar log de uso
    const log = await prisma.tokenUsageLog.create({
      data: {
        deliverableId: data.deliverableId,
        subscriptionId: data.subscriptionId,
        model: data.model,
        tokensInput: data.tokensInput || 0,
        tokensOutput: data.tokensOutput || 0,
        totalTokens,
        estimatedCostBrl: data.estimatedCostBrl || 0,
        taskSummary: data.taskSummary || null,
        projectName: data.projectName || null,
        sessionId: data.sessionId || null,
        usageType: data.usageType || 'chat',
      },
    });

    // 2. Atualizar cache do deliverable
    await prisma.deliverable.update({
      where: { id: data.deliverableId },
      data: {
        totalTokensUsed: { increment: BigInt(totalTokens) },
        totalSessions: { increment: data.sessionId ? 1 : 0 },
        totalCostBrl: { increment: data.estimatedCostBrl || 0 },
        lastActiveAt: new Date(),
      },
    });

    // 3. Atualizar assinatura LLM
    await prisma.llmSubscription.update({
      where: { id: data.subscriptionId },
      data: {
        tokensUsed: { increment: BigInt(totalTokens) },
      },
    });

    // 4. Atualizar quota do membro (via deliverable → owner)
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: data.deliverableId },
      select: { ownerId: true },
    });

    if (deliverable?.ownerId) {
      const quota = await prisma.memberQuota.findUnique({
        where: { memberId: deliverable.ownerId },
      });

      if (quota) {
        const newUsed = Number(quota.monthlyTokensUsed) + totalTokens;
        const limit = Number(quota.monthlyTokenLimit);
        const percentage = (newUsed / limit) * 100;

        const updateData: any = {
          monthlyTokensUsed: { increment: BigInt(totalTokens) },
          monthlyCostUsed: { increment: data.estimatedCostBrl || 0 },
        };

        // Verificar thresholds de alerta
        if (percentage >= 50 && !quota.alertAt50) updateData.alertAt50 = true;
        if (percentage >= 80 && !quota.alertAt80) updateData.alertAt80 = true;
        if (percentage >= 100 && !quota.alertAt100) updateData.alertAt100 = true;

        await prisma.memberQuota.update({
          where: { memberId: deliverable.ownerId },
          data: updateData,
        });

        // Retornar alertas se thresholds foram atingidos
        const alerts: string[] = [];
        if (percentage >= 100 && !quota.alertAt100) alerts.push('QUOTA_100_EXCEEDED');
        else if (percentage >= 80 && !quota.alertAt80) alerts.push('QUOTA_80_WARNING');
        else if (percentage >= 50 && !quota.alertAt50) alerts.push('QUOTA_50_INFO');

        return NextResponse.json({
          success: true,
          log: { id: log.id, totalTokens },
          quotaPercentage: Math.round(percentage),
          alerts,
        }, { status: 201 });
      }
    }

    return NextResponse.json({ success: true, log: { id: log.id, totalTokens } }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
