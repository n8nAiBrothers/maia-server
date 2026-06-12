-- Script de Inicialização do Banco de Dados Maia (n8n + AI)
-- Este script foi gerado e executado automaticamente pelo Agente Antigravity.

-- 1. Tabela para capturar leads ou contatos via WhatsApp (Gateway n8n)
CREATE TABLE IF NOT EXISTS leads_whatsapp (
    id SERIAL PRIMARY KEY,
    telefone VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100),
    data_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'novo'
);

-- 2. Tabela robusta para registrar tarefas enviadas para a IA (Claude/Gemma)
-- Usa o formato JSONB para a resposta, permitindo buscas dinâmicas de objetos e arrays.
CREATE TABLE IF NOT EXISTS ai_tasks (
    id SERIAL PRIMARY KEY,
    modelo VARCHAR(50) NOT NULL, -- Ex: 'claude-3-5', 'gemma4:26b'
    prompt TEXT NOT NULL,
    resposta JSONB, -- O n8n pode salvar a resposta JSON completa aqui
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, concluido, erro
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP
);

-- 3. Tabela de Logs de Execução do n8n
CREATE TABLE IF NOT EXISTS n8n_execution_logs (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(100),
    execution_id VARCHAR(100),
    dados_entrada JSONB,
    sucesso BOOLEAN,
    data_execucao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
