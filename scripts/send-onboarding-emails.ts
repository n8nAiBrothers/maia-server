import prisma from '../src/lib/prisma';
import nodemailer from 'nodemailer';

// Mapeamento de emails sugeridos para o time
const emailMapping: Record<string, string> = {
  'Flavio Santoro': 'flaviosantoro@gmail.com',
  'Dario dos Santos': 'dariosnow777@gmail.com',
  'Marcio Botelho': 'marcioedubotelho@gmail.com',
  'Klaus Lucas': 'klaus.sap@gmail.com',
  'Luciano Reisner': 'lureisner@gmail.com',
  'Alexandre Mendes': 'alessmendes34@gmail.com'
};

async function main() {
  console.log('🚀 Iniciando envio de e-mails de onboarding da Maia Platform v4...\n');

  // 1. Obter membros do banco de dados
  const members = await prisma.member.findMany({
    where: { isActive: true }
  });

  // 2. Configurar o transportador de e-mail (usar SMTP customizado ou criar conta de teste Ethereal)
  let transporter: nodemailer.Transporter;
  let isTestAccount = false;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    console.log(`📧 Utilizando SMTP customizado configurado: ${smtpHost}`);
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } else {
    console.log('ℹ️ SMTP não configurado no ambiente. Criando conta de testes temporária via Ethereal Email...');
    const testAccount = await nodemailer.createTestAccount();
    isTestAccount = true;
    console.log(`   Usuário de Teste: ${testAccount.user}`);
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // 3. Iterar sobre os membros e enviar o e-mail
  for (const member of members) {
    const email = emailMapping[member.name] || `${member.name.toLowerCase().replace(/\s+/g, '')}@waia88.com`;
    const token = member.accessHash;

    if (!token) {
      console.log(`⚠️ Membro ${member.name} não possui hash de acesso. Pulando...`);
      continue;
    }

    // Atualizar e-mail no banco de dados se for nulo
    if (!member.email) {
      await prisma.member.update({
        where: { id: member.id },
        data: { email: email }
      });
      console.log(`💾 E-mail do banco de dados atualizado para ${member.name}: ${email}`);
    }

    const accessUrl = `https://crm.waia88.com?token=${token}`;
    const initials = member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    // Template HTML Premium com a identidade visual escura da Maia
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo à Plataforma Maia v4</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090a0f; color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090a0f; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #11121b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; line-height: 48px; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-align: center;">M</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Plataforma Maia v4</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #a5b4fc; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Onboarding de Acesso</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <p style="font-size: 16px; line-height: 1.6; color: #e5e7eb; margin-top: 0;">
                      Olá, <strong>${member.name}</strong>,
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #9ca3af;">
                      Você foi convidado para acessar a nova <strong>Plataforma Unificada Maia v4</strong>. Nosso workspace integra o gerenciador de tarefas Kanban com controle financeiro, métricas de consumo de tokens e agendamento de agentes autônomos.
                    </p>
                    
                    <!-- Info Box -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; margin: 25px 0; padding: 15px;">
                      <tr>
                        <td>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding-bottom: 8px; font-size: 13px; color: #9ca3af;">Função na Equipe:</td>
                              <td style="padding-bottom: 8px; font-size: 13px; color: #ffffff; font-weight: bold; text-align: right;">${member.role}</td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 8px; font-size: 13px; color: #9ca3af;">Acesso Financeiro:</td>
                              <td style="padding-bottom: 8px; font-size: 13px; color: ${member.canViewFinancials ? '#34d399' : '#9ca3af'}; font-weight: bold; text-align: right;">${member.canViewFinancials ? 'Liberado (Controller)' : 'Restrito (Developer)'}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 13px; color: #9ca3af;">Quota Inicial:</td>
                              <td style="font-size: 13px; color: #a5b4fc; font-weight: bold; text-align: right;">500.000 tokens/mês</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 15px; line-height: 1.6; color: #9ca3af; margin-bottom: 30px;">
                      Para entrar com seu perfil e iniciar a sessão, clique no botão exclusivo abaixo. Você não precisará de senha; o hash no link garantirá sua autenticação automática e manterá sua sessão ativa.
                    </p>

                    <!-- Button -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${accessUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">Acessar Plataforma</a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 12px; line-height: 1.5; color: #6b7280; margin-top: 35px; text-align: center;">
                      Este link é de uso pessoal e intransferível.<br />
                      Se o botão não funcionar, copie e cole o seguinte endereço no navegador:<br />
                      <a href="${accessUrl}" style="color: #818cf8; text-decoration: none; word-break: break-all;">${accessUrl}</a>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #0e0f17; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">&copy; 2026 Maia Company. Todos os direitos reservados.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Enviar mensagem
    const mailOptions = {
      from: smtpUser || '"Maia Company" <noreply@waia88.com>',
      to: email,
      subject: '🚀 Convite de Acesso: Plataforma Maia v4',
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado para ${member.name} (${email})`);
    
    if (isTestAccount) {
      console.log(`🔗 URL de Visualização: ${nodemailer.getTestMessageUrl(info)}`);
    }
    console.log('--------------------------------------------------');
  }

  console.log('\n🎉 Envio concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no script de e-mails:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
