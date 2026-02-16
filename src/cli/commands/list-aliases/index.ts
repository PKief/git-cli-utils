import { Command } from 'commander';
import { type GitAlias, getGitAliases } from '../../../core/git/aliases.js';
import { green, yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { AppError } from '../../utils/exit.js';
import { writeLine } from '../../utils/terminal.js';
import { getAliasActions } from './actions/index.js';

const listAliases = async (): Promise<void | CommandResult> => {
  try {
    const aliases = await getGitAliases();

    if (aliases.length === 0) {
      writeLine(yellow('No git aliases found.'));
      writeLine('Run "git-utils init" to create some!');
      return;
    }

    writeLine(green('Git Aliases'));
    writeLine('Select an alias to execute:');
    writeLine();

    // Use action-based selection list so user can choose execute / copy / new
    const actions = getAliasActions();

    const result = await selectionList<GitAlias>({
      items: aliases,
      renderItem: (alias) => `git ${alias.name.padEnd(12)} → ${alias.command}`,
      getSearchText: (alias) => `${alias.name} ${alias.command}`,
      actions,
      allowBack: true,
    });

    if (result.back) {
      return { back: true };
    }

    if (!result.success) {
      writeLine(yellow('No alias selected.'));
    }
  } catch (error) {
    throw AppError.fromError(error, 'Failed to fetch aliases');
  }
};

/**
 * Register aliases command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'aliases',
    description: 'Show current git aliases',
    action: listAliases,
  });
}
