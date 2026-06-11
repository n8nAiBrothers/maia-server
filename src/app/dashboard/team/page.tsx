import prisma from '../../../lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { addMember, removeMember } from './actions';

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

export default async function TeamPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('maia_session')?.value;
  let currentUser = null;
  if (sessionToken) {
    currentUser = await prisma.member.findUnique({
      where: { accessHash: sessionToken },
    });
  }
  const isAdmin = currentUser?.canViewFinancials || false;

  const members = await prisma.member.findMany({
    where: { isActive: true },
    include: {
      quota: true,
      deliverables: {
        where: { status: { not: 'archived' } },
        select: { id: true, name: true, category: true, totalTokensUsed: true, totalCostBrl: true, status: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const enriched = members.map((m) => ({
    ...m,
    totalTokens: m.deliverables.reduce((s, d) => s + Number(d.totalTokensUsed), 0),
    totalCost: m.deliverables.reduce((s, d) => s + d.totalCostBrl, 0),
    activeCount: m.deliverables.filter((d) => d.status === 'active').length,
    quotaPct: m.quota ? Math.round((Number(m.quota.monthlyTokensUsed) / Number(m.quota.monthlyTokenLimit)) * 100) : 0,
    quotaLimit: m.quota ? Number(m.quota.monthlyTokenLimit) : 500000,
    quotaUsed: m.quota ? Number(m.quota.monthlyTokensUsed) : 0,
    byCategory: m.deliverables.reduce((acc: Record<string, number>, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {}),
  })).sort((a, b) => b.totalTokens - a.totalTokens);

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Equipe</h1>
          <p className="dashboard-subtitle">Performance e consumo de tokens por membro</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card purple">
          <span className="kpi-icon">👥</span>
          <div className="kpi-label">Membros Ativos</div>
          <div className="kpi-value">{members.length}</div>
        </div>
        <div className="kpi-card green">
          <span className="kpi-icon">📦</span>
          <div className="kpi-label">Total Deliverables</div>
          <div className="kpi-value">{enriched.reduce((s, m) => s + m.deliverables.length, 0)}</div>
        </div>
        <div className="kpi-card amber">
          <span className="kpi-icon">🪙</span>
          <div className="kpi-label">Total Tokens</div>
          <div className="kpi-value">{formatNumber(enriched.reduce((s, m) => s + m.totalTokens, 0))}</div>
        </div>
        <div className="kpi-card rose">
          <span className="kpi-icon">💸</span>
          <div className="kpi-label">Custo Total</div>
          <div className="kpi-value">R$ {enriched.reduce((s, m) => s + m.totalCost, 0).toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {enriched.map((m) => (
          <Link href={`/dashboard/team/${m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
            <div className="member-card" style={{ flexWrap: 'wrap' }}>
              <div className="member-avatar">
                {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="member-info" style={{ minWidth: '200px' }}>
                <div className="member-name">{m.name}</div>
                <div className="member-role">
                  {m.role} · <span className={`badge ${m.canViewFinancials ? 'purple' : 'gray'}`}>{m.tier}</span>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {Object.entries(m.byCategory).map(([cat, count]) => (
                    <span className={`badge ${cat === 'agent' ? 'green' : cat === 'app' || cat === 'webapp' ? 'amber' : 'blue'}`} key={cat}>
                      {count} {cat}{Number(count) > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '200px', maxWidth: '350px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  <span>{m.quotaPct}% da quota ({m.quota?.overagePolicy || 'warn'})</span>
                  <span>{formatNumber(m.quotaUsed)} / {formatNumber(m.quotaLimit)}</span>
                </div>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div className={`progress-fill ${getProgressColor(m.quotaPct)}`} style={{ width: `${Math.min(m.quotaPct, 100)}%` }} />
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
                <div className="member-stat">
                  <div className="member-stat-value">{m.activeCount}</div>
                  <div className="member-stat-label">Ativos</div>
                </div>
              </div>
              {isAdmin && (
                <form action={removeMember.bind(null, m.id)} style={{ alignSelf: 'center', marginLeft: '1rem' }}>
                  <button type="submit" style={{ background: 'var(--rose)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>Excluir</button>
                </form>
              )}
            </div>
          </Link>
        ))}
      </div>

      {isAdmin && (
        <div className="surface-card" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>⚙️ Setup Equipe (Adicionar Novo)</h2>
          <form action={addMember} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input name="name" placeholder="Nome Completo" required style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            <input name="email" type="email" placeholder="Email" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            <select name="role" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
              <option value="developer">Developer</option>
              <option value="controller">Controller</option>
              <option value="designer">Designer</option>
            </select>
            <button type="submit" className="action-button primary">Adicionar Membro</button>
          </form>
        </div>
      )}
    </>
  );
}
