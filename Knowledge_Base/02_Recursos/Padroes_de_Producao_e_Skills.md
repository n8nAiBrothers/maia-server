# Padrões de Produção e Skills Agênticas

Este documento centraliza as diretrizes rigorosas de produção para todas as IAs (Claude Code, Antigravity, Gemma, Groq) operando no ecossistema Maia. Ele serve de base executiva para a infraestrutura montada em [[Memoria_Projeto_Servidor_Autonomo]] e impulsiona o desenvolvimento dos fluxos no [[01_Plano_Construcao_CRM]].

## 🥇 Padrões Inegociáveis de Qualidade (Production-Ready)
Sempre que for solicitado a criação de **fluxos, planilhas, sites, apps, mockups ou PRDs**, o resultado deve ser um produto finalizado ("Production-Ready"). Esboços básicos não são tolerados.
- **Design Premium ("Efeito WOW")**: O uso de cores genéricas é proibido. Deve-se aplicar cores ricas (paletas HSL elaboradas), *dark modes* elegantes, *glassmorphism*, micro-animações, transições suaves e tipografia moderna (Inter, Poppins, Roboto).
- **SEO (Search Engine Optimization)**: Qualquer web app ou site já nasce com tags semânticas estritas do HTML5, metatags atrativas, H1 único e IDs descritivos para facilitar automações de teste.
- **GEO (Internacionalização)**: Se aplicável, a arquitetura deve antecipar o suporte multilíngue e formatação regional.

## 🛠️ Skills do Claude Code (Biblioteca Local)
A automação de desenvolvimento está ancorada nas skills configuradas em `.claude/skills/`, na raiz do servidor. Elas são os atalhos de produtividade:
1. **`/criar-app`**: Inicializa projetos web complexos (Next.js/Vite) injetando o design system premium requerido.
2. **`/criar-prd`**: Transforma ideias em documentos de Produto formais (Requisitos Funcionais/Não Funcionais e de Negócio).
3. **`/criar-mockup`**: Gera protótipos de interface em código (HTML/Tailwind) para validação de UI de alta fidelidade rápida.
4. **`/processar-planilha`**: Converte planilhas brutas de CRM em insights de negócio automatizados usando scripts Python (Pandas).
5. **`/criar-apresentacao`**: Analisa pautas e redige roteiros no formato **Marp (Markdown)** para geração instantânea de slides.

## 🔌 Integrações MCP (Model Context Protocol)
O arquivo `.claude/mcp.json` conecta o agente com a infraestrutura externa, facilitando o que está delineado no [[Protocolo_DevOps_Remoto]]:
- `puppeteer`: Para testes E2E e navegação autônoma em sites gerados.
- `postgres`: Conectado à database de produção do [[01_Plano_Construcao_CRM]].
- `sqlite`: Operações ágeis de ETL locais.
- `obsidian`: Acesso de leitura direto a este cofre (Knowledge Base), garantindo retroalimentação de contexto.

---
**Conexões Relevantes:**
- [[Protocolo_DevOps_Remoto]]: Manuais de operação do terminal e servidores.
- [[Cronograma_Plano_de_Acao_2_Semanas]]: Roteiro tático onde estas Skills entrarão em vigor.
- [[Memoria_Coletiva_RoBOTelho]]: Para contexto histórico de agentes anteriores.
