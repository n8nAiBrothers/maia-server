import prisma from '../../../lib/prisma';

const categoryIcons: Record<string, string> = {
  agent: '🤖', app: '📱', webapp: '📱', website: '🌐',
  automation: '⚙️', bot: '🤖', api: '🔌',
};

const statusColors: Record<string, string> = {
  active: 'green', paused: 'amber', archived: 'gray', 'in-development': 'blue',
};

export default async function DeliverablesPage() {
  const deliverables = await prisma.deliverable.findMany({
    where: { status: { not: 'archived' } },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { usageLogs: true } },
    },
    orderBy: { totalTokensUsed: 'desc' },
  });

  const totalTokens = deliverables.reduce((s: number, d: any) => s + Number(d.totalTokensUsed), 0);
  const totalCost = deliverables.reduce((s: number, d: any) => s + d.totalCostBrl, 0);

  // Counts por categoria
  const byCat: Record<string, number> = {};
  deliverables.forEach((d: any) => { byCat[d.category] = (byCat[d.category] || 0) + 1; });

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Deliverables</h1>
          <p className="dashboard-subtitle">Todos os agentes, apps, sites e automações do time</p>
        </div>
      </div>

      {/* Resumo por categoria */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {Object.entries(byCat).map(([cat, count]) => (
          <div className="kpi-card purple" key={cat} style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`category-icon ${cat}`}>{categoryIcons[cat] || '📦'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cat}s</div>
              </div>
            </div>
          </div>
        ))}
        <div className="kpi-card green" style={{ padding: '1rem 1.25rem' }}>
          <div className="kpi-label">Total Tokens</div>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{totalTokens.toLocaleString('pt-BR')}</div>
          <div className="kpi-detail">R$ {totalCost.toFixed(2)} custo total</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="data-table-container">
        <div className="data-table-header">
          <h3 className="data-table-title">Todos os Deliverables ({deliverables.length})</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nome</th>
              <th>Dono</th>
              <th>Projeto</th>
              <th>Modelo</th>
              <th>Tokens Total</th>
              <th>Custo</th>
              <th>Sessões</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {deliverables.map((d: any) => (
              <tr key={d.id}>
                <td>
                  <span className={`category-icon ${d.category}`}>{categoryIcons[d.category] || '📦'}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  {d.description && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.description}
                    </div>
                  )}
                </td>
                <td>{d.owner.name.split(' ')[0]}</td>
                <td>{d.projectName ? <span className="badge purple">{d.projectName}</span> : '—'}</td>
                <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-geist-mono)' }}>{d.defaultModel || d.agentType || '—'}</td>
                <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{Number(d.totalTokensUsed).toLocaleString('pt-BR')}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>R$ {d.totalCostBrl.toFixed(2)}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{d.totalSessions}</td>
                <td><span className={`badge ${statusColors[d.status] || 'gray'}`}>{d.status === 'active' ? '🟢 Ativo' : d.status === 'paused' ? '🟡 Pausado' : d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
