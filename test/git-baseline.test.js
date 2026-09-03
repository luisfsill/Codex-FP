import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { captureBaseline, diffFromTree } from '../src/git-baseline.js';

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
}

test('baseline preserva índice real e separa mudanças posteriores', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-git-'));
  git(root, 'init'); git(root, 'config', 'user.email', 'test@example.com'); git(root, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(root, 'file.txt'), 'base\n'); git(root, 'add', 'file.txt'); git(root, 'commit', '-m', 'base');
  fs.writeFileSync(path.join(root, 'file.txt'), 'user change\n');
  const runDir = path.join(root, '.codex', 'pipeline', 'runs', 'test'); fs.mkdirSync(runDir, { recursive: true });
  const indexBefore = fs.readFileSync(path.join(root, '.git', 'index'));
  const baseline = await captureBaseline(root, runDir);
  assert.deepEqual(fs.readFileSync(path.join(root, '.git', 'index')), indexBefore);
  fs.writeFileSync(path.join(root, 'file.txt'), 'pipeline change\n');
  assert.match(await diffFromTree(root, baseline.tree), /pipeline change/);
  assert.doesNotMatch(await diffFromTree(root, baseline.tree), /^\+user change$/m);
  assert.doesNotMatch(await diffFromTree(root, baseline.tree), /.codex\/pipeline/);
});
