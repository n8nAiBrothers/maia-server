import prisma from '../../../lib/prisma';

export default async function SchedulePage() {
  const schedules = await prisma.agentSchedule.findMany({
    include: {
      deliverable: {
        select: { id: true, name: true, category: true, owner: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusCounts = {
    pending: schedules.filter((s) => s.status === 'pending').length,
    running: schedules.filter((s) => s.status === 'running').length,
    completed: schedules.filter((s) => s.status === 'completed').length,
  };

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Agendamentos</h1>
          <p className="dashboard-subtitle">Tarefas agendadas de agentes e automações</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card amber">
          <span className="kpi-icon">⏳</span>
          <div className="kpi-label">Pendentes</div>
          <div className="kpi-value">{statusCounts.pending}</div>
        </div>
        <div className="kpi-card green">
          <span className="kpi-icon">▶️</span>
          <div className="kpi-label">Em Execução</div>
          <div className="kpi-value">{statusCounts.running}</div>
        </div>
        <div className="kpi-card purple">
          <span className="kpi-icon">✅</span>
          <div className="kpi-label">Concluídos</div>
          <div className="kpi-value">{statusCounts.completed}</div>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="data-table-container" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Nenhum agendamento</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Os agendamentos serão criados automaticamente quando agentes e workflows forem configurados.
          </div>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agente/Deliverable</th>
                <th>Tarefa</th>
                <th>Criador</th>
                <th>Cron</th>
                <th>LLM Pref.</th>
                <th>Prioridade</th>
                <th>Próxima Exec.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.deliverable.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.deliverable.category}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.title}</div>
                    {s.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.description}</div>}
                  </td>
                  <td>{s.deliverable.owner.name.split(' ')[0]}</td>
                  <td style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>{s.cronExpression || '—'}</td>
                  <td><span className={`badge ${s.preferredLlm === 'local' ? 'green' : s.preferredLlm === 'cloud' ? 'amber' : 'blue'}`}>{s.preferredLlm}</span></td>
                  <td><span className={`badge ${s.priority === 'high' ? 'rose' : s.priority === 'normal' ? 'blue' : 'gray'}`}>{s.priority}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{s.nextRunAt ? new Date(s.nextRunAt).toLocaleDateString('pt-BR') : s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>
                    <span className={`badge ${s.status === 'running' ? 'green' : s.status === 'pending' ? 'amber' : s.status === 'completed' ? 'purple' : 'gray'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
