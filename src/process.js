import { spawn } from 'node:child_process';
import { PipelineError } from './errors.js';
export function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: { ...process.env, ...(options.env || {}) }, shell: options.shell || false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(new PipelineError(`${command} excedeu o limite de tempo.`, 5, 'timeout')); }, options.timeoutMs || 600000);
    child.stdout.on('data', (chunk) => { stdout += chunk; options.onStdout?.(chunk.toString()); });
    child.stderr.on('data', (chunk) => { stderr += chunk; options.onStderr?.(chunk.toString()); });
    child.on('error', (error) => { clearTimeout(timer); reject(new PipelineError(`Falha ao iniciar ${command}: ${error.message}`, 4, 'missing_executable')); });
    child.on('close', (code) => { clearTimeout(timer); if (code === 0) resolve({ code, stdout, stderr }); else reject(Object.assign(new PipelineError(`${command} terminou com código ${code}. ${stderr.trim()}`, 5, 'process_failure'), { stdout, stderr })); });
    if (options.input) child.stdin.write(options.input); child.stdin.end();
  });
}
