import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/financeiro/balance — Balanço mensal (Receita vs Despesas)
// 🔒 Acesso restrito: canViewFinancials = true
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // "2026-06"

    // Receita: Contribuições do mês
    const contributions = await prisma.memberContribution.findMany({
      where: { referenceMonth: month },
      include: { member: { select: { id: true, name: true } } },
    });

    const totalReceita = contributions.reduce((s: any, c: any) => s + c.amount, 0);
    const paidReceita = contributions.filter((c: any) => c.status === 'paid').reduce((s: any, c: any) => s + c.amount, 0);
    const pendingReceita = contributions.filter((c: any) => c.status === 'pending' || c.status === 'under_review').reduce((s: any, c: any) => s + c.amount, 0);
    const lateReceita = contributions.filter((c: any) => c.status === 'late').reduce((s: any, c: any) => s + c.amount, 0);

    // Despesas: fixas + variáveis do mês
    const expenses = await prisma.platformExpense.findMany({
      where: {
        OR: [
          { referenceMonth: month },
          { referenceMonth: null, status: 'active' }, // Despesas recorrentes sem mês específico
        ],
      },
      orderBy: { amount: 'desc' },
    });

    const monthlyExpenses = expenses.filter((e: any) => e.billingCycle === 'monthly');
    const yearlyExpenses = expenses.filter((e: any) => e.billingCycle === 'yearly');
    const oneTimeExpenses = expenses.filter((e: any) => e.billingCycle === 'one-time');

    const totalDespesaMensal = monthlyExpenses.reduce((s: any, e: any) => s + e.amount, 0);
    const totalDespesaAnualProporcional = yearlyExpenses.reduce((s: any, e: any) => s + e.amount / 12, 0);
    const totalDespesa = totalDespesaMensal + totalDespesaAnualProporcional;

    // Saldo
    const saldo = totalReceita - totalDespesa;
    const margem = totalReceita > 0 ? Math.round((saldo / totalReceita) * 100) : 0;

    // Projeção anual
    const receitaAnual = totalReceita * 12;
    const despesaAnual = totalDespesaMensal * 12 + yearlyExpenses.reduce((s: any, e: any) => s + e.amount, 0);
    const sobraAnual = receitaAnual - despesaAnual;

    return NextResponse.json({
      success: true,
      month,
      receita: {
        total: totalReceita,
        paid: paidReceita,
        pending: pendingReceita,
        late: lateReceita,
        contributions: contributions.map((c: any) => ({
          id: c.id,
          memberName: c.member.name,
          memberId: c.member.id,
          amount: c.amount,
          status: c.status,
          paidAt: c.paidAt,
          paymentMethod: c.paymentMethod,
        })),
      },
      despesas: {
        totalMensal: Math.round(totalDespesa * 100) / 100,
        fixas: monthlyExpenses.map((e: any) => ({
          id: e.id,
          name: e.name,
          provider: e.provider,
          category: e.category,
          amount: e.amount,
          renewalDay: e.renewalDay,
          isPaid: e.isPaid,
        })),
        anuaisProporcional: yearlyExpenses.map((e: any) => ({
          id: e.id,
          name: e.name,
          provider: e.provider,
          amount: e.amount,
          amountMonthly: Math.round((e.amount / 12) * 100) / 100,
        })),
        oneTime: oneTimeExpenses.map((e: any) => ({
          id: e.id,
          name: e.name,
          amount: e.amount,
        }))
      },
      saldo: {
        valor: Math.round(saldo * 100) / 100,
        margem,
        status: saldo >= 0 ? 'positivo' : 'negativo',
      },
      projecaoAnual: {
        receita: receitaAnual,
        despesa: Math.round(despesaAnual * 100) / 100,
        sobra: Math.round(sobraAnual * 100) / 100,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
