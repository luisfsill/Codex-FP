import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { runProcess } from './process.js';
async function git(root, args, options = {}) { return runProcess('git', args, { cwd: root, timeoutMs: 120000, ...options }); }
function hash(file) { return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null; }
export async function captureBaseline(root, runDir) {
  const gitDir = path.resolve(root, (await git(root, ['rev-parse', '--git-dir'])).stdout.trim()); const realIndex = path.join(gitDir, 'index'); const before = hash(realIndex); const tempIndex = path.join(runDir, 'baseline.index'); const env = { GIT_INDEX_FILE: tempIndex };
  let hasHead = true; try { await git(root, ['read-tree', 'HEAD'], { env }); } catch { hasHead = false; }
  await git(root, ['add', '-A', '--', '.', ':(exclude).codex/pipeline/**'], { env }); const tree = (await git(root, ['write-tree'], { env })).stdout.trim(); const after = hash(realIndex); if (before !== after) throw new Error('O índice Git real foi alterado durante o baseline.');
  const baseline = { tree, hasHead, realIndexHash: before, createdAt: new Date().toISOString() }; fs.writeFileSync(path.join(runDir, 'baseline.json'), JSON.stringify(baseline, null, 2)); return baseline;
}
export async function diffFromTree(root, tree) { return (await git(root, ['diff', '--no-ext-diff', '--binary', tree, '--', '.', ':(exclude).codex/pipeline/**'])).stdout; }
export async function diffFromHead(root) { return (await git(root, ['diff', '--no-ext-diff', '--binary', 'HEAD', '--', '.', ':(exclude).codex/pipeline/**'])).stdout; }
