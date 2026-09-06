import fs from 'node:fs';
import path from 'node:path';
import { PipelineError } from './errors.js';

export function resolveCodexCommand({ configuredCommand, env = process.env, platform = process.platform } = {}) {
  const configured = normalizeCandidate(configuredCommand);
  if (configured) return resolveRequired(configured, 'codexCommand', env, platform);

  const environmentCommand = normalizeCandidate(env.CODEX_CLI_PATH);
  if (environmentCommand) return resolveRequired(environmentCommand, 'CODEX_CLI_PATH', env, platform);

  const fromPath = findOnPath('codex', env, platform);
  if (fromPath) return fromPath;

  if (platform === 'win32') {
    const desktop = findWindowsDesktopCodex(env.LOCALAPPDATA);
    if (desktop) return desktop;
  }

  throw new PipelineError('Codex CLI não encontrado. Verifique codexCommand, CODEX_CLI_PATH, PATH ou a instalação do Codex Desktop.', 4, 'missing_executable');
}

export function findOnPath(command, env = process.env, platform = process.platform) {
  const pathValue = env.PATH || env.Path || env.path || '';
  const directories = pathValue.split(platform === 'win32' ? ';' : ':').filter(Boolean);
  const extensions = platform === 'win32' ? commandExtensions(command, env.PATHEXT) : [''];
  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = path.join(directory.replace(/^"|"$/g, ''), `${command}${extension}`);
      if (isUsableFile(candidate, platform)) return candidate;
    }
  }
  return null;
}

export function findWindowsDesktopCodex(localAppData) {
  if (!localAppData) return null;
  const binRoot = path.join(localAppData, 'OpenAI', 'Codex', 'bin');
  if (!fs.existsSync(binRoot)) return null;
  const candidates = [];
  for (const entry of fs.readdirSync(binRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const executable = path.join(binRoot, entry.name, 'codex.exe');
    if (isUsableFile(executable, 'win32')) candidates.push({ executable, modifiedAt: fs.statSync(executable).mtimeMs });
  }
  candidates.sort((left, right) => right.modifiedAt - left.modifiedAt);
  return candidates[0]?.executable || null;
}

function resolveRequired(command, source, env, platform) {
  if (path.isAbsolute(command) || /[\\/]/.test(command)) {
    const absolute = path.resolve(command);
    if (isUsableFile(absolute, platform)) return absolute;
  } else {
    const resolved = findOnPath(command, env, platform);
    if (resolved) return resolved;
  }
  throw new PipelineError(`Codex CLI configurado em ${source} não foi encontrado: ${command}`, 4, 'missing_executable');
}

function normalizeCandidate(value) { return typeof value === 'string' && value.trim() ? value.trim().replace(/^"|"$/g, '') : null; }
function commandExtensions(command, pathExt) {
  if (path.extname(command)) return [''];
  const configured = (pathExt || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean);
  return ['', ...configured.map((extension) => extension.startsWith('.') ? extension : `.${extension}`)];
}
function isUsableFile(file, platform) {
  try {
    fs.accessSync(file, platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
    return fs.statSync(file).isFile();
  } catch { return false; }
}
