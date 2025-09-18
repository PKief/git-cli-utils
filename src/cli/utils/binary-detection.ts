import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if git-utils binary is available in PATH
 */
export async function isGitUtilsAvailable(): Promise<boolean> {
  try {
    // Try Windows 'where' command first, then Unix 'which'
    await execAsync('where git-utils', { windowsHide: true }).catch(() =>
      execAsync('which git-utils', { windowsHide: true })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the optimal command string for git aliases
 */
export async function getOptimalCommand(subCommand: string): Promise<string> {
  const isAvailable = await isGitUtilsAvailable();

  if (isAvailable) {
    return `!git-utils ${subCommand}`;
  }

  // Fallback to npx
  return `!npx git-cli-utils ${subCommand}`;
}

/**
 * Get performance status message
 */
export async function getPerformanceStatus(): Promise<string> {
  const isAvailable = await isGitUtilsAvailable();

  if (isAvailable) {
    return 'Using global git-utils binary (fast)';
  }

  return 'Using npx (slower startup due to package resolution)';
}
