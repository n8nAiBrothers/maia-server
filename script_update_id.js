const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.member.updateMany({
    where: { name: 'Flavio Santoro' },
    data: { telegramChatId: '8711460320' }
  });
  console.log("Banco atualizado: ", user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
