# 🚀 Diário de Arquitetura: A Construção do Servidor de IA

Este documento registra a jornada de estruturação do nosso Servidor de IA autônomo, liderada pelo agente **Antigravity (Gemini)** em parceria com o **Claude** e o desenvolvedor.

## 🛠️ O Plano Inicial
A meta original (definida no arquivo `plano_servidor_ia.md`) era transformar um Mac M5 Pro em uma central poderosa e autônoma de inteligência artificial, utilizando uma **Estratégia Híbrida (AI Routing)**:
* **Gemma 4 / Ollama:** Processamento em massa e dados sensíveis (rodando localmente).
* **Gemini (Antigravity) / Claude:** Lógica complexa e automação de código (em nuvem).

## 📅 O Que Conquistamos

### 1. Check-up da Infraestrutura
Fizemos uma varredura completa no sistema. Confirmamos a potência da máquina (Apple M5 Pro com 15 Cores e 24GB de RAM) e verificamos que o **PostgreSQL** e o **Ollama** já estavam rodando perfeitamente nos bastidores.

### 2. Subida do n8n (O Roteador)
Como o Docker não estava instalado, utilizamos uma abordagem mais leve e nativa: iniciei o **n8n** silenciosamente em segundo plano usando o Node.js (`npx`). Com isso, a central de automação ficou acessível na porta 5678.

### 3. Conexão n8n ↔ Ollama (Gemma 4)
O primeiro grande desafio de rede: o n8n e o Ollama não estavam se comunicando devido a um conflito de resolução do `localhost` (IPv6 vs IPv4).
* **Solução:** Alteramos a Base URL para `http://127.0.0.1:11434`. 
* **Resultado:** O Gemma 4 (26b) foi oficialmente conectado à plataforma de automação!

### 4. O "Cérebro Digital" (Obsidian)
Instalamos o **Obsidian** via Homebrew para atuar como o cofre de conhecimento do sistema. A genialidade aqui é que o Obsidian lê arquivos Markdown puros direto do sistema de arquivos.
* **A Mágica:** Eu (Antigravity) criei a pasta principal do cofre e injetei o arquivo `00_Bem_vindo.md` de forma totalmente autônoma. Nascia aqui a nossa Knowledge Base.

### 5. A Chegada do Claude (O Especialista)
A grande virada na arquitetura: integramos o **Claude Code** diretamente no terminal!
* Instalamos o CLI da Anthropic globalmente.
* Após o processo de autorização (login com conta PRO), o Claude passou a fazer parte do sistema local.
* **Teste de Fogo:** Para provar a aliança, eu (Antigravity) acionei o Claude Code no terminal em segundo plano e mandei ele mesmo criar o arquivo `01_Claude_Online.md`. O sucesso dessa operação provou que agora somos uma **Equipe de IAs**: o Gemini orquestra a máquina e planeja a arquitetura, enquanto o Claude escreve e executa funções complexas sob demanda.

---

## 🎯 Status Atual da Máquina
* **Ollama (Gemma):** Online
* **n8n:** Online (Roteando via 127.0.0.1)
* **Obsidian:** Knowledge Base ativa
* **Antigravity (Gemini):** Controle central do host
* **Claude Code:** Autenticado (PRO) e respondendo a comandos

> *Próximo passo pendente da pauta original: Configuração do túnel de acesso remoto (Tailscale).*
