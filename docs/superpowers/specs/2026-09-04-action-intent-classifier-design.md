# Classificador de intenção orientado a ações

## Objetivo

Fazer o Codex Feature Pipeline reconhecer solicitações acionáveis mesmo quando o usuário emprega verbos, tempos verbais ou construções que não estejam em uma lista fechada. Perguntas estritamente informativas devem continuar fora do pipeline, enquanto perguntas que pedem uma alteração devem acioná-lo.

## Escopo

Esta mudança cobre o classificador, o parser dos comandos próprios da CLI, o hook `UserPromptSubmit`, os testes automatizados, a instalação idempotente dos hooks e a documentação de uso. Ela não altera a sequência das fases do pipeline, os modelos configurados, os limites de correção ou as regras de segurança.

## Estratégia de classificação

O classificador adotará uma decisão em camadas:

1. Respeitar uma classificação forçada pela CLI.
2. Descartar entradas vazias e perguntas claramente informativas.
3. Reconhecer sinais explícitos de ação, incluindo imperativos, infinitivos, pedidos indiretos e construções de desejo ou necessidade.
4. Reconhecer perguntas acionáveis, como `Você pode corrigir?`, que combinam uma forma interrogativa com um pedido concreto.
5. Usar sinais contextuais de alteração como fallback quando houver uma construção de pedido e um objeto modificável.
6. Manter entradas apenas descritivas ou ambíguas fora do pipeline quando não houver pedido de ação.

A implementação usará conjuntos de padrões pequenos e separados por responsabilidade, em vez de uma única expressão regular extensa. Os grupos previstos são:

- marcadores informativos: `como funciona`, `por que`, `qual`, `explique`, `resuma` e equivalentes;
- marcadores de pedido: `quero que`, `preciso que`, `gostaria que`, `pode`, `poderia`, `seria bom`, `vamos` e equivalentes;
- ações explícitas: criar, alterar, corrigir, refazer, redesenhar, melhorar, otimizar, atualizar, configurar, organizar, substituir, remover, validar e famílias morfológicas relacionadas;
- objetos modificáveis: página, layout, estilo, componente, arquivo, código, teste, configuração, integração, fluxo, API, banco e equivalentes.

Os padrões devem aceitar português com ou sem acentos e uma cobertura básica de pedidos em inglês. A presença de um ponto de interrogação nunca será, isoladamente, motivo para descartar uma entrada.

## Nível de complexidade

Depois que a intenção for considerada acionável, a classificação de nível continuará usando os sinais existentes de criticidade e complexidade. O vocabulário de complexidade será ampliado apenas onde necessário para representar mudanças de interface, arquitetura e operações sensíveis. Na ausência desses sinais, o nível será `NORMAL`.

## Comandos da CLI

`status`, `watch` e `install-project` serão interpretados antes da classificação de texto. Os testes devem provar que esses comandos não chegam ao classificador, inclusive com opções como `status --json`.

## Hook e instalação

O hook continuará falhando de forma aberta para entradas inválidas e bloqueando recursão quando encontrar `[CODEX_FEATURE_PIPELINE_PHASE]` ou a variável de ambiente de execução interna.

O instalador será ajustado para identificar entradas antigas do próprio Codex FP pelo caminho de `src/hook.js`, remover duplicatas do produto e manter uma única entrada apontando para a instalação que está executando o instalador. Hooks de outras ferramentas e outros eventos serão preservados integralmente. Repetir `install-project` não poderá criar novas duplicatas.

## Testes

A suíte deverá cobrir:

- solicitações diretas, indiretas e interrogativas que pedem ação;
- redesign, refação visual, layout, estilo, melhoria, otimização e atualização;
- português com e sem acentos;
- pedidos comuns em inglês;
- perguntas estritamente informativas;
- comentários descritivos sem pedido concreto;
- níveis normal, complexo e crítico;
- comandos `status`, `watch` e `status --json`;
- prevenção de recursão e falha aberta do hook;
- remoção de hooks duplicados sem afetar hooks externos;
- idempotência da instalação;
- valor atual do planner padrão, `gpt-6-astra`.

## Critérios de aceitação

- O pedido de redesenho que originou esta mudança é classificado como implementação.
- `Pode redesenhar essa página?` aciona o pipeline.
- `Como funciona essa página?` não aciona o pipeline.
- `Essa página está estranha` não aciona o pipeline sem um pedido adicional.
- Os comandos de status e acompanhamento funcionam sem serem classificados como texto.
- Uma instalação repetida deixa exatamente um hook do Codex FP e preserva hooks de terceiros.
- Todos os testes passam por `node --test`.
- A documentação explica a nova regra de acionamento.

## Implantação no LeadGen

Após a publicação ou atualização da instalação global, o LeadGen deverá executar novamente `feature install-project`. Como o LeadGen é outro repositório, será entregue um prompt específico para atualizar sua configuração, remover a duplicação atual do hook e validar `feature status`, `feature watch` e uma solicitação de redesign sem executar commit, push ou deploy automaticamente.

## Riscos e mitigação

- Falsos positivos: reduzidos exigindo sinal de ação ou uma construção de pedido acompanhada de contexto modificável.
- Falsos negativos por vocabulário novo: reduzidos pelo fallback estrutural, que não depende apenas de verbos enumerados.
- Remoção indevida de hooks: evitada limitando a deduplicação a comandos que apontem para o `src/hook.js` do Codex FP.
- Regressão dos comandos de acompanhamento: evitada com testes diretos da CLI.
