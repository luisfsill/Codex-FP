import test from 'node:test';
import assert from 'node:assert/strict';
import { runProcess } from '../src/process.js';

test('reporta executável inexistente', async () => {
  await assert.rejects(runProcess('codex-fp-command-that-does-not-exist', [], { timeoutMs: 1000 }), (error) => error.category === 'missing_executable');
});
