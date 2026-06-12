#!/bin/bash
cd "/Users/fsantoro/Desktop/Maia server"

echo "=========================================="
echo "🤖 Servidor Maia - Inicialização do n8n"
echo "=========================================="
echo "✅ Túnel Cloudflare Zero Trust operando em background."
echo "🌐 Domínio Oficial: https://n8n.waia88.com"

# ==========================================
# 🔄 Sincronização Obsidian (Local ↔ Google Drive)
# ==========================================
echo "🔄 Sincronizando Obsidian com Google Drive..."
bash "/Users/fsantoro/Desktop/Maia server/sincronizar_obsidian.sh"

# Inicia a vigilância em tempo real (background silencioso)
echo "👁️ Ativando Vigia de Sincronização em tempo real..."
bash "/Users/fsantoro/Desktop/Maia server/vigiar_obsidian.sh" &
VIGIA_PID=$!

echo "🚀 Iniciando motores do n8n..."

# Permite acesso a escrita de arquivos no Mac (Skill Obsidian)
export NODE_FUNCTION_ALLOW_BUILTIN=fs

# Rota persistente para os Webhooks e Telegram
export WEBHOOK_URL="https://n8n.waia88.com"

# Iniciar Orquestrador
npx n8n start

# Ao encerrar (Ctrl+C), mata a vigia também
kill $VIGIA_PID 2>/dev/null
echo "Servidor Maia Encerrado."
