# 🧠 Memória Coletiva Maia & RoBOTelho
**Última Atualização:** 2026-05-07 (Integração de Rede Neural do Obsidian)
**Objetivo:** Sincronizar contexto entre agentes de IA para o desenvolvimento contínuo do Ecossistema Maia. (Ver também: [[Memoria_Projeto_Servidor_Autonomo]])

---

## 🏗 1. Infraestrutura e Redes (Arquitetura Cloudflare)
*   **Domínios Disponíveis:** `aibrothers.com.br` e `iabrothers.com.br`.
*   **Projeto Ativo de Roteamento (Em execução):** Migração de túnel efêmero para **Túnel Persistente**.
*   **Arquitetura Definida:**
    *   **Túnel Principal:** `maia-server-tunnel`
    *   **Rota 1 (Cérebro):** `n8n.aibrothers.com.br` -> Aponta para `http://localhost:5678` (Substituirá o trycloudflare no Telegram).
    *   **Rota 2 (Interface):** `crm.aibrothers.com.br` -> Aponta para `http://localhost:3000`.
*   **Status da Ação:** Aguardando login de autenticação do usuário no Mac via CLI.

## 🗄 2. Servidor e Banco de Dados
*   **PostgreSQL Local:** O CRM roda na porta `5432` da máquina local.
*   **Credenciais (Importante):** O banco não requer senha local. Login feito com user: `fsantoro`, host: `localhost`, db: `crm`.
*   **N8n as Code:** O agente possui capacidade de ler, alterar e sobreescrever os workflows via JSON e injeção por linha de comando no n8n.

## 🤖 3. Inteligência e Agentes (Fábrica de Skills)
*   **Agente Principal:** `Agente_Mestre_Claude` (Configurado com LangChain).
*   **Skills Integradas:**
    1.  `Skill_Salvar_Obsidian`: Capacidade de salvar arquivos físicos na base de conhecimento.
    2.  `Skill_Extrator_Postgres_CRM` (Nova): Capacidade de ler o banco de dados Next.js/Prisma do CRM e reportar o volume de tarefas atrasadas, em andamento e em revisão. O nó Tool foi injetado diretamente no JSON do Agente Mestre.

## 📱 4. Front-End e Bugs Conhecidos
*   **Projeto Ativo:** [[01_Plano_Construcao_CRM|CRM App]] (`/Users/fsantoro/Desktop/Projetos/crm-app`).
*   **Status Mobile:** O painel Kanban apresentou falha de resposta de clique (`onClick`) no navegador mobile real (iOS/Android).
*   **Tentativas de Correção:** Removido `onTouchEnd`, aplicado `touch-action: pan-y`, e `z-index: 10`. O bug persiste. O plano B (futuro) é converter o componente pai de `<div>` para a tag semântica `<button>`.

## 💼 5. [[Matriz_Estrategica_Mercado|Matriz de Negócios]]
*   **Vertical Prioritária:** E-commerce (Checkout agêntico).
*   **Horizontal Prioritária:** Voz em Real-Time (Futuras skills).

## 🌐 6. Topologia do Cérebro (Graph View)
*   **Status Atual:** O Obsidian deixou de ser um "Sistema Solar" de notas isoladas e agora opera como um "Sistema Nervoso" interconectado via `[[WikiLinks]]`. O nó central é o arquivo `[[Index]]`.
*   **Diretriz para Agentes (RoBOTelho):** Sempre que a `Skill_Salvar_Obsidian` for acionada, a IA **deve obrigatóriamente** tentar linkar o novo conteúdo a arquivos mestres existentes (ex: `[[01_Plano_Construcao_CRM]]`, `[[Memoria_Projeto_Servidor_Autonomo]]`), para garantir o adensamento do gráfico.
