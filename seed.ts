import prisma from './src/lib/prisma'

async function main() {
  await prisma.card.deleteMany(); // Clear existing cards
  
  const board = await prisma.board.findFirst();
  if (!board) return;

  const getList = async (id: string) => {
    return prisma.list.findUnique({ where: { id } });
  }

  // Calculate dates based on today (Day 1)
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Noon

  const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days - 1); // Day 1 = +0
    return d;
  }

  const tasks = [
    { title: "Setup Maia Server", description: "Revisão final da infraestrutura, estabilidade do servidor e ajustes básicos.", priority: "High", listId: "primeiros_passos", dueDate: addDays(1), assignee: "Maia" },
    { title: "Obsidian Cloud (Cérebro)", description: "Setup do Obsidian na nuvem para compartilhamento. Fluxo de leitura/escrita colaborativa.", priority: "Medium", listId: "primeiros_passos", dueDate: addDays(2), assignee: "Equipe" },
    { title: "Comportamento da Maia", description: "Regras de comportamento agêntico: criar fluxos para aprender e ensinar alimentando o Obsidian.", priority: "High", listId: "primeiros_passos", dueDate: addDays(3), assignee: "Maia" },
    { title: "Formatação Rica & Skills", description: "Respostas ricas (planilhas, tabelas, links). Instalação de Skills/APIs.", priority: "Medium", listId: "segundos_passos", dueDate: addDays(4), assignee: "Maia" },
    { title: "Skills e Multimídia", description: "Imagens, vídeos e arquitetura para voz em tempo real.", priority: "Medium", listId: "segundos_passos", dueDate: addDays(5), assignee: "FSantoro" },
    { title: "Mercados (Horizontal)", description: "Mapeamento omnichannel, Marketing e ferramentas base.", priority: "Low", listId: "segundos_passos", dueDate: addDays(6), assignee: "Equipe" },
    { title: "Mercados (Vertical)", description: "Nichos específicos: E-commerce, Leilão, Arquitetura, RAG.", priority: "Low", listId: "segundos_passos", dueDate: addDays(7), assignee: "Equipe" },
    { title: "App Cronograma (Proj 01) - Arquitetura", description: "Definição da Arquitetura, UI/UX e banco de dados (Prisma).", priority: "High", listId: "execucao", dueDate: addDays(8), assignee: "FSantoro" },
    { title: "App Cronograma (Proj 01) - Mão na massa", description: "Desenvolvimento do frontend e backend.", priority: "High", listId: "execucao", dueDate: addDays(9), assignee: "Maia" },
    { title: "App Cronograma (Proj 01) - Testes", description: "Testes finais e polimento da interface premium.", priority: "High", listId: "execucao", dueDate: addDays(10), assignee: "Equipe" }
  ]

  for (const task of tasks) {
    await prisma.card.create({
      data: task
    });
  }

  console.log("Database seeded with Chronogram Tasks!");
}

main().catch(e => console.error(e)).finally(() => process.exit(0))
