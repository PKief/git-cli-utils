import { Command } from 'commander';
import { type GitAlias, getGitAliases } from '../../../core/git/aliases.js';
import { green, red, yellow } from '../../ui/ansi.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeLine } from '../../utils/terminal.js';

const listAliases = async (): Promise<void> => {
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

    try {
      // Use action-based selection list so user can choose execute / copy / new
      const { getAliasActions } = await import('./actions/index.js');
      const actions = getAliasActions();

      const result = await selectionList<GitAlias>({
        items: aliases,
        renderItem: (alias) =>
          `git ${alias.name.padEnd(12)} → ${alias.command}`,
        getSearchText: (alias) => `${alias.name} ${alias.command}`,
        actions,
      });

      if (result.success) {
        // action handlers already perform work and print output. Exit cleanly.
        process.exit(0);
      } else {
        writeLine(yellow('No alias selected.'));
        process.exit(0);
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine();
        writeLine(yellow('Selection cancelled.'));
        process.exit(0);
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    writeLine(
      red(
        `Error fetching git aliases: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    writeLine('Run "git-utils init" to create some!');
    process.exit(1);
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
