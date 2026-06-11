"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function ExpenseManager({ expenses, totalDespesa }: { expenses: any[], totalDespesa: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState('infrastructure');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [contractType, setContractType] = useState('continuous');
  const [startDate, setStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [cancelDeadline, setCancelDeadline] = useState('');

  const parseDateBR = (brStr: string) => {
    if (!brStr || brStr.length !== 10) return '';
    const [day, month, year] = brStr.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (val: string, setter: (v: string) => void) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
    if (v.length > 5) v = v.substring(0, 5) + '/' + v.substring(5, 9);
    setter(v);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName(''); setProvider(''); setAmount(''); setContractEndDate(''); setCancelDeadline(''); setStartDate('');
    setCategory('infrastructure'); setBillingCycle('monthly'); setContractType('continuous');
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setName(expense.name);
    setProvider(expense.provider);
    setCategory(expense.category);
    setAmount(expense.amount.toFixed(2).replace('.', ','));
    setBillingCycle(expense.billingCycle);
    setContractType(expense.contractType || 'continuous');
    
    // Convert YYYY-MM-DD to DD/MM/YYYY for the state
    if (expense.startDate) {
      const d = new Date(expense.startDate);
      setStartDate(`${String(d.getDate() + 1).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    } else {
      setStartDate('');
    }

    if (expense.contractEndDate) {
      const d = new Date(expense.contractEndDate);
      setContractEndDate(`${String(d.getDate() + 1).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    } else {
      setContractEndDate('');
    }
    
    if (expense.cancelDeadline) {
      const d = new Date(expense.cancelDeadline);
      setCancelDeadline(`${String(d.getDate() + 1).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    } else {
      setCancelDeadline('');
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir essa despesa permanentemente?')) return;
    setLoading(true);
    await fetch(`/api/financeiro/expenses?id=${id}`, { method: 'DELETE' });
    setLoading(false);
    router.refresh();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? 'PATCH' : 'POST';
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name, provider, category, contractType,
      amount: amount.replace(',', '.'), 
      billingCycle, 
      startDate: parseDateBR(startDate) || null,
      contractEndDate: parseDateBR(contractEndDate) || null,
      cancelDeadline: parseDateBR(cancelDeadline) || null
    };

    await fetch('/api/financeiro/expenses', {
      method,
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    setLoading(false);
    setIsModalOpen(false);
    resetForm();
    router.refresh();
  };

  return (
    <>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title" style={{ margin: 0 }}>📋 Despesas da Plataforma</h2>
        <button 
          onClick={openNewModal}
          style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Nova Despesa
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Valor</th>
              <th>Ciclo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => {
              // Checagem de contrato
              const isContract = e.contractType === 'fixed_term';
              let contractStatus = 'Contínuo';
              let statusColor = 'green';
              
              if (isContract && e.cancelDeadline) {
                const deadline = new Date(e.cancelDeadline);
                const today = new Date();
                const diffTime = deadline.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                  contractStatus = 'Renovação Iminente / Atrasado';
                  statusColor = 'rose';
                } else if (diffDays <= 30) {
                  contractStatus = `Atenção: ${diffDays} dias para cancelar`;
                  statusColor = 'amber';
                } else {
                  contractStatus = `Vence em ${new Date(e.contractEndDate).toLocaleDateString('pt-BR')}`;
                  statusColor = 'blue';
                }
              } else if (isContract) {
                contractStatus = 'Fixo';
                statusColor = 'blue';
              }

              return (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {e.name}
                      {isContract && <span className={`badge ${statusColor}`} style={{ fontSize: '0.65rem' }}>{contractStatus}</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge blue" style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }}>{e.provider}</span>
                      <span className={`badge ${e.category === 'llm_subscription' ? 'purple' : e.category === 'domain' ? 'amber' : 'green'}`} style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }}>{e.category}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>R$ {e.amount.toFixed(2)}</td>
                  <td>{e.billingCycle === 'monthly' ? 'Mensal' : e.billingCycle === 'yearly' ? 'Anual' : 'Único'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEdit(e)}
                        disabled={loading}
                        title="Editar"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(e.id)}
                        disabled={loading}
                        title="Excluir"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#f43f5e' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: 700, background: 'var(--surface-hover)' }}>
              <td>TOTAL EFETIVO NO PERÍODO</td>
              <td>R$ {totalDespesa.toFixed(2)}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {isModalOpen && mounted && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '100%', position: 'relative', border: '1px solid var(--border)' }}>
            <button 
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: 'var(--text-muted)', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--foreground)' }}>
              {editingId ? '✏️ Editar Despesa' : 'Cadastrar Despesa'}
            </h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nome da Despesa</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Domínio Google" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Provider / Empresa</label>
                  <input required value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Ex: Registro.br" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor (R$)</label>
                  <input required type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="0,00" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Categoria</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="infrastructure">Infraestrutura / VPS</option>
                    <option value="domain">Domínio</option>
                    <option value="llm_subscription">Assinatura LLM</option>
                    <option value="storage">Storage</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ciclo de Fatura</label>
                  <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                    <option value="one-time">Único</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Tipo de Contrato</label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', marginBottom: '1rem' }}>
                  <option value="continuous">Contínuo (Renovação Automática/Assinatura)</option>
                  <option value="fixed_term">Contrato Fixo (Exige Renovação/Cancelamento)</option>
                </select>

                {contractType === 'continuous' && (
                  <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Data de Cobrança / Início (DD/MM/AAAA)</label>
                    <input required type="text" placeholder="Ex: 05/06/2026" value={startDate} onChange={(e) => handleDateChange(e.target.value, setStartDate)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>O dia digitado será considerado o dia de vencimento nos meses seguintes.</p>
                  </div>
                )}

                {contractType === 'fixed_term' && (
                  <div style={{ display: 'flex', gap: '1rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vencimento (Opcional)</label>
                      <input type="text" placeholder="DD/MM/AAAA" value={contractEndDate} onChange={(e) => handleDateChange(e.target.value, setContractEndDate)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Prazo Cancelar (Opcional)</label>
                      <input type="text" placeholder="DD/MM/AAAA" value={cancelDeadline} onChange={(e) => handleDateChange(e.target.value, setCancelDeadline)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ marginTop: '1rem', padding: '0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
              >
                {loading ? 'Salvando...' : '💾 Salvar Despesa'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
