import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hook = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'hook.js');

test('hook cria envelope somente para implementação', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-hook-'));
  const implemented = spawnSync(process.execPath, [hook], { cwd: root, input: JSON.stringify({ turn_id: 'abc', prompt: 'Implementar um filtro' }), encoding: 'utf8' });
  assert.equal(implemented.status, 0);
  assert.match(implemented.stdout, /additionalContext/);
  assert.equal(fs.existsSync(path.join(root, '.codex', 'pipeline', 'inbox', 'abc.json')), true);
  const question = spawnSync(process.execPath, [hook], { cwd: root, input: JSON.stringify({ turn_id: 'q', prompt: 'Como funciona?' }), encoding: 'utf8' });
  assert.equal(question.stdout, '');
});

test('hook bloqueia recursão', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-hook-'));
  const result = spawnSync(process.execPath, [hook], { cwd: root, input: JSON.stringify({ prompt: '[CODEX_FEATURE_PIPELINE_PHASE] Implementar' }), encoding: 'utf8' });
  assert.equal(result.stdout, '');
});

test('hook falha aberto para entrada inválida', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-hook-'));
  const result = spawnSync(process.execPath, [hook], { cwd: root, input: '{inválido', encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});
