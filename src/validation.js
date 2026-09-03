import { runProcess } from './process.js';
export async function runValidations(commands, root, timeoutMs, runner = runProcess) {
  const results = []; for (const command of commands) { const startedAt = Date.now(); try { const result = await runner(command, [], { cwd: root, timeoutMs, shell: true }); results.push({ command, passed: true, durationMs: Date.now() - startedAt, output: `${result.stdout}\n${result.stderr}`.trim().slice(-20000) }); } catch (error) { results.push({ command, passed: false, durationMs: Date.now() - startedAt, output: `${error.stdout || ''}\n${error.stderr || error.message}`.trim().slice(-20000) }); } } return results;
}
