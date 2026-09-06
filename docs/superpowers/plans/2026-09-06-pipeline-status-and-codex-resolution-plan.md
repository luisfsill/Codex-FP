# Plano de implementação: status e resolução do Codex CLI

1. Alterar `src/state.js` para carregar a raiz explicitamente em cada gravação e incluir `updatedAt` no estado da execução.
2. Alterar `src/orchestrator.js` para passar a raiz em todas as transições e fornecer `codexCommand` às fases do Codex.
3. Criar `src/codex-command.js` com resolução determinística por configuração, ambiente, `PATH` e instalação do Codex Desktop.
4. Integrar o resolvedor em `src/codex.js` e validar `codexCommand` em `src/config.js`.
5. Adicionar reconciliação entre o status principal e o `state.json` da execução em `src/status.js`, incluindo `planned` como estado terminal do `watch`.
6. Criar testes unitários para escrita correta, reconciliação, acompanhamento e resolução do executável.
7. Atualizar testes e documentação afetados.
8. Executar `node --test`, checagens de sintaxe e testes manuais de status no Postify.
9. Atualizar a instalação utilizada pelo comando global e confirmar que o status preso passa a exibir a falha real.
