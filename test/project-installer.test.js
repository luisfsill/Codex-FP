import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installProject } from '../src/project-installer.js';

test('instala projeto sem remover hooks existentes e é idempotente', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-install-'));
  fs.mkdirSync(path.join(root, '.codex'));
  fs.writeFileSync(path.join(root, '.codex', 'hooks.json'), JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [] }] } }));
  installProject(root);
  installProject(root);
  const hooks = JSON.parse(fs.readFileSync(path.join(root, '.codex', 'hooks.json'), 'utf8'));
  assert.equal(hooks.hooks.PreToolUse.length, 1);
  assert.equal(hooks.hooks.UserPromptSubmit.length, 1);
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /Codex Feature Pipeline/);
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /.codex\/pipeline\//);
});
