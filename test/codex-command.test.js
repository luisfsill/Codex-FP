import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveCodexCommand, resolveCodexInvocation } from '../src/codex-command.js';

function executable(root, relativePath) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '');
  return file;
}

test('codexCommand configurado tem precedência', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-command-'));
  const configured = executable(root, 'configured.exe');
  const environment = executable(root, 'environment.exe');
  assert.equal(resolveCodexCommand({ configuredCommand: configured, env: { CODEX_CLI_PATH: environment, PATH: '' }, platform: 'win32' }), configured);
});

test('CODEX_CLI_PATH tem precedência sobre PATH', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-command-'));
  const environment = executable(root, 'environment.exe');
  const bin = path.join(root, 'bin'); executable(bin, 'codex.exe');
  assert.equal(resolveCodexCommand({ env: { CODEX_CLI_PATH: environment, PATH: bin, PATHEXT: '.EXE' }, platform: 'win32' }), environment);
});

test('encontra codex no PATH', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-command-'));
  const expected = executable(root, 'codex.exe');
  assert.equal(resolveCodexCommand({ env: { PATH: root, PATHEXT: '.EXE' }, platform: 'win32' }).toLowerCase(), expected.toLowerCase());
});

test('prioriza codex.cmd sobre um shim sem extensão no Windows', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-command-'));
  executable(root, 'codex'); const expected = executable(root, 'codex.cmd');
  const result = resolveCodexInvocation({ env: { PATH: root, PATHEXT: '.EXE;.CMD' }, platform: 'win32' });
  assert.equal(result.command.toLowerCase(), expected.toLowerCase()); assert.equal(result.shell, true);
});

test('caminho absoluto sem extensão encontra codex.cmd', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-command-'));
  const expected = executable(root, 'codex.cmd');
  const result = resolveCodexInvocation({ configuredCommand: path.join(root, 'codex'), env: { PATHEXT: '.CMD;.EXE' }, platform: 'win32' });
  assert.equal(result.command.toLowerCase(), expected.toLowerCase()); assert.equal(result.shell, true);
});

test('mantém binário sem shell em macOS e Linux', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-command-'));
  const expected = executable(root, 'codex');
  const result = resolveCodexInvocation({ configuredCommand: expected, env: {}, platform: 'linux' });
  assert.equal(result.command, expected); assert.equal(result.shell, false);
});

test('encontra a instalação mais recente do Codex Desktop', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-fp-command-'));
  const older = executable(root, path.join('OpenAI', 'Codex', 'bin', 'old', 'codex.exe'));
  const newer = executable(root, path.join('OpenAI', 'Codex', 'bin', 'new', 'codex.exe'));
  fs.utimesSync(older, new Date(1_000), new Date(1_000)); fs.utimesSync(newer, new Date(2_000), new Date(2_000));
  assert.equal(resolveCodexCommand({ env: { LOCALAPPDATA: root, PATH: '' }, platform: 'win32' }), newer);
});

test('explica quando o Codex CLI não é encontrado', () => {
  assert.throws(() => resolveCodexCommand({ env: { PATH: '', PATHEXT: '.EXE;.CMD' }, platform: 'win32' }), (error) => error.category === 'missing_executable' && /Comando solicitado: codex/.test(error.message) && /Caminhos testados/.test(error.message) && /where\.exe codex/.test(error.message));
});
