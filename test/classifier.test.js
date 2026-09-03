import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../src/classifier.js';
test('classifica pergunta como análise', () => assert.equal(classify('Como funciona o Kanban?').intent, 'analysis'));
test('classifica implementação comum', () => assert.deepEqual(classify('Implementar filtro salvo'), { intent: 'implementation', level: 'NORMAL' }));
test('classifica integração como complexa', () => assert.equal(classify('Criar integração com webhook').level, 'COMPLEXA'));
test('classifica autenticação como crítica', () => assert.equal(classify('Alterar autenticação').level, 'CRITICA'));
