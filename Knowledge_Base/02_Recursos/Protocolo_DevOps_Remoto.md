# 🛰️ Protocolo de DevOps Remoto (Laboratório RoBOTelho)

Este documento oficializa o protocolo arquitetural que permite ao laboratório central (operado pelo Usuário e pela IA RoBOTelho) gerenciar de forma 100% remota o Servidor Maia e futuros clones, sem a necessidade de acesso físico às máquinas ou intervenção manual de parceiros locais.

## 🎯 Filosofia de Comando (O Paradigma "Parceiro de Aço")
O Cérebro Central atua como Arquiteto (Laboratório RoBOTelho). O Servidor Maia atua como a Usina Operacional (Front-end, n8n, CRM, Banco de Dados).

## 📡 1. O Maestro do n8n (Gerenciamento de Fluxos)
Todo o controle de fluxos do Servidor Maia será orquestrado a partir do laboratório usando a ferramenta **[[n8n-as-code]]** em conjunto com a API exposta.

* **Infraestrutura:** O Maia Server está exposto pela internet via túnel persistente do [[Cloudflare]]. Isso gera uma URL oficial segura.
* **Operação Prática:** O laboratório (RoBOTelho) configurará em seu arquivo `n8nac-config.json` um ambiente chamado `maia` (apontando para a URL do Cloudflare da Maia e utilizando uma chave de API criada internamente).
* **Execução:** O desenvolvimento dos fluxos ocorrerá localmente no laboratório. Para subir os fluxos finalizados para a Maia, usaremos via terminal: `npx n8nac push --env maia`. Isso despacha o JSON direto para a nuvem sem a necessidade de abrir interfaces gráficas.

## 🌉 2. As Três Vias de Comunicação (Networking)
O telecomando utiliza três camadas distintas dependendo da criticidade e profundidade do acesso necessário.

1. **Camada 1 (Pública Segura - Cloudflare Tunnel):** Acesso às interfaces gráficas (Web UI do n8n, CRM Web) e APIs HTTPS.
2. **Camada 2 (Memória Sincronizada - Google Drive):** O Cofre do [[Obsidian]] (Pasta `Caixa_Postal_Agentes` e arquivos do sistema). É a ponte de arquivos e instruções textuais assíncronas.
3. **Camada 3 (Acesso Físico Virtual - VPN Mesh):** Implantação de **Tailscale** ou **ZeroTier**. Isso unifica a rede do RoBOTelho e da Maia numa LAN virtual. Necessário para operações profundas como SSH ou conexão bruta a banco de dados sem os riscos de expor portas ao mundo web aberto.

## 🗄️ 3. Orquestração do Banco de Dados ([[PostgreSQL]])
A gestão das tabelas, schemas e queries do banco PostgreSQL que roda localmente no hardware da Maia obedece a duas diretrizes:

* **Abordagem Direta (Via VPN):** Utilizando a Camada 3 (Tailscale), o laboratório RoBOTelho poderá conectar o DBeaver ou pgAdmin locais diretamente ao IP interno da Maia na porta `5432`. Permite manutenção em tempo real das migrações SQL.
* **Abordagem Agêntica ("Caixa Postal SQL"):** Caso a Camada 3 não esteja disponível, será instaurado um fluxo de vigilância ("Watcher") no n8n da Maia monitorando uma pasta específica no Google Drive (ex: `SQL_Updates`). Quando o laboratório RoBOTelho soltar um arquivo de migração (`.sql`) ou um comando em `.md` nesta pasta, o n8n da Maia executará cegamente (ou validará e executará) os comandos SQL diretamente no seu PostgreSQL local.

---
*Este protocolo garante a escalabilidade infinita. Com a chegada de novas máquinas clones, bastará a instalação do Cloudflare, Tailscale e n8n básico para que entrem sob o controle deste laboratório central.*
