import prisma from '../../../lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FinanceActionButtons from './FinanceActionButtons';
import PeriodSelector from './PeriodSelector';
import ExpenseManager from './ExpenseManager';

// Função para calcular a interseção de meses ativos (amortização inteligente)
function getActiveMonthsIntersect(startA: Date, endA: Date, startB: Date, endB: Date) {
  const maxStart = new Date(Math.max(startA.getTime(), startB.getTime()));
  const minEnd = new Date(Math.min(endA.getTime(), endB.getTime()));
  if (maxStart > minEnd) return 0;
  
  const yearsDiff = minEnd.getFullYear() - maxStart.getFullYear();
  const monthsDiff = minEnd.getMonth() - maxStart.getMonth();
  return yearsDiff * 12 + monthsDiff + 1;
}

// Função para calcular o gasto caixa total (cash flow) desde o início até uma data limite
function getHistoricalCashDespesa(expense: any, targetEnd: Date) {
  if (expense.startDate > targetEnd) return 0;
  const endRef = expense.contractEndDate && expense.contractEndDate < targetEnd ? expense.contractEndDate : targetEnd;
  
  if (expense.billingCycle === 'one-time') {
    return expense.amount;
  }
  
  let months = (endRef.getFullYear() - expense.startDate.getFullYear()) * 12 + (endRef.getMonth() - expense.startDate.getMonth());
  months += 1;
  
  if (expense.billingCycle === 'monthly') {
    return expense.amount * months;
  }
  if (expense.billingCycle === 'yearly') {
    const years = Math.floor((months - 1) / 12) + 1;
    return expense.amount * years;
  }
  return 0;
}

export default async function FinanceiroPage(props: { searchParams?: Promise<{ period?: string }> }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('maia_session')?.value;

  if (!sessionToken) {
    redirect('/unauthorized');
  }

  const currentMember = await prisma.member.findUnique({
    where: { accessHash: sessionToken },
    select: { canViewFinancials: true }
  });

  if (!currentMember || !currentMember.canViewFinancials) {
    redirect('/unauthorized');
  }

  const searchParams = await props.searchParams;
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const period = searchParams?.period || currentMonth;

  let contributionsQuery: any = {};
  let targetDateStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let targetDateEnd = new Date(now.getFullYear(), now.getMonth(), 31);
  let periodTitle = "Mês Atual";

  if (period === '12m') {
    periodTitle = "Últimos 12 Meses";
    targetDateStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const minMonth = targetDateStart.toISOString().slice(0, 7);
    contributionsQuery = { referenceMonth: { gte: minMonth } };
  } else if (period === '2026') {
    periodTitle = "Ano de 2026";
    contributionsQuery = { referenceMonth: { startsWith: '2026-' } };
    targetDateStart = new Date(2026, 0, 1); // 1 Jan 2026
    targetDateEnd = new Date(2026, 11, 31); // 31 Dec 2026
  } else if (period === 'all') {
    periodTitle = "Histórico Completo";
    contributionsQuery = {}; // get all
    const firstExpense = await prisma.platformExpense.findFirst({ orderBy: { startDate: 'asc' } });
    targetDateStart = firstExpense?.startDate || new Date('2026-05-01');
    targetDateStart = new Date(targetDateStart.getFullYear(), targetDateStart.getMonth(), 1);
  } else {
    periodTitle = period; // YYYY-MM
    contributionsQuery = { referenceMonth: period };
    const [year, month] = period.split('-').map(Number);
    targetDateStart = new Date(year, month - 1, 1);
    targetDateEnd = new Date(year, month, 0); // last day of the month
  }

  const [contributions, expenses] = await Promise.all([
    prisma.memberContribution.findMany({
      where: contributionsQuery,
      include: { member: { select: { id: true, name: true } } },
      orderBy: { member: { name: 'asc' } },
    }),
    prisma.platformExpense.findMany({
      orderBy: { amount: 'desc' },
    })
  ]);

  const totalReceita = contributions.reduce((s, c) => s + c.amount, 0);
  const paidReceita = contributions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const pendingReceita = contributions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount, 0);

  // Amortização Dinâmica das Despesas
  let totalDespesa = 0;
  let despesaAnual = 0; // projeção anual
  const isSingleMonth = period.match(/^\d{4}-\d{2}$/) !== null;
  
  expenses.forEach(e => {
    // Para a projeção fixa, usamos as despesas ativas no momento atual
    if (!e.contractEndDate || e.contractEndDate >= now) {
      if (e.billingCycle === 'monthly') despesaAnual += e.amount * 12;
      if (e.billingCycle === 'yearly') despesaAnual += e.amount;
    }

    const startB = new Date(e.startDate.getFullYear(), e.startDate.getMonth(), 1);
    const endRef = (e.billingCycle === 'one-time') ? e.startDate : (e.contractEndDate || now);
    const endB = new Date(endRef.getFullYear(), endRef.getMonth(), 31);

    const activeMonths = getActiveMonthsIntersect(targetDateStart, targetDateEnd, startB, endB);
    
    if (activeMonths > 0) {
      if (e.billingCycle === 'monthly') {
        totalDespesa += e.amount * activeMonths;
      } else if (e.billingCycle === 'yearly') {
        if (isSingleMonth) {
          if (e.startDate.getMonth() === targetDateStart.getMonth()) {
            totalDespesa += e.amount; // Regime de Caixa (Desembolso integral no mês de aniversário)
          }
        } else {
          totalDespesa += (e.amount / 12) * activeMonths; // Rateio (Amortização para visões amplas)
        }
      } else if (e.billingCycle === 'one-time') {
        totalDespesa += e.amount;
      }
    }
  });

  // Cálculo do Caixa Acumulado (Histórico de entradas vs saídas reais até o final do período alvo)
  let caixaAcumulado = 0;
  const targetMonthStr = targetDateEnd.toISOString().slice(0, 7);
  
  const allContributionsQuery = await prisma.memberContribution.findMany();
  allContributionsQuery.forEach(c => {
    if (c.referenceMonth <= targetMonthStr && c.status === 'paid') {
      caixaAcumulado += c.amount;
    }
  });

  expenses.forEach(e => {
    caixaAcumulado -= getHistoricalCashDespesa(e, targetDateEnd);
  });

  // O Saldo e a Margem agora são baseados apenas no que realmente entrou em caixa!
  const saldo = paidReceita - totalDespesa;
  const margem = paidReceita > 0 ? Math.round((saldo / paidReceita) * 100) : 0;
  
  // Projeção baseada apenas na arrecadação do mês atual vs despesas anuais projetadas
  const receitaAnual = (contributions.length > 0 && period.match(/^\d{4}-\d{2}$/) ? totalReceita : (contributions.length / (period === '12m' ? 12 : 1)) * 200) * 12;
  const sobraAnual = receitaAnual - despesaAnual;

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">💰 Financeiro</h1>
          <p className="dashboard-subtitle">
            Gestão Ativa — <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{periodTitle}</span>
            <span className="badge purple" style={{ marginLeft: '0.5rem' }}>🔒 Controllers</span>
          </p>
        </div>
      </div>

      <PeriodSelector />

      {/* Balanço Dinâmico */}
      <div className="finance-grid">
        <div className="finance-card receita">
          <div className="finance-label">Receita no Período (Recebida)</div>
          <div className="finance-value positive">R$ {paidReceita.toFixed(0)}</div>
          <div className="kpi-detail">Esperado: R$ {totalReceita.toFixed(0)} (Falta R$ {totalReceita - paidReceita})</div>
        </div>
        <div className="finance-card despesa">
          <div className="finance-label">Despesas no Período</div>
          <div className="finance-value negative">R$ {totalDespesa.toFixed(0)}</div>
          <div className="kpi-detail">{isSingleMonth ? 'Visão de Caixa' : 'Rateado no período'}</div>
        </div>
        <div className="finance-card saldo">
          <div className="finance-label">Saldo ({periodTitle})</div>
          <div className={`finance-value ${saldo >= 0 ? 'positive' : 'negative'}`}>R$ {saldo.toFixed(0)}</div>
          <div className="kpi-detail">{margem}% de margem</div>
        </div>
        <div className="finance-card saldo" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="finance-label">Caixa Acumulado Global</div>
          <div className={`finance-value ${caixaAcumulado >= 0 ? 'positive' : 'negative'}`} style={{ color: caixaAcumulado >= 0 ? '#34d399' : '#f43f5e' }}>R$ {caixaAcumulado.toFixed(0)}</div>
          <div className="kpi-detail">Reservas até o fim do período</div>
        </div>
      </div>

      {/* Projeção Anual Contínua */}
      {period.match(/^\d{4}-\d{2}$/) && (
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card green">
            <span className="kpi-icon">📈</span>
            <div className="kpi-label">Projeção de Receita Anual</div>
            <div className="kpi-value">R$ {receitaAnual.toLocaleString('pt-BR')}</div>
          </div>
          <div className="kpi-card rose">
            <span className="kpi-icon">📉</span>
            <div className="kpi-label">Projeção de Despesa Anual</div>
            <div className="kpi-value">R$ {despesaAnual.toFixed(0)}</div>
          </div>
          <div className="kpi-card purple">
            <span className="kpi-icon">💎</span>
            <div className="kpi-label">Sobra p/ Investimento</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>R$ {sobraAnual.toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* Contribuições */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">💳 Entradas (Arrecadação do Time)</h2>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Membro</th>
                <th>Mês de Ref.</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Pago em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.member.name}</td>
                  <td>{c.referenceMonth}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>R$ {c.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${c.status === 'paid' ? 'green' : c.status === 'under_review' ? 'blue' : c.status === 'pending' ? 'amber' : 'rose'}`}>
                      {c.status === 'paid' ? '🟢 Pago' : c.status === 'under_review' ? '🔵 Em Análise' : c.status === 'pending' ? '🟡 Pendente' : '🔴 Atrasado'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{c.paidAt ? new Date(c.paidAt).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>
                    <FinanceActionButtons 
                      contributionId={c.id} 
                      status={c.status} 
                      receiptUrl={c.receiptUrl} 
                    />
                  </td>
                </tr>
              ))}
              {contributions.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma contribuição neste período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gerenciador de Despesas e Contratos */}
      <div className="section">
        <ExpenseManager expenses={expenses} totalDespesa={totalDespesa} />
      </div>
    </>
  );
}
