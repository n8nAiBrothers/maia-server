# 🚀 Dossiê Mestre: A Construção do Servidor de IA Autônomo Maia
*(Voltar para o [[Index|Mapa de Comando]])*

Este documento consolida a linha do tempo completa, do dia 1 até o estágio de maturidade atual, do projeto de transformação de um Mac M5 Pro em uma central poderosa, autônoma e híbrida (Local + Nuvem) de Inteligência Artificial para atuar como CRM e assistente pessoal.

---

## 🛠️ Fase 1: Fundação da Infraestrutura (O "Zero")
A meta original era aproveitar a potência de um Apple M5 Pro (15 Cores, 24GB de RAM) para criar um ecossistema seguro e inteligente.

1. **Orquestração Base (n8n):**
   * Decidimos não usar Docker para manter o acesso direto ao hardware. Iniciamos o **n8n** nativamente via Node.js (`npx`). Ele atua como o "Roteador Neural" de todo o sistema.
2. **Banco de Dados:**
   * Validamos e garantimos que o **PostgreSQL** estivesse rodando nos bastidores para sustentar a estabilidade do sistema.
3. **Modelos Locais (Ollama):**
   * Instalamos o servidor **Ollama**. O primeiro desafio de rede (falha de comunicação com o n8n via localhost) foi resolvido forçando a conexão via `http://127.0.0.1:11434`.
4. **O Cofre Neural (Obsidian):**
   * Instalado via Homebrew, o **Obsidian** foi eleito o "Cérebro Digital" (Knowledge Base). Pelo fato do Obsidian ler arquivos Markdown nativos, a IA pode interagir diretamente com ele apenas manipulando arquivos no sistema macOS.
5. **A Equipe de IAs Especialistas:**
   * **Antigravity (Gemini):** Fui integrado como a "Consciência Arquitetural" do sistema, lendo pastas, propondo scripts e moldando o servidor.
   * **Claude Code:** Instalado via CLI e autenticado (PRO) diretamente no terminal para executar tarefas densas de codificação quando acionado.

---

## 🌐 Fase 2: Conectividade e Mundo Externo
Para que o usuário pudesse conversar com o servidor de qualquer lugar, criamos a interface do Telegram, mas esbarramos no problema de que o n8n estava isolado na rede local.

* **Evolução do Túnel:**
  * **v1 (Quick Tunnel):** Inicialmente usamos `cloudflared tunnel --url` que gerava URLs temporárias (`trycloudflare.com`). O script `iniciar.sh` capturava a URL do log e a injetava no n8n. Problema: toda vez que o Mac dormia, a URL morria e o Telegram perdia a conexão.
  * **v2 (Zero Trust — Atual):** Migramos para o **Cloudflare Zero Trust** com domínio fixo permanente: **`https://n8n.waia88.com`**. O túnel roda como serviço de background, eliminando a necessidade de scripts de captura de URL. O `WEBHOOK_URL` agora é estático.
* **`iniciar.sh` (Versão Atual):**
  * O script foi simplificado. Apenas exporta as variáveis de ambiente (`NODE_FUNCTION_ALLOW_BUILTIN=fs`, `WEBHOOK_URL`), dispara a sincronização do Obsidian, ativa a vigia de arquivos e inicia o n8n.

---

## 🧠 Fase 3: Roteamento Inteligente (A Separação Nuvem vs. Local)
Em vez de usar modelos gigantescos para simples mensagens de bom dia, desenvolvemos um Classificador de Rota inteligente (`Llama 3 8B (Groq)`):

### Caminho A: NUVEM (Trabalho Pesado)
* **Motor:** `Llama 3 70B (Groq)`.
* **Propósito:** Planejamentos complexos, estruturação de [[01_Plano_Construcao_CRM|CRM]], codificação pesada.
* **A Crise do JSON:** Modelos grandes começaram a imprimir chaves duplas `{{ }}` ao chamar ferramentas, quebrando o n8n (Output Parsing Failure). 
* **Solução:** Injeção de instruções de blindagem no `System Message` do LangChain forçando o uso exclusivo de chaves simples `{ }`.

### Caminho B: LOCAL (Privacidade e Autonomia)
* **Evolução Histórica:** Inicialmente configurado com `gemma4:26b` (17GB). Por ser focado em matemática pesada, o modelo gerava textos gigantescos "pensando em voz alta" (Chain of Thought), mesmo ao ser instruído para não fazê-lo.
* **Solução (A Redenção Local):**
  1. Rebaixamos (downgrade) o modelo para o veloz e eficiente **`gemma2:9b`** (5.4GB).
  2. Limpamos todas as regras restritivas do prompt (que funcionavam como um "gatilho" para ele explicar as coisas).
  3. Transformamos o nó de um simples Chat para um **Agent Autônomo**. Agora, a Gemma local responde a um "Oi" em milissegundos, mas também tem autonomia plena para acionar ferramentas quando solicitado.

---

## 🛠️ Fase 4: Manipulação da Matéria (A Skill de Obsidian)
O maior poder do Servidor Maia é a sua capacidade de criar arquivos reais no Mac. 

* **Isolamento de Segurança:** O n8n proíbe acesso a disco por padrão. Quebramos essa barreira adicionando `export NODE_FUNCTION_ALLOW_BUILTIN=fs` no nosso `iniciar.sh`.
* **A Skill (`SkillObsidianV3`):** Criamos uma ferramenta oficial e reutilizável conectada aos agentes. Usando código Javascript (`fs.writeFileSync`), a Skill possui uma lógica robusta de `fallback`: se o agente enviar um JSON quebrado (ex: textos de raciocínio dentro da estrutura de código), a ferramenta intercepta, limpa a sujeira via RegEx, e força o salvamento do texto original na pasta `/Knowledge_Base/02_Recursos/`. Nada se perde.

---

## 🔄 Fase 5: Cérebro Coletivo (Sincronização Multi-Agente)
O Obsidian deixou de ser local e se tornou o **sistema nervoso compartilhado** entre todos os agentes da equipe.

* **Google Drive como Espinha Dorsal:**
  * A pasta `Obsidian_Maia_Server` no Google Drive (`n8n.maia88@gmail.com/My Drive/`) é o espelho na nuvem da Knowledge Base local.
  * Scripts `sincronizar_obsidian.sh` (rsync bidirecional) e `vigiar_obsidian.sh` (fswatch em tempo real) mantêm ambas as bases 100% alinhadas automaticamente.
* **Ponte Neural (Maia ↔ RoBOTelho):**
  * O agente **RoBOTelho** (Claude, laboratório pessoal) acessa o mesmo cofre via Google Drive.
  * A pasta `Caixa_Postal_Agentes/` funciona como o "correio interno" entre os agentes: qualquer IA pode depositar pautas, logs de implementação e gatilhos de reunião ali.
  * O arquivo `[[Ponte_Neural_Agentes]]` mapeia os projetos cruzados, garantindo que ambos os cérebros referenciem as mesmas notas mestras.
* **Ciclo de Vida de um Arquivo:**
  1. Maia (n8n) cria `.md` no disco local via `SkillObsidianV3`.
  2. `fswatch` detecta a mudança instantaneamente.
  3. `rsync` copia para o Google Drive.
  4. RoBOTelho enxerga o arquivo na nuvem e pode ler/editar.
  5. A edição do RoBOTelho volta para o servidor local pelo mesmo mecanismo.

---

## 🚀 Status Atual da Máquina & Topologia
- **Entrada:** Telegram Bot (`@Maia_Chat_Bot`).
- **Ponte de Rede:** Cloudflare Zero Trust → `https://n8n.waia88.com` (permanente).
- **Orquestrador Central:** n8n v2.16.1 (Porta 5678).
- **Roteador:** Llama 3 8B (Groq).
- **Agente Nuvem:** Groq Llama 3 70B.
- **Agente Local:** Ollama Gemma 2 9B (v0.23.0).
- **Ferramentas:** `SkillObsidianV3` ligada em **ambos** os agentes.
- **Banco e Histórico:** PostgreSQL local e `.n8n/database.sqlite`.
- **Sincronização:** `fswatch` + `rsync` → Google Drive ↔ Local (tempo real).
- **Agentes Conectados:** Maia (Servidor), RoBOTelho (Pessoal/Claude), Antigravity (Arquiteto).
- **Arquitetos Base:** Flavio, Antigravity, Claude (RoBOTelho).

> *Este arquivo é a memória central da infraestrutura e deve guiar todo e qualquer prompt de manutenção futura. Sobrevivemos às barreiras de rede, vencemos a sintaxe falha das IAs, dominamos o controle total de leitura e escrita de máquina, e agora operamos como uma equipe multi-agente com cérebro compartilhado na nuvem.*
