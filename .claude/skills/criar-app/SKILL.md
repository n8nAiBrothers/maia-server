---
name: criar-app
description: Cria uma aplicação web moderna (React, Next.js ou Vite) seguindo as melhores práticas e com design premium.
tags: [web, app, frontend, react, vite]
---

# Skill: Criar App Web

Esta skill ensina como você deve estruturar e criar aplicações web para o usuário, garantindo qualidade de produção, visual moderno e as melhores práticas.

## Passos para Execução:

1. **Entender os Requisitos**: 
   - Analisar o que o usuário quer que o app faça.
   - Determinar se será uma Landing Page (Static/Vite) ou Web App com rotas/estado complexo (Next.js).

2. **Setup do Projeto**:
   - Para Vite (React + TypeScript): `npm create vite@latest [nome-do-app] -- --template react-ts`
   - Para Next.js: `npx create-next-app@latest [nome-do-app] --typescript --tailwind --eslint`
   - Entrar na pasta gerada e rodar `npm install`.

3. **Design System & UI**:
   - Utilize Tailwind CSS para estilização (instalar se usar Vite).
   - Instale dependências de UI modernas como `lucide-react` para ícones e `framer-motion` para micro-animações.
   - Adicione cores ricas (Dark Mode elegante, gradients suaves, glassmorphism) em vez de cores puras básicas (evite #FF0000, prefira tons trabalhados).

4. **Estrutura de Componentes**:
   - Separe a interface em componentes reutilizáveis (e.g., `components/Header.tsx`, `components/Hero.tsx`, `components/Footer.tsx`).
   - Crie uma estrutura clara de pastas: `/src/components`, `/src/pages` (ou app router), `/src/assets`, `/src/utils`.

5. **Ações Finais**:
   - Certifique-se de configurar scripts de inicialização corretamente (`npm run dev`).
   - Adicione SEO básico (meta tags adequadas).
   - Retorne para o usuário as instruções claras de como rodar o projeto localmente.
