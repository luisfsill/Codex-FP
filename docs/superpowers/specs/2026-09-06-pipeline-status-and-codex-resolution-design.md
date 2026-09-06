# Confiabilidade do status e resolução do Codex CLI

## Objetivo

Garantir que uma execução do Codex Feature Pipeline nunca permaneça falsamente em `RUNNING` quando já terminou ou falhou, e permitir que o pipeline encontre o Codex CLI quando for iniciado pelo hook do Codex Desktop em um ambiente cujo `PATH` não contenha o executável.

## Problemas confirmados

Uma execução no Postify criou corretamente seu estado inicial em `.codex/pipeline/status.json`, mas as atualizações seguintes foram gravadas em `.codex/.codex/pipeline/status.json`. A causa é a inferência incorreta da raiz do projeto em `writeState`: a subida de três níveis a partir de `.codex/pipeline/runs/<id>` termina em `.codex`, não na raiz do projeto.

A mesma execução falhou na fase de planejamento com `spawn codex ENOENT`. O Codex CLI existe na instalação do Codex Desktop, porém o ambiente herdado pelo hook não o expôs no `PATH`.

## Arquitetura da correção

### Estado da execução

`createRun` retornará a raiz do projeto junto com `runDir` e `state`. `writeState` receberá a raiz explicitamente, eliminando a inferência baseada na profundidade do diretório. Todas as chamadas do orquestrador usarão essa raiz explícita.

A gravação continuará atômica: escrever em arquivo temporário e renomear para o destino. O `state.json` da execução e o `status.json` do projeto devem representar a mesma transição.

### Reconciliação de status

`readStatus` verificará se o status principal está marcado como ativo e contém um identificador de execução. Nesse caso, localizará o `state.json` correspondente. Se esse estado estiver finalizado ou for mais recente, ele será usado como fonte da leitura e o status principal será corrigido atomicamente.

A reconciliação não transformará uma execução ativa em falha apenas por idade. Sem evidência terminal no `state.json`, o estado permanecerá ativo.

### Resolução do executável

O pipeline terá uma função isolada para resolver o comando do Codex nesta ordem:

1. caminho configurado em `codexCommand`;
2. variável de ambiente `CODEX_CLI_PATH`;
3. `codex` encontrado no `PATH`;
4. no Windows, instalações do Codex Desktop em `%LOCALAPPDATA%/OpenAI/Codex/bin/*/codex.exe`;
5. falha `missing_executable` com mensagem indicando as fontes verificadas.

Quando houver várias instalações do Desktop, será escolhido o executável existente com modificação mais recente. O caminho resolvido será passado diretamente a `spawn`, sem shell e sem montagem de comando textual.

`codexCommand` será opcional, validado como string não vazia quando informado e documentado na configuração.

### Progresso e erros

O orquestrador continuará atualizando a fase para `planning`, `implementing`, `reviewing` e `correcting` antes de iniciar cada trabalho. A resolução do executável ocorrerá durante a fase correspondente. Qualquer falha atualizará imediatamente os dois arquivos de estado para `failed`, incluindo categoria e mensagem.

`feature status` exibirá a falha reconciliada. `feature watch` encerrará quando observar um estado terminal e não ficará aguardando um estado inicial obsoleto.

## Compatibilidade

A configuração existente continuará válida sem `codexCommand`. O comportamento em Linux e macOS continuará usando o caminho configurado, a variável de ambiente ou o `PATH`; a busca na instalação do Desktop será exclusiva do Windows.

Não haverá alteração nos modelos, prompts, níveis de classificação, fases, limites de correção, permissões ou políticas de Git.

## Testes

A suíte automatizada deverá provar:

- que `writeState` atualiza `.codex/pipeline/status.json` e não cria `.codex/.codex`;
- que uma falha de fase aparece imediatamente em `readStatus`;
- que `readStatus` reconcilia um status ativo obsoleto com um `state.json` terminal;
- que a reconciliação não encerra um estado ainda ativo;
- que um comando configurado tem precedência;
- que `CODEX_CLI_PATH` tem precedência sobre descoberta automática;
- que o executável disponível no `PATH` é usado;
- que a instalação mais recente do Codex Desktop é encontrada no Windows;
- que a ausência de executável produz erro claro e categorizado;
- que `feature watch` termina diante de falha reconciliada;
- que os testes existentes continuam passando.

## Implantação e reparo do Postify

Depois da validação, a instalação global do Codex FP será atualizada. O status obsoleto atual do Postify será reconciliado pela nova leitura usando o `state.json` já existente. Em seguida, a solicitação deverá ser executada novamente, pois a execução original não chegou ao planejamento nem alterou arquivos por meio do pipeline.

Será fornecido um prompt ou comando preciso para o projeto Postify caso seja necessário reinstalar sua integração. O reparo não fará commit, push, deploy ou reset nesse projeto.

## Critérios de aceitação

- A execução confirmada como falha não aparece mais como `RUNNING`.
- O erro `spawn codex ENOENT` não ocorre quando existe uma instalação válida do Codex Desktop.
- Status e estado da execução permanecem sincronizados em todas as transições.
- `feature status` mostra fase, estado e erro reais.
- `feature watch` acompanha mudanças e encerra em estados terminais.
- Toda a suíte passa com `node --test`.
