# 📋 Arquitetura e Execução: CRM / App Cronograma (Projeto 01)

Este documento traduz o arquivo conceitual gerado pela Maia ([[planejamento_crm.md|planejamento_crm.md.md]]) em um **Plano de Desenvolvimento Técnico e Executável**, focado na criação de um aplicativo web premium (estilo Trello/Notion) hospedado na Vercel.

---

## 🎯 1. Visão do Produto (MVP)
O objetivo é construir uma interface de gestão (Kanban) que possua a usabilidade ágil do **Trello** (arrastar e soltar cartões) e a riqueza de edição do **Notion** (blocos de texto detalhados dentro dos cartões). Tudo isso integrado ao nosso ecossistema atual.

### Stack Tecnológica Definida:
*   **Frontend Web (Vercel):** `Next.js` (Framework React) para máxima performance e roteamento moderno.
*   **Design & UI (Premium):** Vanilla CSS + CSS Modules (ou Tailwind se estritamente necessário), garantindo cores vibrantes, "glassmorphism", e micro-animações dinâmicas para impressionar o usuário.
*   **Banco de Dados:** `PostgreSQL` (já rodando no Mac) conectado via Prisma ORM, ou migração para um banco serverless (ex: Supabase / Vercel Postgres) caso o deploy exija acesso global independente do Mac.
*   **Integração Maia:** O app web terá endpoints para que o n8n (Maia) possa injetar novos cards/clientes diretamente no CRM via automação.

---

## 🏗️ 2. Fases de Desenvolvimento (Mão na Massa)

### Fase 1: Fundação do App (Setup Vercel + Next.js)
*   **Ação:** Inicializar o projeto `npx create-next-app` na pasta do servidor.
*   **Ação:** Configurar a paleta de cores (Dark Mode elegante, gradientes).
*   **Ação:** Preparar a esteira de deploy contínuo (CI/CD) conectada à conta da Vercel.

### Fase 2: Modelagem de Dados (O Banco)
*   Criar o esquema do banco de dados (Prisma/SQL):
    *   `Board` (Quadro do CRM)
    *   `List` (Colunas: Lead, Negociação, Fechado)
    *   `Card` (O Cliente/Tarefa)
*   Testar a conectividade do banco com o backend do Next.js.

### Fase 3: Engenharia de Frontend (Kanban UI)
*   Construir os componentes visuais do Trello: Colunas e Cartões.
*   Implementar a biblioteca de arrastar e soltar (Drag and Drop) para mover clientes/projetos entre as fases.
*   Garantir micro-animações: brilho ao passar o mouse (hover), transições suaves ao mover cards.

### Fase 4: A "Experiência Notion" (Modal de Detalhes)
*   Ao clicar em um cartão (Card), abrir um modal lateral expansível.
*   Implementar um editor de texto rico onde o usuário possa adicionar notas, tabelas ou checklists, simulando a estrutura de blocos do Notion.

### Fase 5: Integração com a Maia (A Cereja do Bolo)
*   Criar uma API Route no Next.js (ex: `/api/crm/webhook`).
*   Configurar o n8n para que, toda vez que a Maia receber uma mensagem no Telegram como "Adicione um novo lead chamado João na coluna de Negociação", ela dispare um POST para essa API, criando o cartão automaticamente no nosso CRM web.

---

## 🚀 Próximo Passo Imediato
Para começarmos a codificar hoje mesmo (Dia 8/9 do [[Cronograma_Plano_de_Acao_2_Semanas|Cronograma Geral]]), precisamos definir:
1.  **Hospedagem do Banco de Dados:** Vamos usar o PostgreSQL local do seu Mac ou prefere que eu suba um banco gratuito na nuvem (Supabase/Neon) para a Vercel conseguir acessar facilmente de fora?
2.  **Autorização de Inicialização:** Posso rodar o comando `npx create-next-app` agora mesmo para gerar a base do código?
