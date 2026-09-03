import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoProtectedPaths, filesFromDiff } from '../src/protected-paths.js';

test('bloqueia env e pasta de segredos', () => {
  assert.throws(() => assertNoProtectedPaths(['.env.local'], ['.env.*']), /caminho protegido/);
  assert.throws(() => assertNoProtectedPaths(['secrets/key.txt'], ['secrets/**']), /caminho protegido/);
  assert.doesNotThrow(() => assertNoProtectedPaths(['src/app.js'], ['.env.*']));
});

test('extrai arquivos do diff real', () => {
  assert.deepEqual(filesFromDiff('diff --git a/.env.local b/.env.local\n'), ['.env.local']);
});
