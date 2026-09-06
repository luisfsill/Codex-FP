import fs from 'node:fs';
import path from 'node:path';

const terminalStatuses = new Set(['completed', 'approved', 'failed', 'changes_requested', 'planned', 'idle']);
const activeStatuses = new Set(['running']);

export function statusPath(root) { return path.join(root, '.codex', 'pipeline', 'status.json'); }
export function readStatus(root) {
  const file = statusPath(root);
  if (!fs.existsSync(file)) return { status: 'idle', projectRoot: root };
  try {
    const status = JSON.parse(fs.readFileSync(file, 'utf8'));
    const reconciled = reconcileStatus(root, status);
    if (reconciled !== status) { try { writeStatus(root, reconciled); } catch { /* Reading remains useful when repair is not writable. */ } }
    return { ...reconciled, projectRoot: root };
  } catch { return { status: 'unknown', projectRoot: root }; }
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
    if (terminalStatuses.has(state.status)) return state;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

function reconcileStatus(root, status) {
  if (!activeStatuses.has(status.status) || !status.id) return status;
  const runStatePath = path.join(root, '.codex', 'pipeline', 'runs', safeRunId(status.id), 'state.json');
  if (!fs.existsSync(runStatePath)) return status;
  try {
    const runState = JSON.parse(fs.readFileSync(runStatePath, 'utf8'));
    if (runState.id !== status.id) return status;
    if (terminalStatuses.has(runState.status) || isNewer(runState.updatedAt, status.updatedAt)) return runState;
  } catch { /* Preserve the readable canonical status if the run state is invalid. */ }
  return status;
}

function safeRunId(id) { return String(id).replace(/[^a-zA-Z0-9._-]/g, '_'); }
function isNewer(candidate, current) {
  const candidateTime = Date.parse(candidate || ''); const currentTime = Date.parse(current || '');
  return Number.isFinite(candidateTime) && (!Number.isFinite(currentTime) || candidateTime > currentTime);
}
