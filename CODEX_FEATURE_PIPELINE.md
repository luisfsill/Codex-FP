# Codex Feature Pipeline

Núcleo independente para Postify e outros repositórios. A versão 1.0 executa planejamento, implementação, validação, revisão e até dois ciclos de correção usando o Codex CLI.

Modelos padrão: Sol para planejamento/revisão e Luna para implementação. O pipeline não faz commits, push, deploy, reset do Git ou leitura de segredos.

Use `feature install-project` dentro de cada projeto. Depois disso, solicitações de implementação feitas no Codex são detectadas pelo hook. Para execução manual, use `feature "Implementar ..."`.
