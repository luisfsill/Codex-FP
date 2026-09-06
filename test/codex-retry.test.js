import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCodexPhase } from '../src/codex.js';

test('repete uma vez quando a saída estruturada é inválida', async () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-retry-'));
  let calls = 0;
  const runner = async (_command, args, options) => {
    calls += 1;
    const output = args[args.indexOf('-o') + 1];
    fs.writeFileSync(output, calls === 1 ? 'inválido' : JSON.stringify({ verdict: 'APPROVED', findings: [], residualRisks: [] }));
    options.onStdout?.('{}\n');
    return { code: 0, stdout: '', stderr: '' };
  };
  const result = await runCodexPhase({ kind: 'review', prompt: 'Revisar', root: runDir, runDir, model: 'gpt-test', reasoning: 'low', sandbox: 'read-only', timeoutMs: 1000, runner, commandResolver: () => 'codex-test' });
  assert.equal(result.verdict, 'APPROVED'); assert.equal(calls, 2);
});
