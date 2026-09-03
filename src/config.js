import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PipelineError } from './errors.js';
export const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  models: {
    planner: { model: 'gpt-5.6-sol', reasoning: 'medium' }, implementer: { model: 'gpt-5.6-luna', reasoning: 'medium' },
    reviewer: { model: 'gpt-5.6-sol', reasoning: 'low' }, criticalReviewer: { model: 'gpt-5.6-sol', reasoning: 'medium' }
  },
  maxCorrectionCycles: 2, codexTimeoutMs: 1800000, validationTimeoutMs: 600000, validation: [],
  protectedPaths: ['.env', '.env.local', '.env.*', 'secrets/**'], approveForMe: false
});
const reasoningValues = new Set(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
export function findProjectRoot(start = process.cwd()) {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: start, encoding: 'utf8', windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : path.resolve(start);
}
export function loadConfig(root, explicitPath) {
  const configPath = explicitPath ? path.resolve(root, explicitPath) : path.join(root, '.codex', 'feature-pipeline.json');
  let project = {};
  if (fs.existsSync(configPath)) { try { project = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (error) { throw new PipelineError(`Configuração inválida em ${configPath}: ${error.message}`, 3, 'invalid_config'); } }
  else if (explicitPath) throw new PipelineError(`Configuração não encontrada: ${configPath}`, 3, 'missing_config');
  const config = { ...DEFAULT_CONFIG, ...project, models: { ...DEFAULT_CONFIG.models, ...(project.models || {}) } };
  validateConfig(config); return { config, configPath, exists: fs.existsSync(configPath) };
}
export function validateConfig(config) {
  if (!Number.isInteger(config.maxCorrectionCycles) || config.maxCorrectionCycles < 0 || config.maxCorrectionCycles > 2) throw new PipelineError('maxCorrectionCycles deve estar entre 0 e 2.', 3, 'invalid_config');
  for (const role of ['planner', 'implementer', 'reviewer', 'criticalReviewer']) { const entry = config.models[role]; if (!entry?.model || !reasoningValues.has(entry.reasoning)) throw new PipelineError(`Modelo/configuração inválida para ${role}.`, 3, 'invalid_config'); }
  if (!Array.isArray(config.validation) || !config.validation.every((item) => typeof item === 'string')) throw new PipelineError('validation deve ser uma lista de comandos.', 3, 'invalid_config');
}
