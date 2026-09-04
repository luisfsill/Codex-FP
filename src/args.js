import { PipelineError } from './errors.js';
const valueOptions = new Set(['implement-plan', 'config', 'request-file', 'project']);
const booleanOptions = new Set(['simple', 'normal', 'complex', 'critical', 'plan-only', 'review-only', 'dry-run', 'help', 'version', 'approve-for-me', 'json']);
export function parseArgs(args) {
  const command = ['status', 'watch'].includes(args[0]) ? args.shift() : null;
  if (args[0] === 'install-project') args = ['--install-project', ...args.slice(1)];
  const flags = {}; const promptParts = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) { promptParts.push(arg); continue; }
    const key = arg.slice(2);
    if (key === 'install-project') { flags.installProject = true; continue; }
    if (valueOptions.has(key)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new PipelineError(`A opção --${key} exige um valor.`, 2, 'invalid_arguments');
      flags[key] = value; index += 1; continue;
    }
    if (!booleanOptions.has(key)) throw new PipelineError(`Opção desconhecida: --${key}`, 2, 'invalid_arguments');
    flags[key] = true;
  }
  if (['simple', 'normal', 'complex', 'critical'].filter((key) => flags[key]).length > 1) throw new PipelineError('Escolha somente um nível de complexidade.', 2, 'invalid_arguments');
  if (['plan-only', 'implement-plan', 'review-only'].filter((key) => flags[key]).length > 1) throw new PipelineError('Escolha somente um modo de execução.', 2, 'invalid_arguments');
  return { command, flags, prompt: promptParts.join(' ').trim() };
}
export function forcedLevel(flags) {
  if (flags.simple) return 'TRIVIAL'; if (flags.normal) return 'NORMAL'; if (flags.complex) return 'COMPLEXA'; if (flags.critical) return 'CRITICA'; return null;
}
