"use client";

import React, { useState } from 'react';

type KpiDashboardGridProps = {
  isController: boolean;
  tokensData: { total: number; cost: number; logs: any[] };
  deliverablesData: { count: number; active24h: number; list: any[] };
  renewalsData: any[];
  financeData: { saldo: number; revenue: number; expected: number };
  quotaData: { used: number; limit: number; pct: number } | null;
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

export default function KpiDashboardGrid({
  isController,
  tokensData,
  deliverablesData,
  renewalsData,
  financeData,
  quotaData
}: KpiDashboardGridProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <div className="kpi-grid">
        {/* Tokens Card */}
        <div 
          className="kpi-card purple" 
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveModal('tokens')}
        >
          <span className="kpi-icon">🪙</span>
          <div className="kpi-label">Tokens Este Mês</div>
          <div className="kpi-value">{formatNumber(tokensData.total || 0)}</div>
          <div className="kpi-detail">R$ {(tokensData.cost || 0).toFixed(2)} custo estimado</div>
        </div>

        {/* Deliverables Card */}
        <div 
          className="kpi-card green" 
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveModal('deliverables')}
        >
          <span className="kpi-icon">📦</span>
          <div className="kpi-label">Deliverables</div>
          <div className="kpi-value">{deliverablesData.count}</div>
          <div className="kpi-detail">{deliverablesData.active24h} ativos nas últimas 24h</div>
        </div>

        {/* Renewals Card */}
        <div 
          className="kpi-card amber" 
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveModal('renewals')}
        >
          <span className="kpi-icon">⏰</span>
          <div className="kpi-label">Próx. Renovação</div>
          <div className="kpi-value">{renewalsData[0]?.daysUntil || '—'}d</div>
          <div className="kpi-detail">{renewalsData[0]?.planName || 'Nenhuma'}</div>
        </div>

        {/* Finance/Quota Card */}
        {isController ? (
          <div 
            className="kpi-card blue" 
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveModal('finance')}
          >
            <span className="kpi-icon">💰</span>
            <div className="kpi-label">Saldo do Mês (Caixa Real)</div>
            <div className="kpi-value" style={{ color: financeData.saldo >= 0 ? '#34d399' : '#fb7185' }}>
              R$ {financeData.saldo.toFixed(0)}
            </div>
            <div className="kpi-detail">Recebido R$ {financeData.revenue.toFixed(0)} / Esperado R$ {financeData.expected.toFixed(0)}</div>
          </div>
        ) : (
          <div className="kpi-card blue">
            <span className="kpi-icon">📊</span>
            <div className="kpi-label">Sua Quota de Tokens</div>
            <div className="kpi-value">
              {quotaData 
                ? `${formatNumber(quotaData.used)} / ${formatNumber(quotaData.limit)}`
                : '—'
              }
            </div>
            <div className="kpi-detail">
              {quotaData 
                ? `${quotaData.pct}% consumido`
                : 'Quota não definida'
              }
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              background: 'var(--surface)', padding: '2rem', borderRadius: '1rem',
              width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
              border: '1px solid var(--border)'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>
                {activeModal === 'tokens' && 'Detalhes: Consumo de Tokens'}
                {activeModal === 'deliverables' && 'Detalhes: Deliverables'}
                {activeModal === 'renewals' && 'Detalhes: Assinaturas de IA'}
                {activeModal === 'finance' && 'Detalhes: Caixa e Receitas'}
              </h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* Tokens Content */}
            {activeModal === 'tokens' && (
              <div>
                <p><strong>Total de Tokens (Mês):</strong> {formatNumber(tokensData.total || 0)}</p>
                <p><strong>Custo Estimado (Mês):</strong> R$ {(tokensData.cost || 0).toFixed(2)}</p>
                <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />
                <h3>Últimos Registros (24h)</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {tokensData.logs.length === 0 && <li style={{ color: 'var(--text-muted)' }}>Sem registros nas últimas 24h.</li>}
                  {tokensData.logs.map((log: any) => (
                    <li key={log.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{log.model}</span>
                        <span style={{ color: 'var(--primary)' }}>+{log.totalTokens} tokens</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.projectName || 'Sem projeto'} - {new Date(log.createdAt).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deliverables Content */}
            {activeModal === 'deliverables' && (
              <div>
                <p><strong>Total de Deliverables Ativos/Inativos:</strong> {deliverablesData.count}</p>
                <p><strong>Ativos nas últimas 24h:</strong> {deliverablesData.active24h}</p>
                <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />
                <h3>Todos os Deliverables</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {deliverablesData.list.map((d: any) => (
                    <li key={d.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{d.name}</strong>
                        <span className={`badge ${d.status === 'active' ? 'green' : 'gray'}`}>{d.status}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Categoria: {d.category} | Tokens Totais: {formatNumber(Number(d.totalTokensUsed))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Renewals Content */}
            {activeModal === 'renewals' && (
              <div>
                <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.5rem' }}>Assinatura</th>
                      <th style={{ padding: '0.5rem' }}>Dias Restantes</th>
                      <th style={{ padding: '0.5rem' }}>Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renewalsData.map((r: any) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem' }}>{r.planName}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span className={`badge ${r.daysUntil <= 3 ? 'rose' : r.daysUntil <= 7 ? 'amber' : 'green'}`}>
                            {r.daysUntil} dias
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>R$ {r.dynamicCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Finance Content */}
            {activeModal === 'finance' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Receitas Acumuladas</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#34d399' }}>R$ {financeData.revenue.toFixed(2)}</div>
                  </div>
                  <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Despesas Previstas</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fb7185' }}>R$ {(financeData.revenue - financeData.saldo).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Saldo Final (Caixa Líquido)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: financeData.saldo >= 0 ? '#34d399' : '#fb7185' }}>
                    R$ {financeData.saldo.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
