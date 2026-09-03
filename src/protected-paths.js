import { PipelineError } from './errors.js';

export function assertNoProtectedPaths(files, patterns) {
  const protectedFiles = files.filter((file) => patterns.some((pattern) => matches(file.replace(/\\/g, '/'), pattern)));
  if (protectedFiles.length) throw new PipelineError(`Alteração bloqueada em caminho protegido: ${protectedFiles.join(', ')}`, 9, 'protected_path');
}

export function filesFromDiff(diff) {
  const files = new Set();
  for (const line of diff.split(/\r?\n/)) {
    const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (match) files.add(match[2]);
  }
  return [...files];
}

function matches(file, pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  if (normalized.endsWith('/**')) return file === normalized.slice(0, -3) || file.startsWith(normalized.slice(0, -2));
  if (normalized.includes('*')) {
    const expression = normalized.split('*').map(escapeRegex).join('[^/]*');
    return new RegExp(`^${expression}$`, 'i').test(file);
  }
  return file.toLowerCase() === normalized.toLowerCase();
}

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
