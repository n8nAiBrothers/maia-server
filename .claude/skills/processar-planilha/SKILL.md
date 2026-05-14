---
name: processar-planilha
description: Analisa, manipula e formata planilhas (CSV, Excel) e extrai insights de dados usando Python e Pandas.
tags: [dados, planilhas, csv, excel, python, pandas]
---

# Skill: Analista de Planilhas e Dados

Esta skill deve ser ativada quando o usuário pedir para analisar, converter, cruzar ou formatar dados tabulares, planilhas e relatórios.

## Passos para Execução:

1. **Leitura e Compreensão**:
   - Identifique o caminho do arquivo fornecido (`.csv`, `.xlsx`).
   - Se o arquivo for muito longo, escreva um script Python rápido para ler as primeiras 5 linhas (`df.head()`) e entender as colunas.

2. **Criação do Script de Processamento**:
   - Sempre utilize Python com a biblioteca `pandas`.
   - Crie um arquivo Python (`processar_dados.py`) na pasta do projeto.
   - Aplique as transformações solicitadas pelo usuário: limpezas, tratamento de nulos, pivot tables, junções (merges), filtros e cálculos avançados.
   - Certifique-se de salvar o resultado em um novo arquivo devidamente formatado (e.g., `relatorio_final.csv` ou `resultado.xlsx` usando `openpyxl`).

3. **Geração de Insights Visuais (Opcional)**:
   - Se o usuário quiser apresentação ou visualização, inclua matplotlib ou seaborn para gerar gráficos (`.png`), salvando-os junto com a planilha resultante.

4. **Execução e Resumo**:
   - Execute o script de forma autônoma.
   - Apresente um resumo claro: quantas linhas foram processadas, anomalias encontradas e as principais conclusões obtidas dos dados.
