import fs from 'node:fs'; import path from 'node:path';
import { runProcess } from './process.js'; import { assertStructuredOutput, schemas } from './schemas.js'; import { PipelineError } from './errors.js';
import { resolveCodexInvocation } from './codex-command.js';
export async function runCodexPhase({ kind, prompt, root, runDir, model, reasoning, sandbox, timeoutMs, codexCommand, approveForMe = false, attempt = 1, runner = runProcess, commandResolver = resolveCodexInvocation, repair = false }) {
  const prefix = `${kind}-${String(attempt).padStart(2, '0')}`; const schemaPath = path.join(runDir, `${prefix}.schema.json`); const outputPath = path.join(runDir, `${prefix}.output.json`); const eventsPath = path.join(runDir, `${prefix}.events.jsonl`);
  fs.writeFileSync(schemaPath, JSON.stringify(schemas[kind], null, 2));
  const args = ['exec', '-m', model, '-c', `model_reasoning_effort="${reasoning}"`, '-C', root, '-s', sandbox, '--json', '--output-schema', schemaPath, '-o', outputPath, '--ephemeral'];
  if (approveForMe && sandbox === 'workspace-write') args.push('--approve-for-me');
  args.push('-');
  const resolved = commandResolver({ configuredCommand: codexCommand }); const executable = typeof resolved === 'string' ? { command: resolved, shell: undefined } : resolved;
  let events = ''; await runner(executable.command, args, { cwd: root, timeoutMs, shell: executable.shell, input: `[CODEX_FEATURE_PIPELINE_PHASE]\n${prompt}`, env: { CODEX_FEATURE_PIPELINE_ACTIVE: '1' }, onStdout: (text) => { events += text; } }); fs.writeFileSync(eventsPath, events);
  try {
    const parsed = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    return assertStructuredOutput(kind, parsed);
  } catch (error) {
    if (!repair) return runCodexPhase({ kind, prompt: `${prompt}\nA resposta anterior foi inválida. Retorne somente o objeto exigido pelo JSON Schema.`, root, runDir, model, reasoning, sandbox, timeoutMs, codexCommand, approveForMe, attempt: attempt + 500, runner, commandResolver, repair: true });
    throw new PipelineError(`Saída inválida da fase ${kind}: ${error.message}`, 6, 'invalid_output');
  }
}
