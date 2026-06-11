const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.member.findUnique({
    where: { name: 'Flavio Santoro' }
  });
  console.log(user.accessHash);
}
main().catch(console.error).finally(() => prisma.$disconnect());
