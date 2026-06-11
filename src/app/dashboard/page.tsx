import prisma from '../../lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PixWidget from './PixWidget';
import FinanceActionButtons from './financeiro/FinanceActionButtons';
import CampaignModals from './CampaignModals';
import TelegramSetupWidget from './TelegramSetupWidget';
import KpiDashboardGrid from './KpiDashboardGrid';

const categoryIcons: Record<string, string> = {
  agent: '🤖', app: '📱', webapp: '📱', website: '🌐',
  automation: '⚙️', bot: '🤖', api: '🔌',
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return 'rose';
  if (pct >= 50) return 'amber';
  return 'green';
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('maia_session')?.value;

  let currentMember = null;
  if (sessionToken) {
    currentMember = await prisma.member.findUnique({
      where: { accessHash: sessionToken },
      include: { quota: true }
    });
  }

  const isController = currentMember?.canViewFinancials ?? false;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonth = now.toISOString().slice(0, 7);

  // KPIs
  const [
    logsMonth,
    activeLast24h,
    totalDeliverables,
    membersWithQuotas,
    subscriptions,
    contributionsPaid,
    contributionsAll,
    recentLogs,
    allDeliverables
  ] = await Promise.all([
    prisma.tokenUsageLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, estimatedCostBrl: true },
    }),
    prisma.deliverable.count({
      where: { lastActiveAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, status: 'active' },
    }),
    prisma.deliverable.count({ where: { status: { not: 'archived' } } }),
    prisma.member.findMany({
      where: { isActive: true },
      include: {
        quota: true,
        deliverables: {
          where: { status: { not: 'archived' } },
          select: { id: true, name: true, category: true, totalTokensUsed: true, totalCostBrl: true, status: true, lastActiveAt: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.llmSubscription.findMany({ where: { status: 'active', isLocal: false } }),
    prisma.memberContribution.aggregate({ where: { referenceMonth: currentMonth, status: 'paid' }, _sum: { amount: true } }),
    prisma.memberContribution.aggregate({ where: { referenceMonth: currentMonth }, _sum: { amount: true } }),
    prisma.tokenUsageLog.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.deliverable.findMany({
      where: { status: { not: 'archived' } },
      orderBy: { lastActiveAt: 'desc' }
    })
  ]);

  const pendingApprovals = isController ? await prisma.memberContribution.findMany({
    where: { status: 'under_review' },
    include: { member: true },
    orderBy: { createdAt: 'desc' }
  }) : [];

  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = nextMonthDate.toISOString().slice(0, 7); // "2026-06"
  
  const myContribution = currentMember ? await prisma.memberContribution.findFirst({
    where: { 
      memberId: currentMember.id, 
      referenceMonth: { in: [currentMonth, nextMonth] }
    },
    orderBy: { referenceMonth: 'asc' }
  }) : null;

  const PIX_PAYLOAD = "00020101021126540014br.gov.bcb.pix0111143178688810217AiBrothers mensal5204000053039865406200.005802BR5922FLAVIO CUNHA S SANTORO6009SAO PAULO6108014080006227052329052026133310771744638630447AA";

  const expenses = await prisma.platformExpense.findMany({ where: { status: 'active', billingCycle: 'monthly' } });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = contributionsPaid._sum.amount || 0;
  const totalExpected = contributionsAll._sum.amount || 0;
  const saldo = totalRevenue - totalExpenses;

  // Renovações
  const llmExpenses = await prisma.platformExpense.findMany({ where: { category: 'llm_subscription' } });
  
  const renewals = subscriptions.map((s) => {
    const expense = llmExpenses.find(e => e.name.toLowerCase() === s.planName.toLowerCase() || e.provider.toLowerCase() === s.provider.toLowerCase());
    const dynamicCost = (expense && !s.isLocal) ? expense.amount : (s.monthlyCost || 0);

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), s.renewalDay || 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, s.renewalDay || 1);
    const renewalDate = thisMonth > now ? thisMonth : nextMonth;
    const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { ...s, daysUntil, dynamicCost };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  // Ranking membros
  const ranking = membersWithQuotas
    .map((m) => ({
      ...m,
      totalTokens: m.deliverables.reduce((s, d) => s + Number(d.totalTokensUsed), 0),
      totalCost: m.deliverables.reduce((s, d) => s + d.totalCostBrl, 0),
      activeCount: m.deliverables.filter((d) => d.status === 'active').length,
      quotaPct: m.quota ? Math.round((Number(m.quota.monthlyTokensUsed) / Number(m.quota.monthlyTokenLimit)) * 100) : 0,
      quotaLimit: m.quota ? Number(m.quota.monthlyTokenLimit) : 500000,
      quotaUsed: m.quota ? Number(m.quota.monthlyTokensUsed) : 0,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  return (
    <>
      <CampaignModals 
        isPaid={myContribution?.status === 'paid'} 
        missingTelegram={currentMember ? !currentMember.telegramHandle : false} 
      />

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Visão geral da Plataforma Maia — {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {myContribution && (
          <PixWidget 
            contributionId={myContribution.id}
            amount={myContribution.amount}
            status={myContribution.status}
            pixPayload={PIX_PAYLOAD}
            paidAt={myContribution.paidAt?.toISOString() || null}
          />
        )}
      </div>

      {isController && pendingApprovals.length > 0 && (
        <div className="section" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            <h2 className="section-title">🚨 Comprovantes para Análise</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingApprovals.map(approval => (
              <div key={approval.id} className="kpi-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-raised)', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{approval.member.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>R$ {approval.amount.toFixed(2)} - Mês {approval.referenceMonth}</div>
                </div>
                <FinanceActionButtons 
                  contributionId={approval.id} 
                  status={approval.status} 
                  receiptUrl={approval.receiptUrl} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards (Interactive) */}
      <KpiDashboardGrid 
        isController={isController}
        tokensData={{ total: logsMonth._sum.totalTokens || 0, cost: logsMonth._sum.estimatedCostBrl || 0, logs: recentLogs }}
        deliverablesData={{ count: totalDeliverables, active24h: activeLast24h, list: allDeliverables }}
        renewalsData={renewals}
        financeData={{ saldo, revenue: totalRevenue, expected: totalExpected }}
        quotaData={currentMember?.quota ? {
          used: Number(currentMember.quota.monthlyTokensUsed),
          limit: Number(currentMember.quota.monthlyTokenLimit),
          pct: Math.round((Number(currentMember.quota.monthlyTokensUsed) / Number(currentMember.quota.monthlyTokenLimit)) * 100)
        } : null}
      />

      {/* Ranking por Membro */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">👥 Consumo por Membro</h2>
          <Link href="/dashboard/team" style={{ fontSize: '0.8rem', color: '#818cf8' }}>Ver todos →</Link>
        </div>

        {currentMember && (
          <>
            <CampaignModals 
              isPaid={false}
              missingTelegram={!currentMember.telegramChatId} 
            />
            
            <TelegramSetupWidget 
              hasTelegram={!!currentMember.telegramChatId} 
              memberName={currentMember.name.split(' ')[0]} 
            />
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ranking.map((m) => (
            <Link href={`/dashboard/team/${m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
              <div className="member-card">
                <div className="member-avatar">
                  {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-role">
                    {m.role} · <span className={`badge ${m.tier === 'pro' ? 'purple' : 'gray'}`}>{m.tier}</span>
                    {' '}{m.activeCount} deliverables
                  </div>
                  <div style={{ marginTop: '0.5rem', maxWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>{m.quotaPct}% da quota</span>
                      <span>{formatNumber(m.quotaUsed)} / {formatNumber(m.quotaLimit)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${getProgressColor(m.quotaPct)}`} style={{ width: `${Math.min(m.quotaPct, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="member-stats">
                  <div className="member-stat">
                    <div className="member-stat-value">{formatNumber(m.totalTokens)}</div>
                    <div className="member-stat-label">Tokens</div>
                  </div>
                  <div className="member-stat">
                    <div className="member-stat-value">R$ {m.totalCost.toFixed(2)}</div>
                    <div className="member-stat-label">Custo</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Renovações */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">📅 Próximas Renovações</h2>
          <Link href="/dashboard/tokens" style={{ fontSize: '0.8rem', color: '#818cf8' }}>Gerenciar →</Link>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Assinatura</th>
                <th>Provider</th>
                <th>Custo</th>
                <th>Renova em</th>
              </tr>
            </thead>
            <tbody>
              {renewals.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.planName}</td>
                  <td><span className="badge blue">{r.provider}</span></td>
                  <td>R$ {r.dynamicCost.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${r.daysUntil <= 3 ? 'rose' : r.daysUntil <= 7 ? 'amber' : 'green'}`}>
                      {r.daysUntil} dias (dia {r.renewalDay})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
