import prisma from '../src/lib/prisma';
import crypto from 'crypto';

async function main() {
  console.log('🚀 Seeding Plataforma Maia v4...\n');

  // ==========================================
  // 1. MEMBROS DO TIME (upsert por nome)
  // ==========================================
  const teamMembers = [
    {
      name: 'Flavio Santoro',
      role: 'Fundador',
      roles: ['founder', 'developer', 'designer', 'moderator', 'controller'],
      canViewFinancials: true,
      tier: 'standard',
    },
    {
      name: 'Dario dos Santos',
      role: 'Co-Fundador',
      roles: ['founder', 'controller'],
      canViewFinancials: true,
      tier: 'standard',
    },
    {
      name: 'Marcio Botelho',
      role: 'Dev / Moderador',
      roles: ['developer', 'moderator'],
      canViewFinancials: false,
      tier: 'standard',
    },
    {
      name: 'Klaus Lucas',
      role: 'Dev',
      roles: ['developer'],
      canViewFinancials: false,
      tier: 'standard',
    },
    {
      name: 'Luciano Reisner',
      role: 'Dev',
      roles: ['developer'],
      canViewFinancials: false,
      tier: 'standard',
    },
    {
      name: 'Alexandre Mendes',
      role: 'Dev',
      roles: ['developer'],
      canViewFinancials: false,
      tier: 'standard',
    },
  ];

  const members: Record<string, any> = {};
  for (const m of teamMembers) {
    // Try to find existing member by name
    const existing = await prisma.member.findFirst({ where: { name: m.name } });
    if (existing) {
      const updated = await prisma.member.update({
        where: { id: existing.id },
        data: {
          role: m.role,
          roles: m.roles,
          canViewFinancials: m.canViewFinancials,
          tier: m.tier,
          isActive: true,
          accessHash: existing.accessHash || crypto.randomBytes(16).toString('hex'),
        },
      });
      members[m.name] = updated;
      console.log(`  ✅ Atualizado: ${m.name} (${updated.id})`);
    } else {
      const created = await prisma.member.create({
        data: {
          ...m,
          accessHash: crypto.randomBytes(16).toString('hex'),
        }
      });
      members[m.name] = created;
      console.log(`  ✅ Criado: ${m.name} (${created.id})`);
    }
  }

  // ==========================================
  // 2. ASSINATURAS LLM
  // ==========================================
  console.log('\n📋 Criando assinaturas LLM...');

  const subs = await Promise.all([
    prisma.llmSubscription.create({
      data: {
        provider: 'google',
        planName: 'Google AI Pro 5TB',
        renewalDay: 18,
        monthlyCost: 149.90,
        isLocal: false,
        status: 'active',
      },
    }),
    prisma.llmSubscription.create({
      data: {
        provider: 'anthropic',
        planName: 'Claude Pro',
        renewalDay: 21,
        monthlyCost: 112.00,
        isLocal: false,
        status: 'active',
      },
    }),
    prisma.llmSubscription.create({
      data: {
        provider: 'ollama',
        planName: 'Gemma 4 (26B) Local',
        monthlyCost: 0,
        isLocal: true,
        status: 'active',
      },
    }),
    prisma.llmSubscription.create({
      data: {
        provider: 'ollama',
        planName: 'Gemma 2 (9B) Local',
        monthlyCost: 0,
        isLocal: true,
        status: 'active',
      },
    }),
  ]);

  for (const s of subs) {
    console.log(`  ✅ ${s.planName} (${s.provider}) — R$ ${s.monthlyCost?.toFixed(2) || '0.00'}/mês`);
  }

  // ==========================================
  // 3. QUOTAS POR MEMBRO (500k tokens/mês)
  // ==========================================
  console.log('\n📊 Criando quotas...');

  const now = new Date();
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Último dia do mês

  for (const [name, member] of Object.entries(members)) {
    // Check if quota already exists
    const existingQuota = await prisma.memberQuota.findUnique({
      where: { memberId: member.id },
    });
    if (!existingQuota) {
      await prisma.memberQuota.create({
        data: {
          memberId: member.id,
          monthlyTokenLimit: BigInt(500000),
          cycleEndDate: cycleEnd,
          overagePolicy: 'warn',
          tier: 'standard',
        },
      });
      console.log(`  ✅ Quota: ${name} → 500.000 tokens/mês`);
    } else {
      console.log(`  ⏭️  Quota já existe: ${name}`);
    }
  }

  // ==========================================
  // 4. CONTRIBUIÇÕES INICIAIS (Jun/2026)
  // ==========================================
  console.log('\n💰 Criando contribuições (Jun/2026)...');

  const refMonth = '2026-06';
  for (const [name, member] of Object.entries(members)) {
    try {
      await prisma.memberContribution.create({
        data: {
          memberId: member.id,
          amount: 200.00,
          referenceMonth: refMonth,
          status: 'pending',
        },
      });
      console.log(`  ✅ ${name}: R$ 200,00 (${refMonth}) — Pendente`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`  ⏭️  Contribuição já existe: ${name} (${refMonth})`);
      } else throw e;
    }
  }

  // ==========================================
  // 5. DESPESAS DA PLATAFORMA
  // ==========================================
  console.log('\n📋 Criando despesas da plataforma...');

  const expenses = [
    {
      category: 'llm_subscription',
      name: 'Google AI Pro 5TB',
      provider: 'google',
      amount: 149.90,
      billingCycle: 'monthly',
      renewalDay: 18,
      referenceMonth: refMonth,
      status: 'active',
      subscriptionId: subs[0].id,
    },
    {
      category: 'llm_subscription',
      name: 'Claude Pro',
      provider: 'anthropic',
      amount: 112.00,
      billingCycle: 'monthly',
      renewalDay: 21,
      referenceMonth: refMonth,
      status: 'active',
      subscriptionId: subs[1].id,
    },
    {
      category: 'hosting',
      name: 'Cloudflare Zero Trust (Free)',
      provider: 'cloudflare',
      amount: 0,
      billingCycle: 'monthly',
      referenceMonth: refMonth,
      status: 'active',
    },
    {
      category: 'domain',
      name: 'Domínio waia88.com',
      provider: 'namecheap',
      amount: 75.60,
      billingCycle: 'yearly',
      referenceMonth: refMonth,
      status: 'active',
      notes: 'Renovação anual — Nov/2026',
    },
    {
      category: 'infrastructure',
      name: 'Ollama (LLM Local)',
      provider: 'ollama',
      amount: 0,
      billingCycle: 'monthly',
      referenceMonth: refMonth,
      status: 'active',
      notes: 'Custo zero — roda local no Mac M5 Pro',
    },
  ];

  for (const exp of expenses) {
    await prisma.platformExpense.create({ data: exp });
    console.log(`  ✅ ${exp.name}: R$ ${exp.amount.toFixed(2)}/${exp.billingCycle}`);
  }

  // ==========================================
  // 6. PROJETOS INICIAIS
  // ==========================================
  console.log('\n🚀 Criando projetos...');

  const board = await prisma.board.findFirst();

  const projects = [
    {
      name: 'CRM Maia',
      description: 'Aplicativo de gestão Kanban integrado com Telegram e IA',
      type: 'webapp',
      boardId: board?.id,
      repoUrl: 'file:///Users/fsantoro/Desktop/Projetos/crm-app',
      deployUrl: 'https://crm.waia88.com',
      techStack: ['Next.js', 'React', 'Prisma', 'PostgreSQL', 'TypeScript'],
      ownerId: members['Flavio Santoro']?.id,
      progress: 70,
      status: 'active',
    },
    {
      name: 'SSASSA',
      description: 'Cérebro de leilões e atendimento ao cliente',
      type: 'webapp',
      techStack: ['Next.js', 'PostgreSQL', 'n8n'],
      ownerId: members['Flavio Santoro']?.id,
      progress: 60,
      status: 'active',
    },
    {
      name: 'Chatblot',
      description: 'Automação de chat e interface conversacional',
      type: 'app',
      techStack: ['Node.js', 'Telegram API', 'Ollama'],
      ownerId: members['Marcio Botelho']?.id,
      progress: 20,
      status: 'active',
    },
    {
      name: 'Projeto Maia (IA Companheira)',
      description: 'Desenvolvimento da IA Companheira pessoal',
      type: 'initiative',
      techStack: ['n8n', 'Ollama', 'Obsidian', 'PostgreSQL'],
      ownerId: members['Flavio Santoro']?.id,
      progress: 40,
      status: 'active',
    },
  ];

  for (const proj of projects) {
    await prisma.project.create({ data: proj });
    console.log(`  ✅ ${proj.name} (${proj.type}) — ${proj.progress}%`);
  }

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETO — Plataforma Maia v4');
  console.log('='.repeat(50));
  console.log(`  👥 Membros: ${Object.keys(members).length}`);
  console.log(`  📋 Assinaturas LLM: ${subs.length}`);
  console.log(`  📊 Quotas: ${Object.keys(members).length}`);
  console.log(`  💰 Contribuições: ${Object.keys(members).length} × R$ 200,00 = R$ ${Object.keys(members).length * 200},00`);
  console.log(`  📋 Despesas: ${expenses.length}`);
  console.log(`  🚀 Projetos: ${projects.length}`);
  console.log(`  💳 Receita mensal: R$ ${Object.keys(members).length * 200},00`);
  console.log(`  💸 Despesas mensal: R$ ${expenses.reduce((s, e) => s + (e.billingCycle === 'monthly' ? e.amount : 0), 0).toFixed(2)}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
