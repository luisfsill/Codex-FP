import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'feature.js');

test('feature lê --request-file e preserva o fluxo de planejamento', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-cli-'));
  fs.writeFileSync(path.join(root, 'request.json'), JSON.stringify({ prompt: 'Implementar integração com webhook' }));
  const result = spawnSync(process.execPath, [cli, '--dry-run', '--request-file', 'request.json'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.classification.intent, 'implementation');
  assert.equal(output.classification.level, 'COMPLEXA');
  assert.match(output.phases[0], /^plan /);
  assert.match(output.phases[1], /^implement /);
});
