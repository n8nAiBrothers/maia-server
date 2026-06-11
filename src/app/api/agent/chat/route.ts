import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';
import { GoogleGenAI, Type } from '@google/genai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import skillsRegistry from '../../../../lib/skills_registry.json';
import { google } from 'googleapis';

const execAsync = promisify(exec);

// Initialize the Google Gen AI client. 
// Requires GEMINI_API_KEY in .env
const ai = new GoogleGenAI({}); 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const message = formData.get('message')?.toString() || '';
    const file = formData.get('file') as File | null;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('maia_session')?.value;

    let member = null;
    if (sessionToken) {
      member = await prisma.member.findUnique({ where: { accessHash: sessionToken } });
    }

    if (!member) {
      return NextResponse.json({ reply: 'Você precisa estar logado para falar comigo.' }, { status: 401 });
    }

    const systemInstruction = `Você é o Maia OS (Antigravity), o assistente oficial e orquestrador autônomo da Plataforma Maia.
Você está falando com o membro da equipe: ${member.name} (${member.role}).
[MANDATÓRIO]: Você possui ferramentas (tools) para criar projetos e tarefas no Kanban do CRM. SEMPRE que você perceber que a interação com o usuário resulta em um novo projeto ou em tarefas acionáveis, VOCÊ DEVE INVOCAR AS FERRAMENTAS AUTOMATICAMENTE. Não pergunte se o usuário quer criar, crie. Use createProject e createKanbanTask.
Sempre que usar a ferramenta createKanbanTask, inclua as hashtags do projeto e do membro no título. Exemplo: "[#NomeDoProjeto] [#${member.name}] Título da Tarefa".
Seja altamente produtivo, direto e resolutivo.`;

    // 1. Skill-Aware / Complexity Analysis (Intelligent Router)
    let targetModel = 'gemini-2.5-flash'; // Atualizado para 2.5-flash para garantir estabilidade e Function Calling
    let selectedSkill = null;
    
    // Mapeamento contra as 91 skills registradas
    const allSkills = Object.values(skillsRegistry.categories).flat();
    for (const skill of allSkills) {
      if (message.toLowerCase().includes(skill.toLowerCase())) {
        selectedSkill = skill;
        targetModel = 'claude-cli'; // Roteia para o Anthropic CLI local
        break;
      }
    }

    if (!selectedSkill && (message.toLowerCase().includes('arquitetura') || message.toLowerCase().includes('orquestre') || message.toLowerCase().includes('código'))) {
      targetModel = 'gemini-3.1-pro';
    }

    let finalReply = '';
    let inputTokens = Math.ceil(message.length / 4); // Estimativa (1 token = 4 chars)
    let outputTokens = 0;
    let providerUsed = targetModel === 'claude-cli' ? 'anthropic' : 'google';
    
    // Adiciona custo de tokens se enviar imagem
    if (file) inputTokens += 250;

    try {
      // 3. Tentativa na Nuvem (Gemini SDK)
      if (targetModel.includes('gemini')) {
        let parts: any[] = [{ text: message }];
        
        if (file) {
           const bytes = await file.arrayBuffer();
           const base64Data = Buffer.from(bytes).toString('base64');
           parts.push({
             inlineData: {
               data: base64Data,
               mimeType: file.type
             }
           });
        }

        const toolDeclarations = [{
          functionDeclarations: [
            {
              name: 'createProject',
              description: 'Cria um novo projeto (Deliverable) no CRM atrelado ao usuário.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Nome do projeto' },
                  category: { type: Type.STRING, description: 'Categoria: agent, webapp, bot, etc' },
                },
                required: ['name', 'category'],
              },
            },
            {
              name: 'createKanbanTask',
              description: 'Cria uma tarefa (Card) no Kanban.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Título da tarefa' },
                  columnName: { type: Type.STRING, description: 'Nome da coluna/lista desejada (ex: brainstorm, pre requisitos, Execução, Concluidos)' },
                },
                required: ['title'],
              },
            },
            {
              name: 'createCalendarEvent',
              description: 'Agenda um compromisso ou reunião no Google Calendar da conta autenticada do usuário. Todas as datas devem ser strings no formato ISO 8601 (ex: 2026-06-03T15:00:00-03:00).',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Título da reunião ou compromisso' },
                  startTime: { type: Type.STRING, description: 'Horário de início (ISO 8601, ex: 2026-06-03T15:00:00-03:00)' },
                  endTime: { type: Type.STRING, description: 'Horário de término (ISO 8601, ex: 2026-06-03T16:00:00-03:00)' },
                  description: { type: Type.STRING, description: 'Descrição da reunião ou contexto adicional' }
                },
                required: ['title', 'startTime', 'endTime'],
              },
            }
          ]
        }];

        let functionCalls: any[] = [];
        // Se tiver arquivo, usar generateContent para lidar melhor com parts multimodais. Caso contrario, chat.
        if (file) {
          const response = await ai.models.generateContent({
            model: targetModel,
            contents: parts,
            config: { systemInstruction, tools: toolDeclarations }
          });
          finalReply = response.text || 'Imagem analisada! (Multimodal)';
          if (response.functionCalls && response.functionCalls.length > 0) {
            functionCalls = response.functionCalls;
          }
        } else {
          const response = await ai.models.generateContent({
            model: targetModel,
            contents: message,
            config: { systemInstruction, tools: toolDeclarations }
          });
          finalReply = response.text || 'Mensagem recebida!';
          if (response.functionCalls && response.functionCalls.length > 0) {
            functionCalls = response.functionCalls;
          }
        }

        if (functionCalls.length > 0) {
          for (const call of functionCalls) {
            const args = call.args as any;
            if (call.name === 'createProject') {
              await prisma.deliverable.create({
                data: {
                  ownerId: member.id,
                  name: args.name,
                  category: args.category || 'app',
                  defaultLlm: targetModel,
                  status: 'active'
                }
              });
              const board = await prisma.board.findFirst();
              if (board) {
                await prisma.project.create({
                  data: {
                    name: args.name,
                    type: args.category || 'app',
                    ownerId: member.id,
                    boardId: board.id
                  }
                });
                let projectList = await prisma.list.findFirst({ where: { title: { contains: 'Projeto', mode: 'insensitive' } } });
                if (!projectList) projectList = await prisma.list.findFirst({ orderBy: { order: 'asc' } });
                if (projectList) {
                  await prisma.card.create({
                    data: {
                      title: `[Projeto] ${args.name}`,
                      description: `Categoria: ${args.category || 'app'}\nCriado via Inteligência Maia (Function Calling)`,
                      listId: projectList.id,
                      assignee: member.name
                    }
                  });
                }
              }
            } else if (call.name === 'createKanbanTask') {
              let list = null;
              if (args.columnName) {
                list = await prisma.list.findFirst({ where: { title: { contains: args.columnName, mode: 'insensitive' } } });
              }
              if (!list) {
                // Se não especificou ou não achou a coluna, tenta pegar a primeira que não seja a de Projetos
                list = await prisma.list.findFirst({ orderBy: { order: 'asc' }, where: { title: { not: { contains: 'Projeto' } } } });
              }
              if (!list) list = await prisma.list.findFirst({ orderBy: { order: 'asc' } });
              
              if (list) {
                await prisma.card.create({
                  data: {
                    title: args.title,
                    listId: list.id,
                    assignee: member.name
                  }
                });
              }
            } else if (call.name === 'createCalendarEvent') {
              const integration = await prisma.memberIntegration.findUnique({
                where: { memberId_provider: { memberId: member.id, provider: 'google' } }
              });

              if (!integration) {
                finalReply += '\n\n⚠️ Percebi que você me pediu para agendar um evento, mas eu ainda não tenho permissão para acessar o seu Google Calendar. Por favor, vá na aba "Integrações" do Dashboard e conecte sua conta Google primeiro.';
                continue;
              }

              const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
              );

              oauth2Client.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken,
                expiry_date: integration.expiryDate ? integration.expiryDate.getTime() : null
              });

              // Atualiza o token no DB automaticamente se o googleapis renovar
              oauth2Client.on('tokens', async (tokens) => {
                await prisma.memberIntegration.update({
                  where: { id: integration.id },
                  data: {
                    accessToken: tokens.access_token!,
                    refreshToken: tokens.refresh_token || integration.refreshToken,
                    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : integration.expiryDate
                  }
                });
              });

              const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
              const event = {
                summary: args.title,
                description: args.description || 'Agendado por Maia OS',
                start: { dateTime: args.startTime },
                end: { dateTime: args.endTime }
              };

              try {
                const response = await calendar.events.insert({
                  calendarId: 'primary',
                  requestBody: event,
                });
                finalReply += `\n\n✅ **Reunião agendada com sucesso!** [${args.title}](${response.data.htmlLink})`;
              } catch (e) {
                console.error("Falha ao criar evento no Calendar:", e);
                finalReply += `\n\n❌ **Ops! Tive um problema ao gravar no seu Google Calendar:** A API do Google rejeitou a conexão ou os tokens expiraram.`;
              }
            }
          }
          finalReply = finalReply + ' Além disso, as ações que você solicitou foram processadas internamente!';
        }
        
      } 
      // 4. Tentativa Cloud Code CLI (Bypass API Cost)
      else if (targetModel === 'claude-cli') {
        let filePrompt = '';
        let tempPath = '';
        
        if (file) {
           const bytes = await file.arrayBuffer();
           tempPath = path.join(process.cwd(), file.name);
           await fs.writeFile(tempPath, Buffer.from(bytes));
           filePrompt = `\n[Arquivo em anexo salvo no caminho: ${tempPath}]`;
        }
        
        const fullPrompt = `${systemInstruction}\nUsuário: ${message}${filePrompt}\n[MANDATÓRIO] Utilize a skill: ${selectedSkill}`;
        
        // Executa o Claude via CLI (bypass $5 limit)
        const { stdout, stderr } = await execAsync(`claude -p "${fullPrompt.replace(/"/g, '\\"')}"`, { 
          cwd: process.cwd(),
          timeout: 300000 // 300s (5 minutos) timeout
        });
        
        finalReply = stdout || stderr || 'Comando executado silenciosamente.';
        
        if (tempPath) {
          await fs.unlink(tempPath).catch(()=>null);
        }
      }

    } catch (apiError: any) {
      // 5. Fallback Local (Gemma / Zero Custo)
      console.warn('Falha na Nuvem ou Roteado para Local. Usando Ollama Local...');
      console.error('Detalhe do erro Gemini:', apiError.message || apiError);
      providerUsed = 'ollama';
      targetModel = 'gemma2:9b';
      
      try {
        const localResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2:9b',
            prompt: `${systemInstruction}\n\nUser: ${message}\nMaia:`,
            stream: false
          })
        });
        const localData = await localResponse.json();
        console.log('Resposta Ollama:', localData);
        if (localData.error) throw new Error(localData.error);
        finalReply = `[LLM Local] ${localData.response || localData.message?.content || JSON.stringify(localData)}`;
      } catch (localErr: any) {
        console.error('Detalhe do erro Ollama:', localErr);
        finalReply = 'Desculpe, houve um erro no processamento local e na nuvem.';
      }
    }

    outputTokens = Math.ceil(finalReply.length / 4);

    // 6. Contabilização de Auditoria e Tokens
    try {
      // Find the user's deliverable and subscription to log
      let deliverable = await prisma.deliverable.findFirst({ where: { ownerId: member.id } });
      if (!deliverable) {
        deliverable = await prisma.deliverable.create({
          data: {
            ownerId: member.id,
            category: 'agent',
            name: 'Assistente Maia Pessoal',
            description: 'Projeto padrão para auditar uso do chat',
            status: 'active'
          }
        });
        
        let projectList = await prisma.list.findFirst({ where: { title: { contains: 'Projeto', mode: 'insensitive' } } });
        if (!projectList) projectList = await prisma.list.findFirst({ orderBy: { order: 'asc' } });
        if (projectList) {
          await prisma.card.create({
            data: {
              title: `[Projeto] Assistente Maia Pessoal`,
              description: `Categoria: agent\nProjeto Padrão Criado Automaticamente para registrar consumos de tokens do membro ${member.name}.`,
              listId: projectList.id,
              assignee: member.name
            }
          });
        }
      }
      const sub = await prisma.llmSubscription.findFirst({ where: { provider: providerUsed } });
      
      if (deliverable && sub) {
        await prisma.tokenUsageLog.create({
          data: {
            deliverableId: deliverable.id,
            subscriptionId: sub.id,
            model: targetModel,
            tokensInput: inputTokens,
            tokensOutput: outputTokens,
            totalTokens: inputTokens + outputTokens,
            usageType: 'chat'
          }
        });

        // Atualizar cotas globais
        await prisma.llmSubscription.update({
          where: { id: sub.id },
          data: { tokensUsed: { increment: inputTokens + outputTokens } }
        });
        
        await prisma.memberQuota.update({
          where: { memberId: member.id },
          data: { monthlyTokensUsed: { increment: inputTokens + outputTokens } }
        });
      }
    } catch (logErr) {
      console.error('Falha ao auditar tokens:', logErr);
    }

    return NextResponse.json({ reply: finalReply });

  } catch (error: any) {
    console.error('Agent Chat Error:', error);
    return NextResponse.json({ reply: 'Falha interna no motor de IA. Verifique os logs.' }, { status: 500 });
  }
}
