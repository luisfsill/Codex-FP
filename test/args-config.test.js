import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, forcedLevel } from '../src/args.js';
import { loadConfig } from '../src/config.js';

test('interpreta modos e override de complexidade', () => {
  const parsed = parseArgs(['--complex', '--plan-only', 'Criar integração']);
  assert.equal(forcedLevel(parsed.flags), 'COMPLEXA');
  assert.equal(parsed.flags['plan-only'], true);
});

test('rejeita modos conflitantes', () => {
  assert.throws(() => parseArgs(['--plan-only', '--review-only']), /somente um modo/);
});

test('carrega defaults sem arquivo e rejeita config inválida', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-config-'));
  assert.equal(loadConfig(root).config.models.planner.model, 'gpt-5.6-sol');
  fs.mkdirSync(path.join(root, '.codex'));
  fs.writeFileSync(path.join(root, '.codex', 'feature-pipeline.json'), JSON.stringify({ maxCorrectionCycles: 9 }));
  assert.throws(() => loadConfig(root), /entre 0 e 2/);
});

test('falha para arquivo explícito ausente e modelo vazio', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-config-'));
  assert.throws(() => loadConfig(root, 'missing.json'), /não encontrada/);
  fs.mkdirSync(path.join(root, '.codex'));
  fs.writeFileSync(path.join(root, '.codex', 'feature-pipeline.json'), JSON.stringify({ models: { planner: { model: '', reasoning: 'medium' } } }));
  assert.throws(() => loadConfig(root), /planner/);
});
