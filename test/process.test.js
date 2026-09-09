import test from 'node:test';
import assert from 'node:assert/strict';
import { runProcess, shouldUseShell } from '../src/process.js';

test('reporta executável inexistente', async () => {
  await assert.rejects(runProcess('codex-fp-command-that-does-not-exist', [], { timeoutMs: 1000 }), (error) => error.category === 'missing_executable');
});

test('usa shell apenas para cmd e bat no Windows', () => {
  assert.equal(shouldUseShell('C:/tools/codex.cmd', {}, 'win32'), true);
  assert.equal(shouldUseShell('C:/tools/codex.bat', {}, 'win32'), true);
  assert.equal(shouldUseShell('C:/tools/codex.exe', {}, 'win32'), false);
  assert.equal(shouldUseShell('/usr/local/bin/codex', {}, 'linux'), false);
  assert.equal(shouldUseShell('C:/tools/codex.cmd', { shell: false }, 'win32'), false);
});
