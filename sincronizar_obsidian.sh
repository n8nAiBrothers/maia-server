#!/bin/bash
# =====================================================
# 🔄 Sincronizador Bidirecional: Obsidian Local ↔ Google Drive
# =====================================================
# Mantém ambas as bases alinhadas sem apagar nada.
# Usa rsync com --update (só sobrescreve se o arquivo fonte for mais novo).

LOCAL="/Users/fsantoro/Desktop/Maia server/Knowledge_Base/"
CLOUD="/Users/fsantoro/Library/CloudStorage/GoogleDrive-n8n.maia88@gmail.com/My Drive/Obsidian_Maia_Server/"

echo "=========================================="
echo "🔄 Sync Obsidian: Local ↔ Google Drive"
echo "=========================================="

# Etapa 1: Enviar atualizações do LOCAL → NUVEM
echo ""
echo "📤 Etapa 1/2: Enviando novidades do Servidor Local para o Google Drive..."
rsync -avh --update --ignore-existing \
  --exclude='.obsidian/' \
  --exclude='.DS_Store' \
  "$LOCAL" "$CLOUD"

# Etapa 2: Baixar atualizações da NUVEM → LOCAL
echo ""
echo "📥 Etapa 2/2: Baixando novidades do Google Drive para o Servidor Local..."
rsync -avh --update --ignore-existing \
  --exclude='.obsidian/' \
  --exclude='.DS_Store' \
  "$CLOUD" "$LOCAL"

echo ""
echo "✅ Sincronização concluída com sucesso!"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
