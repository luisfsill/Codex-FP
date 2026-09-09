import fs from 'node:fs';
import path from 'node:path';
import { PipelineError } from './errors.js';

export function resolveCodexInvocation({ configuredCommand, env = process.env, platform = process.platform } = {}) {
  const searchedPaths = [];
  const configured = normalizeCandidate(configuredCommand);
  if (configured) return resolveRequired(configured, 'codexCommand', env, platform, searchedPaths);

  const environmentCommand = normalizeCandidate(env.CODEX_CLI_PATH);
  if (environmentCommand) return resolveRequired(environmentCommand, 'CODEX_CLI_PATH', env, platform, searchedPaths);

  const fromPath = findOnPathInvocation('codex', env, platform, searchedPaths);
  if (fromPath) return fromPath;

  if (platform === 'win32') {
    const desktop = findWindowsDesktopCodex(env.LOCALAPPDATA, searchedPaths);
    if (desktop) return invocation(desktop, 'Codex Desktop', platform, searchedPaths);
  }

  throw missingExecutable('codex', 'PATH e Codex Desktop', searchedPaths, env);
}

export function resolveCodexCommand(options) { return resolveCodexInvocation(options).command; }

export function findOnPath(command, env = process.env, platform = process.platform) {
  return findOnPathInvocation(command, env, platform, [])?.command || null;
}

export function findWindowsDesktopCodex(localAppData, searchedPaths = []) {
  if (!localAppData) return null;
  const binRoot = path.join(localAppData, 'OpenAI', 'Codex', 'bin');
  if (!fs.existsSync(binRoot)) { searchedPaths.push(binRoot); return null; }
  const candidates = [];
  for (const entry of fs.readdirSync(binRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const executable = path.join(binRoot, entry.name, 'codex.exe');
    searchedPaths.push(executable);
    if (isUsableFile(executable, 'win32')) candidates.push({ executable, modifiedAt: fs.statSync(executable).mtimeMs });
  }
  candidates.sort((left, right) => right.modifiedAt - left.modifiedAt);
  return candidates[0]?.executable || null;
}

export function needsWindowsShell(command, platform = process.platform) {
  return platform === 'win32' && /\.(cmd|bat)$/i.test(command);
}

function resolveRequired(command, source, env, platform, searchedPaths) {
  const candidates = path.isAbsolute(command) || /[\\/]/.test(command)
    ? absoluteCandidates(command, env, platform)
    : pathCandidates(command, env, platform);
  searchedPaths.push(...candidates);
  const found = candidates.find((candidate) => isUsableFile(candidate, platform));
  if (found) return invocation(found, source, platform, searchedPaths);
  throw missingExecutable(command, source, searchedPaths, env);
}

function findOnPathInvocation(command, env, platform, searchedPaths) {
  const pathValue = env.PATH || env.Path || env.path || '';
  for (const directory of pathValue.split(platform === 'win32' ? ';' : ':').filter(Boolean)) {
    const candidates = commandCandidates(path.join(directory.replace(/^"|"$/g, ''), command), env, platform);
    searchedPaths.push(...candidates);
    const found = candidates.find((candidate) => isUsableFile(candidate, platform));
    if (found) return invocation(found, 'PATH', platform, searchedPaths);
  }
  return null;
}

function absoluteCandidates(command, env, platform) { return commandCandidates(path.resolve(command), env, platform); }
function pathCandidates(command, env, platform) {
  const pathValue = env.PATH || env.Path || env.path || '';
  const candidates = [];
  for (const directory of pathValue.split(platform === 'win32' ? ';' : ':').filter(Boolean)) candidates.push(...commandCandidates(path.join(directory.replace(/^"|"$/g, ''), command), env, platform));
  return candidates;
}

function commandCandidates(command, env, platform) {
  if (platform !== 'win32' || path.extname(command)) return [command];
  return commandExtensions(env.PATHEXT).map((extension) => `${command}${extension}`);
}

function commandExtensions(pathExt) {
  const supported = new Set(['.COM', '.EXE', '.BAT', '.CMD']);
  const values = (pathExt || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean).map((extension) => (extension.startsWith('.') ? extension : `.${extension}`).toUpperCase()).filter((extension) => supported.has(extension));
  return values.length ? values : ['.COM', '.EXE', '.BAT', '.CMD'];
}

function invocation(command, source, platform, searchedPaths) {
  return { command, source, shell: needsWindowsShell(command, platform), searchedPaths: [...searchedPaths] };
}

function missingExecutable(requestedCommand, source, searchedPaths, env) {
  const tested = searchedPaths.length ? searchedPaths.map((candidate) => `- ${candidate}`).join('\n') : '- Nenhum caminho foi produzido.';
  const pathValue = env.PATH || env.Path || env.path || '(vazio)';
  return new PipelineError(`Codex CLI não encontrado. Comando solicitado: ${requestedCommand}. Origem: ${source}.\nCaminhos testados:\n${tested}\nPATH analisado: ${pathValue}\nVerifique com \`where.exe codex\` no Windows ou \`command -v codex\` em macOS/Linux. Instale ou atualize o Codex CLI e inclua sua pasta no PATH; alternativamente, configure codexCommand ou CODEX_CLI_PATH.`, 4, 'missing_executable');
}

function normalizeCandidate(value) { return typeof value === 'string' && value.trim() ? value.trim().replace(/^"|"$/g, '') : null; }
function isUsableFile(file, platform) {
  try {
    fs.accessSync(file, platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
    return fs.statSync(file).isFile();
  } catch { return false; }
}
