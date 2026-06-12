#!/bin/bash
# =========================================================================
# Maia Server - Rotina de Backup Automático para Google Drive (via rclone)
# =========================================================================

LOG_FILE="/Users/fsantoro/Desktop/Maia server/Knowledge_Base/03_Diarios_e_Logs/Logs_Diarios/backup_rclone.md"

echo "## 🔄 Backup Iniciado: $(date)" >> "$LOG_FILE"

# 1. Fazendo o espelhamento do Servidor Maia para a Nuvem
# O comando 'copy' envia arquivos novos ou alterados, mas não apaga arquivos do Drive 
# caso você os delete do computador (mais seguro para backup).
/opt/homebrew/bin/rclone copy "/Users/fsantoro/Desktop/Maia server" "gdrive:Maia_Server_Backup" -v >> "$LOG_FILE" 2>&1

echo "✅ **Status:** Backup Concluído com Sucesso!" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
