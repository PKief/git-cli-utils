import { Command } from 'commander';
import {
  FileAuthor,
  getFileAuthors,
  getLastAuthor,
} from '../../../core/git/authors.js';
import { blue, yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { AppError } from '../../utils/exit.js';
import { writeLine } from '../../utils/terminal.js';
import { getAuthorItemActions } from './item-actions/index.js';

const topAuthors = async (filePath?: string): Promise<void | CommandResult> => {
  try {
    const authors = await getFileAuthors(filePath);

    if (authors.length === 0) {
      writeLine(yellow('No authors found!'));
      return;
    }

    // Prepare header with file context if provided
    let header = '';
    if (filePath) {
      try {
        const lastAuthor = await getLastAuthor(filePath);
        if (lastAuthor) {
          header = `${yellow(lastAuthor.name)} ${yellow('edited')} ${blue(filePath)} ${yellow('with commit #' + lastAuthor.commitHash + ' on ' + lastAuthor.date + ' for the last time')}`;
        } else {
          header = yellow(`No commit history found for ${filePath}.`);
        }
      } catch {
        header = yellow(
          `Could not retrieve last author information for ${filePath}.`
        );
      }
    } else {
      header = yellow('Repository-wide author statistics');
    }

    const result = await selectionList<FileAuthor>({
      items: authors,
      renderItem: (author) => {
        const commits = author.commitCount === 1 ? 'commit' : 'commits';
        const lastCommitInfo = author.lastCommitHash
          ? ` | Last: #${author.lastCommitHash} ${author.lastCommitDate}`
          : '';
        return `${author.name} (${author.commitCount} ${commits})${lastCommitInfo}`;
      },
      getSearchText: (author) => author.name,
      header,
      actions: getAuthorItemActions(filePath),
      defaultActionKey: 'details',
      allowBack: true,
    });

    if (result.back) {
      return { back: true };
    }
  } catch (error) {
    throw AppError.fromError(error, 'Failed to fetch authors');
  }
};

/**
 * Register authors command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  const authorsCommand = async (...args: unknown[]) => {
    const file = args[0] as string | undefined;
    return topAuthors(file);
  };

  return createCommand(program, {
    name: 'authors',
    description: 'Show top contributors by commit count',
    action: authorsCommand,
    argument: {
      name: '[file]',
      description: 'Show authors for a specific file',
    },
  });
}
