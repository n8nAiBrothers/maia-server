'use client';

import React, { useState, useEffect } from 'react';

export default function CampaignModals({ isPaid, missingTelegram }: { isPaid: boolean, missingTelegram: boolean }) {
  const [showThankYou, setShowThankYou] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [telegramHandle, setTelegramHandle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const monthKey = new Date().toISOString().slice(0, 7); // e.g. "2026-06"
    
    // Check if we already thanked them this month
    // Payment modal disabled permanently
    // if (isPaid && !localStorage.getItem(`thankYouShown_${monthKey}`)) {
    //   setShowThankYou(true);
    // }
    
    // Check if we need telegram
    if (missingTelegram && !localStorage.getItem('telegramCampaignDismissed')) {
      // Don't show both at the exact same time, delay telegram if thank you is showing
      if (isPaid && !localStorage.getItem(`thankYouShown_${monthKey}`)) {
        setTimeout(() => setShowTelegram(true), 1500);
      } else {
        setShowTelegram(true);
      }
    }
  }, [isPaid, missingTelegram]);

  const dismissThankYou = () => {
    const monthKey = new Date().toISOString().slice(0, 7);
    localStorage.setItem(`thankYouShown_${monthKey}`, 'true');
    setShowThankYou(false);
  };

  const dismissTelegram = () => {
    localStorage.setItem('telegramCampaignDismissed', 'true');
    setShowTelegram(false);
  };

  const submitTelegram = async () => {
    if (!telegramHandle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/members/update-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramHandle })
      });
      if (res.ok) {
        localStorage.setItem('telegramCampaignDismissed', 'true');
        setShowTelegram(false);
        // Let it fade or just close
      } else {
        alert('Erro ao salvar Telegram.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showThankYou && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>🎉</div>
            <h2 style={{ marginTop: 0, textAlign: 'center', color: 'var(--foreground)' }}>Pagamento Confirmado!</h2>
            <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Obrigado por manter o sistema rodando. Sua contribuição mensal já foi validada e o caixa da plataforma agradece! 🚀
            </p>
            <button onClick={dismissThankYou} style={primaryBtnStyle}>Excelente!</button>
          </div>
        </div>
      )}

      {showTelegram && !showThankYou && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>📱</div>
            <h2 style={{ marginTop: 0, textAlign: 'center', color: '#3b82f6' }}>Campanha: Integre seu Telegram</h2>
            <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Estamos preparando nosso bot autônomo (N8N) para enviar lembretes e alertas direto no seu celular. 
              Por favor, insira o seu <strong>@usuario</strong> do Telegram.
            </p>
            <input 
              type="text" 
              placeholder="@seu_usuario" 
              value={telegramHandle}
              onChange={e => setTelegramHandle(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button onClick={dismissTelegram} style={secondaryBtnStyle} disabled={loading}>Lembrar depois</button>
              <button onClick={submitTelegram} style={primaryBtnStyle} disabled={loading || !telegramHandle}>
                {loading ? 'Salvando...' : 'Salvar Telegram'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
  zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
};

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)', padding: '2rem', borderRadius: '16px',
  maxWidth: '400px', width: '100%', border: '1px solid var(--border)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 600,
  background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
};

const secondaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 600,
  background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none'
};
