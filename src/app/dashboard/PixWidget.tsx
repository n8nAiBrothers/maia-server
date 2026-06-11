"use client";

import React, { useState } from 'react';
import QRCode from 'react-qr-code';

interface PixWidgetProps {
  contributionId: string;
  amount: number;
  status: string;
  pixPayload: string;
  paidAt?: string | null;
}

export default function PixWidget({ contributionId, amount, status, pixPayload, paidAt }: PixWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('contributionId', contributionId);

    try {
      const res = await fetch('/api/financeiro/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Erro ao enviar comprovante. Tente novamente.');
      }
    } catch (err) {
      alert('Erro na conexão.');
    } finally {
      setUploading(false);
    }
  };

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Pagamento+Mensal+Plataforma+Maia&details=Fazer+o+PIX+mensal+da+Plataforma+Maia+no+valor+de+R$+${amount.toFixed(2)}&dates=20260601T120000Z/20260601T130000Z&recur=RRULE:FREQ=MONTHLY;BYMONTHDAY=1`;

  if (status === 'paid') {
    if (!paidAt) return null; // Fallback if no date
    
    // Verifica se foi pago hoje
    const paidDate = new Date(paidAt);
    const today = new Date();
    const isToday = paidDate.getDate() === today.getDate() && 
                    paidDate.getMonth() === today.getMonth() && 
                    paidDate.getFullYear() === today.getFullYear();
    
    // Se não foi pago hoje, oculta o widget completamente
    if (!isToday) return null;

    return (
      <div className="kpi-card green" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="kpi-icon">✅</span>
          <div className="kpi-label">Contribuição Mensal</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>Pagamento Confirmado (Hoje)</div>
        </div>
        <div style={{ fontSize: '2rem' }}>🎉</div>
      </div>
    );
  }

  if (status === 'under_review') {
    return (
      <div className="kpi-card amber" style={{ gridColumn: '1 / -1' }}>
        <span className="kpi-icon">⏳</span>
        <div className="kpi-label">Contribuição Mensal</div>
        <div className="kpi-value" style={{ fontSize: '1.2rem' }}>Comprovante em Análise</div>
        <div className="kpi-detail">Flavio conferirá em breve. Obrigado!</div>
      </div>
    );
  }

  return (
    <div className="kpi-card" style={{ gridColumn: '1 / -1', background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🚨</span> Contribuição Mensal Pendente
        </h3>
        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>
          Vencimento todo <strong>dia 1º</strong> do mês.<br/>Valor: <strong style={{color: 'var(--text)'}}>R$ {amount.toFixed(2)}</strong>
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={handleCopy}
            style={{ padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {copied ? '✅ Código Copiado!' : '📋 Copiar Código PIX'}
          </button>

          <label style={{ padding: '0.75rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 600 }}>
            {uploading ? 'Enviando...' : '📤 Enviar Comprovante'}
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
          </label>

          <a href={gcalUrl} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', marginTop: '0.5rem' }}>
            📅 Criar lembrete no Google Agenda
          </a>
        </div>
      </div>

      <div style={{ background: 'white', padding: '10px', borderRadius: '12px', width: 'fit-content', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <QRCode value={pixPayload} size={150} level="M" />
        <span style={{ color: '#333', fontSize: '0.7rem', marginTop: '5px', fontWeight: 600 }}>FLAVIO CUNHA S SANTORO</span>
      </div>
    </div>
  );
}
