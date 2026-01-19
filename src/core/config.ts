import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface EditorConfig {
  path: string; // absolute path to editor binary or launcher
  args?: string[]; // optional default args like --new-window
}

export type WorktreeMode = 'plain' | 'selective';

export interface WorktreeSymlinkConfig {
  mode: WorktreeMode; // 'plain' = no symlinks, 'selective' = prompt with default patterns
  defaultPatterns: string[]; // patterns to pre-select in selective mode, e.g., ['node_modules', '.env', '.env.*']
}

export interface GitCliUtilsConfig {
  editor?: EditorConfig;
  worktreeSymlinks?: WorktreeSymlinkConfig;
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

const DEFAULT_SYMLINK_PATTERNS = ['node_modules', '.env', '.env.*'];

export function getWorktreeSymlinkConfig(): WorktreeSymlinkConfig {
  const cfg = loadConfig();

  if (!cfg.worktreeSymlinks) {
    return {
      mode: 'selective',
      defaultPatterns: DEFAULT_SYMLINK_PATTERNS,
    };
  }

  // Handle backward compatibility: convert old 'enabled' field to new 'mode' field
  // Use a loose type to handle legacy config format
  const config = cfg.worktreeSymlinks as {
    mode?: WorktreeMode;
    enabled?: boolean;
    defaultPatterns?: string[];
  };

  // Legacy format had 'enabled' boolean instead of 'mode'
  if (config.enabled !== undefined && config.mode === undefined) {
    return {
      mode: config.enabled ? 'selective' : 'plain',
      defaultPatterns: config.defaultPatterns ?? DEFAULT_SYMLINK_PATTERNS,
    };
  }

  return {
    mode: config.mode ?? 'selective',
    defaultPatterns: config.defaultPatterns ?? DEFAULT_SYMLINK_PATTERNS,
  };
}

export function setWorktreeSymlinkConfig(
  config: WorktreeSymlinkConfig
): WorktreeSymlinkConfig {
  updateConfig({ worktreeSymlinks: config });
  return config;
}

export function getDefaultSymlinkPatterns(): string[] {
  return DEFAULT_SYMLINK_PATTERNS;
}
