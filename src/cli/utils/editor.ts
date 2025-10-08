import { spawn } from 'node:child_process';
import { existsSync, lstatSync, statSync } from 'node:fs';
import { normalize, resolve } from 'node:path';
import {
  type EditorConfig,
  getEditorConfig,
  setEditorConfig,
} from '../../core/config.js';
import { writeErrorLine, writeLine } from './terminal.js';

export function configureEditor(path: string, args?: string[]): EditorConfig {
  // Remove quotes if they were included in the path
  const cleanPath = path.replace(/^["']|["']$/g, '');

  // Normalize and resolve the path in an OS-native way
  const normalizedPath = normalize(cleanPath);
  const abs = resolve(normalizedPath);

  try {
    const st = statSync(abs);
    if (!st.isFile() && !st.isSymbolicLink()) {
      writeErrorLine(`Editor path is not a file: ${abs}`);
    }
  } catch {
    writeErrorLine(`Warning: editor path does not exist yet: ${abs}`);
  }

  const cfg = setEditorConfig({ path: abs, args });
  writeLine(
    `Editor configured: ${abs}${args?.length ? ' ' + args.join(' ') : ''}`
  );
  return cfg;
}

export function showEditorConfig(): void {
  const cfg = getEditorConfig();
  if (!cfg) {
    writeLine(
      'No editor configured. Use: git-utils config editor set <path> [--args "--new-window"]'
    );
    return;
  }
  writeLine(`Current editor: ${cfg.path}`);
  if (cfg.args?.length) writeLine(`Args: ${cfg.args.join(' ')}`);
}

export interface OpenEditorOptions {
  wait?: boolean; // future use
  extraArgs?: string[];
  silent?: boolean;
}

export function openInConfiguredEditor(
  targetPath: string,
  options: OpenEditorOptions = {}
): boolean {
  const cfg = getEditorConfig();
  if (!cfg) {
    if (!options.silent) {
      writeLine(
        'No editor configured. Set one with: git-utils config editor set <path>'
      );
    }
    return false;
  }
  // Robust existence & file validation (existsSync + lstatSync)
  if (!existsSync(cfg.path)) {
    if (!options.silent) writeErrorLine(`Editor binary not found: ${cfg.path}`);
    return false;
  }
  try {
    const st = lstatSync(cfg.path);
    if (!st.isFile() && !st.isSymbolicLink()) {
      if (!options.silent)
        writeErrorLine(`Editor path is not a file: ${cfg.path}`);
      return false;
    }
  } catch {
    if (!options.silent)
      writeErrorLine(`Editor binary not accessible: ${cfg.path}`);
    return false;
  }
  try {
    const args = [
      ...(cfg.args || []),
      ...(options.extraArgs || []),
      targetPath,
    ];
    const child = spawn(cfg.path, args, {
      detached: true,
      stdio: 'ignore',
    });
    child.on('error', () => {
      /* swallow */
    });
    child.unref();
    if (!options.silent) writeLine(`Opened in editor: ${targetPath}`);
    return true;
  } catch (error) {
    if (!options.silent) {
      writeErrorLine(
        `Failed to open editor: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return false;
  }
}
