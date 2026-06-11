"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  contributionId: string;
  status: string;
  receiptUrl: string | null;
}

export default function FinanceActionButtons({ contributionId, status, receiptUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAction = async (action: 'approve' | 'reject' | 'force_approve') => {
    if (action === 'force_approve' && !confirm('Tem certeza que deseja dar a baixa sem comprovante?')) return;
    if (action === 'reject' && !confirm('Recusar este comprovante? O usuário terá que enviar novamente.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/financeiro/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributionId, action }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Erro ao processar a requisição.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'paid') {
    return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✅ Quitado</span>;
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {status === 'under_review' && receiptUrl ? (
        <>
          <button 
            title="Visualizar Comprovante"
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            📄 Ver
          </button>
          <button 
            title="Aprovar e Dar Baixa"
            disabled={loading}
            onClick={() => handleAction('approve')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ✅ Aprovar
          </button>
          <button 
            title="Recusar Comprovante"
            disabled={loading}
            onClick={() => handleAction('reject')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, background: '#f43f5e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ❌ Recusar
          </button>

          {/* Pop-up Modal do Comprovante usando Portal para escapar do z-index e transform do Card */}
          {isModalOpen && mounted && createPortal(
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', maxWidth: '800px', width: '100%', position: 'relative', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: 'var(--text-muted)', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--foreground)' }}>Análise de Comprovante</h3>
                <div style={{ width: '100%', height: '60vh', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--background)', borderRadius: '8px' }}>
                  {receiptUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={receiptUrl} width="100%" height="100%" style={{ border: 'none' }} />
                  ) : (
                    <img src={receiptUrl} alt="Comprovante" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    title="Aprovar e Dar Baixa"
                    disabled={loading}
                    onClick={() => { handleAction('approve'); setIsModalOpen(false); }}
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 600, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    ✅ Aprovar Pagamento
                  </button>
                  <button 
                    title="Recusar Comprovante"
                    disabled={loading}
                    onClick={() => { handleAction('reject'); setIsModalOpen(false); }}
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 600, background: '#f43f5e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    ❌ Recusar e Excluir
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      ) : (
        <button 
          disabled={loading}
          onClick={() => handleAction('force_approve')}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
        >
          Forçar Baixa Manual
        </button>
      )}
    </div>
  );
}
