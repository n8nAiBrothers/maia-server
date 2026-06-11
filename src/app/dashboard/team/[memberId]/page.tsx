import prisma from '../../../../lib/prisma';
import Link from 'next/link';

const categoryIcons: Record<string, string> = {
  agent: '🤖', app: '📱', webapp: '📱', website: '🌐',
  automation: '⚙️', bot: '🤖', api: '🔌',
};

type Props = { params: Promise<{ memberId: string }> };

export default async function MemberDetailPage({ params }: Props) {
  const { memberId } = await params;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      quota: true,
      deliverables: {
        where: { status: { not: 'archived' } },
        include: {
          _count: { select: { usageLogs: true } },
        },
        orderBy: { totalTokensUsed: 'desc' },
      },
    },
  });

  if (!member) {
    return <div className="dashboard-header"><h1 className="dashboard-title">Membro não encontrado</h1></div>;
  }

  const totalTokens = member.deliverables.reduce((s, d) => s + Number(d.totalTokensUsed), 0);
  const totalCost = member.deliverables.reduce((s, d) => s + d.totalCostBrl, 0);
  const quotaPct = member.quota ? Math.round((Number(member.quota.monthlyTokensUsed) / Number(member.quota.monthlyTokenLimit)) * 100) : 0;

  // Categorias
  const categories = [...new Set(member.deliverables.map((d) => d.category))];

  return (
    <>
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard/team" style={{ color: 'var(--text-muted)', fontSize: '1.5rem' }}>←</Link>
          <div className="member-avatar" style={{ width: 56, height: 56, fontSize: '1.25rem' }}>
            {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="dashboard-title">{member.name}</h1>
            <p className="dashboard-subtitle">
              {member.role} · <span className={`badge ${member.tier === 'pro' ? 'purple' : 'gray'}`}>{member.tier}</span>
              {member.roles.map((r) => (
                <span className="badge blue" key={r} style={{ marginLeft: '0.3rem' }}>{r}</span>
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs do membro */}
      <div className="kpi-grid">
        <div className="kpi-card purple">
          <span className="kpi-icon">📊</span>
          <div className="kpi-label">Quota Mensal</div>
          <div className="kpi-value">{quotaPct}%</div>
          <div style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar" style={{ height: '8px' }}>
              <div className={`progress-fill ${quotaPct >= 80 ? 'rose' : quotaPct >= 50 ? 'amber' : 'green'}`} style={{ width: `${Math.min(quotaPct, 100)}%` }} />
            </div>
            <div className="kpi-detail" style={{ marginTop: '0.25rem' }}>
              {member.quota ? `${Number(member.quota.monthlyTokensUsed).toLocaleString('pt-BR')} / ${Number(member.quota.monthlyTokenLimit).toLocaleString('pt-BR')}` : '—'}
            </div>
          </div>
        </div>
        <div className="kpi-card green">
          <span className="kpi-icon">📦</span>
          <div className="kpi-label">Deliverables</div>
          <div className="kpi-value">{member.deliverables.length}</div>
          <div className="kpi-detail">{member.deliverables.filter((d) => d.status === 'active').length} ativos</div>
        </div>
        <div className="kpi-card amber">
          <span className="kpi-icon">🪙</span>
          <div className="kpi-label">Tokens Total</div>
          <div className="kpi-value">{totalTokens.toLocaleString('pt-BR')}</div>
        </div>
        <div className="kpi-card rose">
          <span className="kpi-icon">💸</span>
          <div className="kpi-label">Custo Total</div>
          <div className="kpi-value">R$ {totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Deliverables do membro */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">📦 Deliverables de {member.name.split(' ')[0]}</h2>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {categories.map((cat) => (
              <span className={`badge ${cat === 'agent' || cat === 'bot' ? 'green' : cat === 'app' || cat === 'webapp' ? 'amber' : 'blue'}`} key={cat}>
                {categoryIcons[cat]} {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Projeto</th>
                <th>Modelo</th>
                <th>LLM</th>
                <th>Tokens</th>
                <th>Custo</th>
                <th>Sessões</th>
                <th>Último Uso</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {member.deliverables.map((d) => (
                <tr key={d.id}>
                  <td><span className={`category-icon ${d.category}`}>{categoryIcons[d.category] || '📦'}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    {d.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.description}</div>}
                  </td>
                  <td>{d.projectName ? <span className="badge purple">{d.projectName}</span> : '—'}</td>
                  <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>{d.defaultModel || '—'}</td>
                  <td><span className={`badge ${d.defaultLlm === 'local' ? 'green' : d.defaultLlm === 'cloud' ? 'amber' : 'blue'}`}>{d.defaultLlm}</span></td>
                  <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{Number(d.totalTokensUsed).toLocaleString('pt-BR')}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>R$ {d.totalCostBrl.toFixed(2)}</td>
                  <td>{d.totalSessions}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {d.lastActiveAt ? new Date(d.lastActiveAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${d.status === 'active' ? 'green' : d.status === 'paused' ? 'amber' : 'gray'}`}>
                      {d.status === 'active' ? '🟢' : d.status === 'paused' ? '🟡' : '⚪'} {d.status}
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
