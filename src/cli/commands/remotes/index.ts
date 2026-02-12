import { Command } from 'commander';
import { GitRemote, getGitRemotes } from '../../../core/git/remotes.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import { createItemActions } from '../../utils/action-helpers.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import {
  addRemote,
  copyRemoteName,
  deleteRemote,
  renameRemote,
  setAsDefault,
  setRemoteUrl,
  showRemoteBranches,
} from './actions/index.js';

/**
 * Creates actions available for remote items
 */
function createRemoteActions() {
  return createItemActions([
    {
      key: 'branches',
      label: 'Show branches',
      description: 'Show branches from this remote',
      handler: showRemoteBranches,
    },
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy remote name to clipboard',
      handler: copyRemoteName,
    },
    {
      key: 'set-default',
      label: 'Set as default',
      description: 'Set as upstream for current branch',
      handler: setAsDefault,
    },
    {
      key: 'rename',
      label: 'Rename',
      description: 'Rename this remote',
      handler: renameRemote,
    },
    {
      key: 'set-url',
      label: 'Set URL',
      description: 'Change the URL of this remote',
      handler: setRemoteUrl,
    },
    {
      key: 'add',
      label: 'Add remote',
      description: 'Add a new remote repository',
      handler: async () => {
        return await addRemote();
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete this remote',
      handler: deleteRemote,
    },
  ]);
}

/**
 * Creates actions available when no remotes exist
 */
function createAddOnlyActions() {
  return createItemActions([
    {
      key: 'add',
      label: 'Add remote',
      description: 'Add a new remote repository',
      handler: async () => {
        return await addRemote();
      },
    },
  ]);
}

const searchRemotes = async (): Promise<void | CommandResult> => {
  try {
    const remotes = await getGitRemotes();
    const hasRemotes = remotes.length > 0;

    if (!hasRemotes) {
      writeLine(
        yellow(
          'No remotes found! Use the "Add remote" action to add your first remote.'
        )
      );
      // Create a dummy remote for the add action
      const dummyRemote: GitRemote = {
        name: 'No remotes available',
        url: 'Use "Add remote" action to create one',
        type: 'fetch',
      };
      remotes.push(dummyRemote);
    }

    try {
      const result = await selectionList<GitRemote>({
        items: remotes,
        renderItem: (remote) => `${remote.name} - ${remote.url}`,
        getSearchText: (remote) => remote.name,
        actions: hasRemotes ? createRemoteActions() : createAddOnlyActions(),
        allowBack: true,
      });

      if (result.back) {
        return { back: true };
      }

      if (!result.success) {
        writeLine(yellow('No remote selected.'));
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Selection cancelled.'));
        return;
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    writeErrorLine(
      `Error fetching remotes: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

/**
 * Register remotes command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'remotes',
    description: 'Interactive remote management with actions',
    action: searchRemotes,
  });
}
