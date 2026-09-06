import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runPipeline } from '../src/orchestrator.js';
import { DEFAULT_CONFIG } from '../src/config.js';
import { readStatus } from '../src/status.js';

const flags = { dryRun: false, planOnly: false, implementPlan: null, reviewOnly: false, approveForMe: false };
const plan = { summary: 'Plano', steps: ['Editar'], acceptanceCriteria: ['Passa'], risks: [], recommendedLevel: 'NORMAL', escalationReason: '' };
const implementation = { summary: 'Implementado', changedFiles: ['src/app.js'], validations: [], unresolvedIssues: [] };
const approved = { verdict: 'APPROVED', findings: [], residualRisks: [] };
const rejected = { verdict: 'CHANGES_REQUESTED', findings: [{ severity: 'medium', file: 'src/app.js', line: 1, message: 'Erro', recommendation: 'Corrigir' }], residualRisks: [] };

function setup() { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-flow-')); return { root, config: structuredClone(DEFAULT_CONFIG) }; }

test('fluxo normal planeja, implementa, valida e aprova', async () => {
  const { root, config } = setup(); const kinds = []; config.codexCommand = 'C:/Codex/codex.exe';
  const expectedProgress = { plan: ['planning', 'gpt-6-astra'], implementation: ['implementing', 'gpt-5.6-luna'], review: ['reviewing', 'gpt-5.6-sol'] };
  const phaseRunner = async ({ kind, codexCommand }) => { kinds.push(kind); assert.equal(codexCommand, config.codexCommand); const status = readStatus(root); assert.deepEqual([status.phase, status.model], expectedProgress[kind]); return kind === 'plan' ? plan : kind === 'implementation' ? implementation : approved; };
  const result = await runPipeline({ request: 'Implementar recurso', classification: 'NORMAL', flags, root, config, phaseRunner, validationRunner: async () => { const status = readStatus(root); assert.equal(status.phase, 'validating'); assert.equal(status.model, undefined); return []; }, baselineCapture: async () => ({ tree: 'tree' }), treeDiff: async () => 'diff' });
  assert.equal(result.status, 'approved'); assert.deepEqual(kinds, ['plan', 'implementation', 'review']); assert.equal(fs.existsSync(result.reportPath), true);
});

test('plan-only não executa implementação', async () => {
  const { root, config } = setup(); const kinds = [];
  const result = await runPipeline({ request: 'Planejar recurso', classification: 'NORMAL', flags: { ...flags, planOnly: true }, root, config, phaseRunner: async ({ kind }) => { kinds.push(kind); return plan; } });
  assert.equal(result.status, 'planned'); assert.deepEqual(kinds, ['plan']);
});

test('review-only usa diff atual sem implementar', async () => {
  const { root, config } = setup(); const kinds = [];
  const result = await runPipeline({ request: 'Revisar', classification: 'NORMAL', flags: { ...flags, reviewOnly: true }, root, config, phaseRunner: async ({ kind }) => { kinds.push(kind); return approved; }, headDiff: async () => 'diff atual' });
  assert.equal(result.status, 'approved'); assert.deepEqual(kinds, ['review']);
});

test('implementa um plano existente sem chamar planner', async () => {
  const { root, config } = setup(); const planPath = path.join(root, 'plan.md'); fs.writeFileSync(planPath, '# Plano existente'); const kinds = [];
  const result = await runPipeline({ request: 'Implementar plano', classification: 'NORMAL', flags: { ...flags, implementPlan: planPath }, root, config, phaseRunner: async ({ kind }) => { kinds.push(kind); return kind === 'implementation' ? implementation : approved; }, validationRunner: async () => [], baselineCapture: async () => ({ tree: 'tree' }), treeDiff: async () => 'diff' });
  assert.equal(result.status, 'approved'); assert.deepEqual(kinds, ['implementation', 'review']);
});

test('preserva relatório quando uma fase falha', async () => {
  const { root, config } = setup();
  await assert.rejects(runPipeline({ request: 'Implementar recurso', classification: 'NORMAL', flags, root, config, phaseRunner: async () => { throw new Error('falha simulada'); } }), (error) => {
    assert.equal(fs.existsSync(error.reportPath), true);
    assert.match(fs.readFileSync(error.reportPath, 'utf8'), /falha simulada/);
    assert.equal(readStatus(root).status, 'failed');
    return true;
  });
});

test('limita correções a dois ciclos', async () => {
  const { root, config } = setup(); let implementationCalls = 0;
  const phaseRunner = async ({ kind }) => { if (kind === 'plan') return plan; if (kind === 'implementation') { implementationCalls += 1; return implementation; } return rejected; };
  const previousExitCode = process.exitCode;
  const result = await runPipeline({ request: 'Implementar recurso', classification: 'NORMAL', flags, root, config, phaseRunner, validationRunner: async () => [], baselineCapture: async () => ({ tree: 'tree' }), treeDiff: async () => 'diff' });
  process.exitCode = previousExitCode;
  assert.equal(result.status, 'changes_requested'); assert.equal(implementationCalls, 3);
});
