import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRun, writeState } from '../src/state.js';
import { readStatus, statusPath, watchStatus, writeStatus } from '../src/status.js';

function root() { return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-status-')); }

test('writeState atualiza o status na raiz correta', () => {
  const projectRoot = root(); const run = createRun(projectRoot, 'Corrigir', 'NORMAL', {});
  run.state.status = 'failed'; run.state.phase = 'planning';
  writeState(projectRoot, run.runDir, run.state);
  assert.equal(readStatus(projectRoot).status, 'failed');
  assert.equal(fs.existsSync(path.join(projectRoot, '.codex', '.codex')), false);
});

test('readStatus reconcilia status ativo com estado terminal da execução', () => {
  const projectRoot = root(); const run = createRun(projectRoot, 'Corrigir', 'NORMAL', {});
  const stale = { ...run.state, status: 'running', phase: 'initializing', updatedAt: '2026-01-01T00:00:00.000Z' };
  writeStatus(projectRoot, stale);
  const terminal = { ...run.state, status: 'failed', phase: 'planning', error: { category: 'missing_executable', message: 'não encontrado' }, updatedAt: '2026-01-01T00:00:01.000Z' };
  fs.writeFileSync(path.join(run.runDir, 'state.json'), JSON.stringify(terminal));
  const result = readStatus(projectRoot);
  assert.equal(result.status, 'failed'); assert.equal(result.error.category, 'missing_executable');
  assert.equal(JSON.parse(fs.readFileSync(statusPath(projectRoot), 'utf8')).status, 'failed');
});

test('readStatus preserva execução ainda ativa', () => {
  const projectRoot = root(); const run = createRun(projectRoot, 'Corrigir', 'NORMAL', {});
  const result = readStatus(projectRoot);
  assert.equal(result.status, 'running'); assert.equal(result.id, run.state.id);
});

test('watchStatus encerra com falha reconciliada', async () => {
  const projectRoot = root(); const run = createRun(projectRoot, 'Corrigir', 'NORMAL', {});
  fs.writeFileSync(path.join(run.runDir, 'state.json'), JSON.stringify({ ...run.state, status: 'failed', phase: 'planning', updatedAt: new Date(Date.now() + 1000).toISOString() }));
  const result = await watchStatus(projectRoot, 1);
  assert.equal(result.status, 'failed');
});

test('watchStatus considera planned um estado terminal', async () => {
  const projectRoot = root(); writeStatus(projectRoot, { status: 'planned', phase: 'complete' });
  const result = await watchStatus(projectRoot, 1);
  assert.equal(result.status, 'planned');
});
