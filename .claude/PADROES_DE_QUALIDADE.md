# Padrões de Produção Maia e Claude Code

Este documento define os **Padrões de Qualidade Inegociáveis** que toda inteligência artificial (seja Claude Code, Antigravity, Gemma ou Groq) deve seguir ao atuar neste projeto e ao usar as skills configuradas.

## 1. Entrega de "Produto Final" (Production-Ready)
Sempre que o usuário solicitar um fluxo, site, aplicativo, planilha, mockup ou PRD, a entrega não deve ser um "esboço" ou "MVP básico". A entrega deve ser no **melhor padrão atual de mercado já de primeira**.

## 2. Design e Estética Premium
- NUNCA use cores genéricas. Utilize paletas ricas, temas HSL, dark modes elegantes e glassmorphism.
- Empregue micro-animações, hover effects fluidos e transições.
- A interface deve sempre "impressionar" (Efeito WOW) o usuário.

## 3. SEO e GEO Otimizados
- **SEO (Search Engine Optimization)**: Todas as páginas web, apps e sites devem obrigatoriamente possuir tags de título perfeitas, meta descrições cativantes, uso estrito e semântico de HTML5 (apenas um H1 por página) e IDs únicos para testes.
- **GEO**: Se o projeto tiver contexto geográfico ou for multilíngue, deve-se implementar padrões de internacionalização adequados desde a fundação.

## 4. Agentes e Skills
Sempre que acionado, o agente deve buscar na pasta `.claude/skills` a melhor forma de executar a tarefa. O objetivo é sempre atuar de forma independente, analítica e gerar a entrega completa (fluxos do n8n, PRDs no formato markdown de mercado, código limpo e refatorado).
