import fs from 'node:fs';
const usage = 'feature [--simple|--normal|--complex|--critical] [--plan-only|--implement-plan <path>|--review-only|--dry-run] "prompt"';
export async function runCli(args) {
  const flags = {}; const rest = [];
  for (let i = 0; i < args.length; i++) { const a = args[i]; if (a === '--help') return console.log(usage); if (a === '--version') return console.log('0.1.0'); if (a.startsWith('--')) { const k = a.slice(2); if (k === 'implement-plan' || k === 'config' || k === 'request-file') flags[k] = args[++i]; else flags[k] = true; } else rest.push(a); }
  const modes = ['plan-only','implement-plan','review-only']; if (modes.filter((m) => flags[m]).length > 1) throw Object.assign(new Error('Modos incompatíveis.'), { exitCode: 2 });
  const forced = flags.simple ? 'trivial' : flags.normal ? 'normal' : flags.complex ? 'complexa' : flags.critical ? 'critica' : null;
  const prompt = rest.join(' ') || (flags['request-file'] && JSON.parse(fs.readFileSync(flags['request-file'], 'utf8')).prompt);
  if (!prompt && !flags['review-only']) throw Object.assign(new Error(`Informe um prompt. Uso: ${usage}`), { exitCode: 2 });
  const result = classifyPrompt(prompt || 'review', forced);
  if (result.intent === 'analysis' && !flags['review-only']) { console.log('[feature] solicitação de análise; pipeline não acionado'); return; }
  const phases = result.level === 'TRIVIAL' ? ['implement Luna/medium','validate'] : flags['review-only'] ? ['review Sol/low'] : flags['plan-only'] ? ['plan Sol/medium'] : ['plan Sol/medium','implement Luna/medium','validate','review Sol/low'];
  if (flags['dry-run']) return console.log(JSON.stringify({ classification: result, phases, prompt }, null, 2));
  throw new Error('Execução de fases ainda requer configuração do projeto. Use --dry-run para validar a rota.');
}
import { classify } from './classifier.js';
function classifyPrompt(prompt, forced) { return classify(prompt, forced); }
