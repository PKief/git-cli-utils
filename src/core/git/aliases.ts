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
