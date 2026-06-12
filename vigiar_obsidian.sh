#!/bin/bash
# =====================================================
# 👁️ Vigia do Obsidian: Sincronização em Tempo Real
# =====================================================
# Roda em background. Quando qualquer .md muda em
# qualquer dos dois lados, dispara o rsync imediatamente.

LOCAL="/Users/fsantoro/Desktop/Maia server/Knowledge_Base/"
CLOUD="/Users/fsantoro/Library/CloudStorage/GoogleDrive-n8n.maia88@gmail.com/My Drive/Obsidian_Maia_Server/"

sync_now() {
    # LOCAL → NUVEM
    rsync -ah --update --ignore-existing \
      --exclude='.obsidian/' --exclude='.DS_Store' \
      "$LOCAL" "$CLOUD" 2>/dev/null

    # NUVEM → LOCAL
    rsync -ah --update --ignore-existing \
      --exclude='.obsidian/' --exclude='.DS_Store' \
      "$CLOUD" "$LOCAL" 2>/dev/null
}

echo "👁️ Vigia Obsidian ativa. Monitorando mudanças em ambos os lados..."

# Monitora AMBAS as pastas ao mesmo tempo
fswatch -o -l 5 \
  --exclude='\.obsidian' --exclude='\.DS_Store' \
  "$LOCAL" "$CLOUD" | while read -r _; do
    sync_now
done
