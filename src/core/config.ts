import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface EditorConfig {
  path: string; // absolute path to editor binary or launcher
  args?: string[]; // optional default args like --new-window
}

export interface GitCliUtilsConfig {
  editor?: EditorConfig;
}

const CONFIG_DIR = join(homedir(), '.git-cli-utils');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): GitCliUtilsConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return {};
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    if (!raw.trim()) return {};
    return JSON.parse(raw) as GitCliUtilsConfig;
  } catch {
    // Corrupt or unreadable config -> return empty
    return {};
  }
}

export function saveConfig(cfg: GitCliUtilsConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

export function updateConfig(
  patch: Partial<GitCliUtilsConfig>
): GitCliUtilsConfig {
  const current = loadConfig();
  const next = { ...current, ...patch };
  saveConfig(next);
  return next;
}

export function getEditorConfig(): EditorConfig | undefined {
  const cfg = loadConfig();
  return cfg.editor;
}

export function setEditorConfig(editor: EditorConfig): EditorConfig {
  updateConfig({ editor });
  return editor;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
