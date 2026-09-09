# Resolução confiável do Codex CLI no Windows

## Problema

No Windows, um shim npm pode oferecer um arquivo `codex` sem extensão junto de `codex.cmd`. O pipeline atual procura o nome sem extensão antes das extensões de `PATHEXT` e executa o resultado com `spawn` sem shell. Isso pode selecionar um shim que o Windows não inicia diretamente e produzir `ENOENT`.

## Decisão

O resolvedor retornará uma descrição da invocação com comando, origem, modo de shell, comando solicitado e candidatos testados. Em Windows, uma solicitação sem extensão testará extensões de `PATHEXT` antes do arquivo sem extensão. Arquivos `.cmd` e `.bat` usarão shell somente no Windows; executáveis nativos e sistemas Unix continuarão sem shell.

Um caminho absoluto sem extensão também será expandido usando `PATHEXT`, permitindo que uma configuração com `C:/.../codex` encontre `codex.cmd` ou `codex.exe`.

## Diagnóstico

Quando não houver candidato utilizável, a mensagem incluirá o comando solicitado, a origem, os candidatos testados e instruções para usar `where.exe codex`, verificar a instalação e ajustar o `PATH`. Nenhum caminho fixo do npm será tratado como obrigatório.

## Compatibilidade e testes

As fontes continuam sendo `codexCommand`, `CODEX_CLI_PATH`, `PATH` e Codex Desktop no Windows. Os testes cobrirão `.exe`, `.cmd`, caminho configurado, ausência, escolha de shell e preservação de argumentos da fase. Um teste de CLI cobrirá `--request-file` sem acessar o Postify.
