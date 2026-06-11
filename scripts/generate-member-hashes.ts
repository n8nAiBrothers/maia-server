import prisma from '../src/lib/prisma';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔑 Gerando hashes de acesso para o time Maia...\n');

  const members = await prisma.member.findMany({
    orderBy: { name: 'asc' }
  });

  const baseUrl = 'https://crm.waia88.com';
  const obsidianDir = '/Users/fsantoro/Desktop/Maia server/Knowledge_Base/02_Recursos';
  const obsidianFilePath = path.join(obsidianDir, 'Links_Acesso_Time.md');

  let markdownContent = `# 🔑 Links de Acesso Exclusivos — Maia Platform v4\n\n`;
  markdownContent += `Este documento contém as URLs de acesso exclusivas com hash de identificação para cada integrante do time.\n`;
  markdownContent += `> **⚠️ Atenção**: Não compartilhe estes links publicamente. Cada link define a identidade de quem o acessa.\n\n`;
  markdownContent += `| Nome | Função | Permissão Financeira | URL de Acesso |\n`;
  markdownContent += `|---|---|---|---|\n`;

  console.log('--------------------------------------------------');
  console.log('Membro | Função | URL de Acesso');
  console.log('--------------------------------------------------');

  for (const member of members) {
    let hash = member.accessHash;

    if (!hash) {
      hash = crypto.randomBytes(16).toString('hex');
      await prisma.member.update({
        where: { id: member.id },
        data: { accessHash: hash }
      });
      console.log(`✨ Hash gerado para ${member.name}`);
    } else {
      console.log(`ℹ️ Hash existente mantido para ${member.name}`);
    }

    const accessUrl = `${baseUrl}?token=${hash}`;
    const finStatus = member.canViewFinancials ? '✅ Sim (Total)' : '❌ Não (Restrito)';
    markdownContent += `| **${member.name}** | ${member.role} | ${finStatus} | [Acessar CRM](${accessUrl}) |\n`;
    
    console.log(`${member.name} (${member.role})`);
    console.log(`👉 Link: ${accessUrl}`);
    console.log('--------------------------------------------------');
  }

  // Grava arquivo no Obsidian se o diretório existir
  try {
    if (!fs.existsSync(obsidianDir)) {
      fs.mkdirSync(obsidianDir, { recursive: true });
    }
    fs.writeFileSync(obsidianFilePath, markdownContent, 'utf-8');
    console.log(`\n💾 Links salvos com sucesso no Obsidian:`);
    console.log(`   [Links_Acesso_Time.md](file://${obsidianFilePath})`);
  } catch (error) {
    console.error('⚠️ Erro ao salvar arquivo no Obsidian:', error);
  }

  console.log('\n✅ Concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao rodar script:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
