import fs from 'node:fs';
import path from 'node:path';

export function statusPath(root) { return path.join(root, '.codex', 'pipeline', 'status.json'); }
export function readStatus(root) {
  const file = statusPath(root);
  if (!fs.existsSync(file)) return { status: 'idle', projectRoot: root };
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { status: 'unknown', projectRoot: root }; }
}
export function writeStatus(root, state) {
  const file = statusPath(root); fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`; fs.writeFileSync(temp, JSON.stringify({ ...state, projectRoot: root, updatedAt: new Date().toISOString() }, null, 2)); fs.renameSync(temp, file);
}
export function formatStatus(state) {
  const lines = [`Codex FP: ${String(state.status || 'unknown').toUpperCase()}`];
  if (state.projectRoot) lines.push(`Projeto: ${state.projectRoot}`);
  if (state.request) lines.push(`Tarefa: ${state.request}`);
  if (state.phase) lines.push(`Fase: ${state.phase}`);
  if (state.model) lines.push(`Modelo: ${state.model}`);
  if (state.id) lines.push(`Execucao: ${state.id}`);
  if (state.error?.message) lines.push(`Erro: ${state.error.message}`);
  return lines.join('\n');
}
export async function watchStatus(root, intervalMs = 1000) {
  let previous = '';
  while (true) {
    const state = readStatus(root); const output = JSON.stringify(state);
    if (output !== previous) { console.clear(); console.log(formatStatus(state)); previous = output; }
    if (['completed', 'approved', 'failed', 'changes_requested', 'idle'].includes(state.status)) return state;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
