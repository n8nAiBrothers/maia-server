import prisma from '../../../lib/prisma';

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { status: { not: 'archived' } },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Projetos</h1>
          <p className="dashboard-subtitle">Projetos ativos do time</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card purple">
          <span className="kpi-icon">🚀</span>
          <div className="kpi-label">Total Projetos</div>
          <div className="kpi-value">{projects.length}</div>
        </div>
        <div className="kpi-card green">
          <span className="kpi-icon">📊</span>
          <div className="kpi-label">Progresso Médio</div>
          <div className="kpi-value">{Math.round(projects.reduce((s, p) => s + p.progress, 0) / (projects.length || 1))}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {projects.map((p) => (
          <div key={p.id} className="kpi-card purple" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</div>
                {p.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{p.description}</div>}
              </div>
              <span className={`badge ${p.status === 'active' ? 'green' : p.status === 'planning' ? 'amber' : 'gray'}`}>
                {p.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className="badge purple">{p.type}</span>
              {p.techStack.map((t) => (
                <span className="badge blue" key={t}>{t}</span>
              ))}
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>Progresso</span>
                <span>{p.progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className={`progress-fill ${p.progress >= 80 ? 'green' : p.progress >= 40 ? 'amber' : 'purple'}`} style={{ width: `${p.progress}%` }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {p.repoUrl && <span>📁 Repo</span>}
              {p.deployUrl && <span>🌐 Deploy</span>}
              <span>Atualizado {new Date(p.updatedAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
