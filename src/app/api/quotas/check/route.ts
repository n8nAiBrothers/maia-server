import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// POST /api/quotas/check — Verificar se membro tem tokens disponíveis
// Chamado pelo LLM Router ANTES de executar uma tarefa
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.memberId) {
      return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });
    }

    const quota = await prisma.memberQuota.findUnique({
      where: { memberId: data.memberId },
      include: { member: { select: { name: true, tier: true } } },
    });

    if (!quota) {
      return NextResponse.json({ allowed: true, reason: 'no_quota_configured' });
    }

    const used = Number(quota.monthlyTokensUsed);
    const limit = Number(quota.monthlyTokenLimit);
    const percentage = Math.round((used / limit) * 100);
    const estimatedTokens = data.estimatedTokens || 0;
    const wouldExceed = (used + estimatedTokens) > limit;

    let allowed = true;
    let recommendation = 'cloud'; // default: pode usar cloud
    let reason = 'within_quota';

    if (percentage >= 100 || wouldExceed) {
      switch (quota.overagePolicy) {
        case 'block':
          allowed = false;
          recommendation = 'blocked';
          reason = 'quota_exceeded_blocked';
          break;
        case 'throttle':
          allowed = true;
          recommendation = 'local'; // Forçar LLM local
          reason = 'quota_exceeded_throttled_to_local';
          break;
        case 'bill':
          allowed = true;
          recommendation = 'cloud';
          reason = 'quota_exceeded_billing_overage';
          break;
        default: // 'warn'
          allowed = true;
          recommendation = 'cloud';
          reason = 'quota_exceeded_warning';
      }
    } else if (percentage >= 80) {
      recommendation = 'local'; // Sugerir local para economizar
      reason = 'approaching_limit_80';
    } else if (percentage >= 50) {
      recommendation = 'auto'; // Misto
      reason = 'moderate_usage_50';
    }

    return NextResponse.json({
      success: true,
      allowed,
      recommendation, // 'cloud', 'local', 'auto', 'blocked'
      reason,
      quota: {
        limit,
        used,
        percentage,
        remaining: limit - used,
        tier: quota.tier,
        overagePolicy: quota.overagePolicy,
        memberName: quota.member.name,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
