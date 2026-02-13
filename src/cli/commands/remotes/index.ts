import { Command } from 'commander';
import { GitRemote, getGitRemotes } from '../../../core/git/remotes.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import { createItemActions } from '../../utils/action-helpers.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { AppError } from '../../utils/exit.js';
import { writeLine } from '../../utils/terminal.js';
import {
  copyRemoteName,
  deleteRemote,
  renameRemote,
  setAsDefault,
  setRemoteUrl,
  showRemoteBranches,
} from './actions/index.js';
import { getRemoteGlobalActions } from './global-actions/index.js';

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
      key: 'delete',
      label: 'Delete',
      description: 'Delete this remote',
      handler: deleteRemote,
    },
  ]);
}

const searchRemotes = async (): Promise<void | CommandResult> => {
  try {
    const remotes = await getGitRemotes();

    if (remotes.length === 0) {
      writeLine(yellow('No remotes found!'));
      return;
    }

    const result = await selectionList<GitRemote>({
      items: remotes,
      renderItem: (remote) => `${remote.name} - ${remote.url}`,
      getSearchText: (remote) => remote.name,
      actions: createRemoteActions(),
      allowBack: true,
    });

    if (result.back) {
      return { back: true };
    }

    if (!result.success) {
      writeLine(yellow('No remote selected.'));
    }
  } catch (error) {
    throw AppError.fromError(error, 'Failed to fetch remotes');
  }
};

/**
 * Register remotes command with the CLI program
 * Uses unified actions - CLI options auto-generated from globalActions
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'remotes',
    description: 'Interactive remote management with actions',
    action: searchRemotes,
    globalActions: getRemoteGlobalActions(),
  });
}
