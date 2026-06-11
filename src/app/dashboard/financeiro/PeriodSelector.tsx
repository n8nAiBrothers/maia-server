"use client";
import { useRouter, useSearchParams } from 'next/navigation';

export default function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || new Date().toISOString().slice(0, 7);

  const setPeriod = (p: string) => {
    router.push(`/dashboard/financeiro?period=${p}`);
  };

  const isMonth = currentPeriod.match(/^\d{4}-\d{2}$/);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
      <button 
        onClick={() => setPeriod(new Date().toISOString().slice(0, 7))}
        style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: isMonth ? 'var(--surface-hover)' : 'transparent', color: isMonth ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: isMonth ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
      >
        📅 Mês Atual
      </button>
      <button 
        onClick={() => setPeriod('12m')}
        style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: currentPeriod === '12m' ? 'var(--surface-hover)' : 'transparent', color: currentPeriod === '12m' ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: currentPeriod === '12m' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
      >
        📊 Últimos 12 Meses
      </button>
      <button 
        onClick={() => setPeriod('2026')}
        style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: currentPeriod === '2026' ? 'var(--surface-hover)' : 'transparent', color: currentPeriod === '2026' ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: currentPeriod === '2026' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
      >
        🗓️ Ano 2026
      </button>
      <button 
        onClick={() => setPeriod('all')}
        style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: currentPeriod === 'all' ? 'var(--surface-hover)' : 'transparent', color: currentPeriod === 'all' ? 'var(--foreground)' : 'var(--text-muted)', fontWeight: currentPeriod === 'all' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
      >
        📈 Máximo (Histórico Completo)
      </button>
    </div>
  );
}
