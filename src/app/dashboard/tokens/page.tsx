import prisma from '../../../lib/prisma';

export default async function ControleIAPage() {
  const subscriptions = await prisma.llmSubscription.findMany({
    where: { status: 'active' },
    orderBy: { provider: 'asc' },
  });

  const deliverables = await prisma.deliverable.findMany({
    include: { owner: true },
    orderBy: { totalTokensUsed: 'desc' },
  });

  const quotas = await prisma.memberQuota.findMany({
    include: { member: true },
    orderBy: { monthlyTokensUsed: 'desc' },
  });

  const llmExpenses = await prisma.platformExpense.findMany({
    where: { category: 'llm_subscription' }
  });

  const subsWithCost = subscriptions.map(s => {
    const expense = llmExpenses.find(e => e.name.toLowerCase() === s.planName.toLowerCase() || e.provider.toLowerCase() === s.provider.toLowerCase());
    return {
      ...s,
      dynamicCost: (expense && !s.isLocal) ? expense.amount : (s.monthlyCost || 0),
      cycle: expense ? expense.billingCycle : 'monthly'
    };
  });

  const now = new Date();

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Controle de IA & Tokens</h1>
          <p className="dashboard-subtitle">Monitoramento global de consumo, projetos e performance da equipe</p>
        </div>
      </div>

      <div className="kpi-grid">
        {subsWithCost.map((s) => {
          const limit = s.tokenLimit ? Number(s.tokenLimit) : null;
          const used = Number(s.tokensUsed);
          const pct = limit ? Math.round((used / limit) * 100) : 0;
          let daysUntil: number | null = null;
          if (s.renewalDay) {
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), s.renewalDay);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, s.renewalDay);
            const renewalDate = thisMonth > now ? thisMonth : nextMonth;
            daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }

          const colorClass = s.isLocal ? 'green' : s.provider === 'google' ? 'blue' : 'purple';

          return (
            <div className={`kpi-card ${colorClass}`} key={s.id} style={{ gridColumn: s.isLocal ? 'auto' : 'span 1' }}>
              <span className="kpi-icon">{s.isLocal ? '🏠' : '☁️'}</span>
              <div className="kpi-label">{s.provider.toUpperCase()}</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{s.planName}</div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  <span>{s.isLocal ? 'Ilimitado' : `${pct}% usado`}</span>
                  <span>R$ {s.dynamicCost.toFixed(2)}/{s.cycle === 'yearly' ? 'ano' : s.cycle === 'one-time' ? 'único' : 'mês'}</span>
                </div>
                {!s.isLocal && (
                  <div className="progress-bar">
                    <div className={`progress-fill ${pct >= 80 ? 'rose' : pct >= 50 ? 'amber' : 'green'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                )}
              </div>
              {daysUntil !== null && (
                <div className="kpi-detail" style={{ marginTop: '0.5rem' }}>
                  Renova em <strong>{daysUntil} dias</strong> (dia {s.renewalDay})
                </div>
              )}
              {s.isLocal && (
                <div className="kpi-detail" style={{ marginTop: '0.5rem' }}>
                  ♾️ Tokens ilimitados · Custo $0
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '2rem', marginTop: '2rem' }}>
        {/* Tabela de Projetos (Deliverables) */}
        <div className="section" style={{ marginTop: 0 }}>
          <div className="section-header">
            <h2 className="section-title">🚀 Projetos e Agentes em Uso</h2>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Projeto / Agente</th>
                  <th>Responsável</th>
                  <th>Tokens Gastos</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.name} <br/><span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{d.agentType || d.platform}</span></td>
                    <td>{d.owner.name.split(' ')[0]}</td>
                    <td style={{ fontFamily: 'monospace' }}>{Number(d.totalTokensUsed).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
                {deliverables.length === 0 && (
                  <tr><td colSpan={3} style={{textAlign: 'center', padding: '1rem'}}>Nenhum projeto registrou tokens ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance da Equipe */}
        <div className="section" style={{ marginTop: 0 }}>
          <div className="section-header">
            <h2 className="section-title">👥 Consumo da Equipe (Mês atual)</h2>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Uso de Tokens</th>
                  <th>Custo (R$)</th>
                </tr>
              </thead>
              <tbody>
                {quotas.map((q) => {
                  const limit = Number(q.monthlyTokenLimit);
                  const used = Number(q.monthlyTokensUsed);
                  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600 }}>{q.member.name}</td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          <span>{used.toLocaleString('pt-BR')}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div className={`progress-fill ${pct >= 100 ? 'rose' : pct >= 80 ? 'amber' : 'green'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </td>
                      <td style={{ color: q.monthlyCostUsed > 0 ? 'var(--alert)' : 'inherit' }}>
                        {q.monthlyCostUsed > 0 ? `R$ ${q.monthlyCostUsed.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
