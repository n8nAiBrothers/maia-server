---
name: criar-apresentacao
description: Gera apresentações profissionais baseadas em texto usando frameworks Markdown como Marp ou Reveal.js.
tags: [apresentacao, slides, marp, revealjs, markdown]
---

# Skill: Criar Apresentação de Impacto

Esta skill instrui como converter dados ou requisitos em apresentações de slides prontas para produção, usando ferramentas de Markdown para automação.

## Passos para Execução:

1. **Definição de Conteúdo**:
   - Extraia os tópicos principais informados pelo usuário.
   - Estruture a narrativa: Introdução, Problema, Solução, Benefícios e Conclusão.

2. **Escolha da Ferramenta**:
   - Utilize a sintaxe do **Marp** (Markdown Presentation Ecosystem), pois é simples de compilar e suporta temas customizados através de CSS.

3. **Gerar o Arquivo da Apresentação (`apresentacao.md`)**:
   - Adicione o frontmatter obrigatório do Marp:
     ```yaml
     ---
     marp: true
     theme: default
     class: invert # Para um dark mode elegante
     paginate: true
     ---
     ```
   - Utilize `---` para separar os slides.
   - Aplique formatação rica: negrito para palavras-chave, citações (`>`), listas objetivas e espaços reservados para imagens (`![Imagem ilustrativa](caminho-ou-url)`).

4. **Estilização Premium**:
   - Se necessário, insira tags `<style>` no início do markdown para personalizar cores, utilizando uma paleta corporativa elegante.

5. **Instruções Finais**:
   - Salve o arquivo e forneça ao usuário o comando para compilar e visualizar (ex: instalar a extensão do VSCode do Marp, ou usar `npx @marp-team/marp-cli@latest apresentacao.md --html`).
