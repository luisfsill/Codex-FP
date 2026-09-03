# Codex Feature Pipeline

Pipeline local para classificar solicitações e rotear planejamento, implementação, validação e revisão no Codex.

```powershell
node .\bin\feature.js --dry-run "Implementar filtros salvos no Kanban"
node .\bin\feature.js --simple "Corrigir o texto do botão"
```

O modo padrão de execução real será habilitado após a configuração do projeto consumidor. Até lá, comandos sem `--dry-run` falham com segurança e não alteram arquivos.
