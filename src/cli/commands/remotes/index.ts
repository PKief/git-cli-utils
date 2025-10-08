import { GitRemote, getGitRemotes } from '../../../core/git/index.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import { createActions } from '../../utils/action-helpers.js';
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
  return createActions([
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
  return createActions([
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

export const searchRemotes = async () => {
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
      const selectedRemote = await interactiveList<GitRemote>(
        remotes,
        (remote: GitRemote) => `${remote.name} - ${remote.url}`,
        (remote: GitRemote) => remote.name,
        undefined, // No header
        hasRemotes ? createRemoteActions() : createAddOnlyActions() // Show only "Add remote" when no remotes exist
      );

      if (selectedRemote) {
        // Action has already been executed by the interactive list
        // and provided its own success message
        process.exit(0);
      } else {
        writeLine(yellow('No remote selected.'));
        process.exit(0);
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Selection cancelled.'));
        process.exit(0);
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
