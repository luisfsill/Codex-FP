# Codex Feature Pipeline

Pipeline local para organizar solicitações de implementação no Codex. Ele identifica o tipo de tarefa, indica o fluxo recomendado entre planejamento, implementação, validação e revisão, e não aciona o processo para perguntas ou explicações.

> Projeto em desenvolvimento: a versão atual possui classificação, CLI, `--dry-run`, hook, configuração, testes e instalador Windows. A execução automática completa das fases Sol/Luna ainda está sendo finalizada.

## Requisitos

- Windows 10 ou superior
- Node.js 18 ou superior
- Codex CLI instalado e autenticado
- PowerShell

```powershell
node --version
codex --version
```

## Instalação rápida

```powershell
git clone https://github.com/luisfsill/Codex-FP.git
cd .\Codex-FP
powershell -ExecutionPolicy Bypass -File .\scripts\install-codex-feature-pipeline.ps1
```

O instalador cria `feature` e `codex-feature` em `%USERPROFILE%\.local\bin`. Feche e abra o PowerShell e confirme:

```powershell
feature --version
codex-feature --version
```

### Instalação com um comando

Em um PowerShell, execute:

```powershell
irm https://luisfsill.github.io/Codex-FP/install.ps1 | iex
```

O script baixa a versão atual, instala em `%LOCALAPPDATA%\Codex-FP` e cria os launchers globais. Para ambientes corporativos, prefira baixar o arquivo, revisar o conteúdo e executá-lo localmente.

Para atualizar, execute o mesmo comando novamente. Para remover:

```powershell
& "$env:LOCALAPPDATA\Codex-FP\install.ps1" -Uninstall
```

## Usar no Postify

No Postify, a integração já está preparada em `.codex/hooks.json`, `.codex/feature-pipeline.json` e `AGENTS.md`.

Depois de abrir o projeto no Codex, peça normalmente:

```text
Implemente filtros salvos no Kanban.
```

Você não precisa escrever `feature` em cada pedido. O hook reconhece solicitações de implementação e prepara o pipeline. Perguntas como `Como funciona o Kanban?` não acionam o fluxo.

## Testar sem alterar arquivos

```powershell
feature --dry-run "Criar integração com webhook"
```

Saída esperada: `COMPLEXA`, com `Sol medium -> Luna medium -> validação -> Sol low`.

## Classificação

| Nível | Exemplos | Fluxo previsto |
| --- | --- | --- |
| `TRIVIAL` | Texto ou ajuste local simples | Luna |
| `NORMAL` | Feature comum ou correção localizada | Sol planeja, Luna implementa, Sol revisa |
| `COMPLEXA` | Integrações, refatorações e vários módulos | Sol planeja, Luna implementa, Sol revisa |
| `CRITICA` | Autenticação, permissões, pagamentos ou dados sensíveis | Sol planeja, Luna implementa, Sol revisa com esforço maior |

Para forçar um nível:

```powershell
feature --simple "Corrigir o texto do botão"
feature --normal "Adicionar uma preferência de usuário"
feature --complex "Refatorar o fluxo de sincronização"
feature --critical "Alterar o sistema de autenticação"
```

## Opções

```powershell
feature --help
feature --version
feature --dry-run "Sua solicitação"
feature --plan-only "Sua solicitação"
feature --implement-plan .\caminho\do\plano.md
feature --review-only
```

Na versão atual, `--dry-run` é o modo recomendado para testar. Os demais modos fazem parte da interface planejada, mas a execução completa das fases ainda está em desenvolvimento.

## Instalar em outro projeto

O instalador global precisa ser executado apenas uma vez por computador. Em cada novo projeto, copie `.codex/feature-pipeline.json` e configure o hook `UserPromptSubmit` apontando para o `src/hook.js` desta instalação, preservando os hooks existentes.

## Desinstalação

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-codex-feature-pipeline.ps1 -Uninstall
```

Isso remove somente os launchers criados pelo instalador.

## Desenvolvimento

```powershell
npm test
npm run dry-run
```

## Segurança

O pipeline não executa automaticamente `git reset`, `git clean`, commits, `git push`, deploys, publicação, leitura de segredos ou bypass de permissões do Codex.

## Links

- Repositório: https://github.com/luisfsill/Codex-FP
- Documentação técnica: [CODEX_FEATURE_PIPELINE.md](./CODEX_FEATURE_PIPELINE.md)
