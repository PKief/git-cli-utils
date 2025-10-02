import { GitStash, getGitStashes } from '../../../core/git/stashes.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import { createActions } from '../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import {
  applyStash,
  copyStashReference,
  createBranchFromStash,
  deleteStash,
  showStashDetails,
} from './actions/index.js';

/**
 * Creates actions available for stash items
 */
function createStashActions() {
  return createActions([
    {
      key: 'show',
      label: 'Show',
      description: 'View stash diff',
      handler: showStashDetails,
    },
    {
      key: 'apply',
      label: 'Apply',
      description: 'Apply to working directory',
      handler: applyStash,
    },
    {
      key: 'branch',
      label: 'Create Branch',
      description: 'Create branch from stash',
      handler: createBranchFromStash,
    },
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy to clipboard',
      handler: copyStashReference,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete stash permanently',
      handler: deleteStash,
    },
  ]);
}

export const searchStashes = async () => {
  try {
    const stashes = await getGitStashes();

    if (stashes.length === 0) {
      writeLine(yellow('No stashes found!'));
      process.exit(0);
    }

    try {
      const selectedStash = await interactiveList<GitStash>(
        stashes,
        (stash: GitStash) =>
          `stash@{${stash.index}} on ${stash.branch}: ${stash.message}`,
        (stash: GitStash) => stash.message, // Search stash messages
        undefined, // No header
        createStashActions() // Actions
      );

      if (selectedStash) {
        writeLine();
        writeLine(`Selected stash: stash@{${selectedStash.index}}`);
        // Action has already been executed by the interactive list
        process.exit(0);
      } else {
        writeLine(yellow('No stash selected.'));
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
      `Error fetching stashes: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};
