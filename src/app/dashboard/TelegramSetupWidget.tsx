"use client";

import React, { useState } from 'react';

export default function TelegramSetupWidget({ 
  hasTelegram, 
  memberName 
}: { 
  hasTelegram: boolean; 
  memberName: string 
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (hasTelegram) return null;

  return (
    <div style={{
      background: 'var(--surface-hover)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>🤖</div>
        <div>
          <h3 style={{ margin: 0, color: 'var(--foreground)' }}>Assistente de Integração Maia</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Olá, {memberName}! Notei que o seu Telegram ainda não está vinculado ao CRM.
          </p>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            marginLeft: 'auto', 
            padding: '0.5rem 1rem', 
            background: 'var(--primary)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 500
          }}>
          {isOpen ? 'Esconder Instruções' : 'Como Vincular?'}
        </button>
      </div>

      {isOpen && (
        <div style={{ 
          background: 'var(--background)', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          border: '1px solid var(--border)',
          marginTop: '0.5rem'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--foreground)' }}>Passo a Passo para Vincular seu Telegram:</h4>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li>Abra o seu aplicativo do Telegram no celular ou computador.</li>
            <li>Busque pelo nosso bot oficial: <strong>@Maia_Chat_Bot</strong></li>
            <li>Envie qualquer mensagem para o bot (ex: "Oi", "Olá").</li>
            <li>Pronto! O bot (Sasá) irá automaticamente identificar o seu usuário e vincular ao seu perfil no CRM.</li>
          </ol>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--foreground)' }}>
              <strong>Por que fazer isso?</strong><br/>
              Ao vincular o seu Telegram, o CRM MaiA poderá enviar notificações automáticas sobre projetos, validações financeiras de infraestrutura e alertas sobre as suas cotas mensais de Tokens de Inteligência Artificial.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
