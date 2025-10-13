import { gitExecutor } from './executor.js';

export interface GitAlias {
  name: string;
  command: string;
}

/**
 * Get all git aliases from global configuration
 */
export const getGitAliases = async (): Promise<GitAlias[]> => {
  try {
    const result = await gitExecutor.executeCommand(
      'git config --global --get-regexp alias'
    );

    if (!result.stdout.trim()) {
      return [];
    }

    const aliases: GitAlias[] = [];
    result.stdout
      .trim()
      .split('\n')
      .forEach((line) => {
        const [aliasKey, ...commandParts] = line.split(' ');
        const aliasName = aliasKey.replace('alias.', '');
        const command = commandParts.join(' ');

        aliases.push({
          name: aliasName,
          command: command,
        });
      });

    return aliases;
  } catch (_error) {
    // Return empty array if no aliases found or error occurs
    return [];
  }
};

/**
 * Set a git alias in the global config
 */
export const setGitAlias = async (
  name: string,
  command: string
): Promise<void> => {
  // Escape double-quotes so the shell command is valid
  const escaped = command.replace(/"/g, '\\"');
  await gitExecutor.executeCommand(
    `git config --global alias.${name} "${escaped}"`
  );
};

/**
 * Delete a git alias from the global config
 */
export const deleteGitAlias = async (name: string): Promise<void> => {
  await gitExecutor.executeCommand(`git config --global --unset alias.${name}`);
};

/**
 * Check if a git alias name already exists
 */
export const aliasExists = async (name: string): Promise<boolean> => {
  const aliases = await getGitAliases();
  return aliases.some((a) => a.name === name);
};
