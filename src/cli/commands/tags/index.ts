import { Command } from 'commander';
import { GitTag, getGitTags } from '../../../core/git/tags.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import { createActions } from '../../utils/action-helpers.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import {
  changeTagCommit,
  checkoutTag,
  copyTagName,
  deleteTag,
  showTagDetails,
} from './actions/index.js';

/**
 * Creates actions available for tag items
 */
function createTagActions() {
  return createActions([
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy tag name to clipboard',
      handler: copyTagName,
    },
    {
      key: 'show',
      label: 'Details',
      description: 'Show tag details',
      handler: showTagDetails,
    },
    {
      key: 'checkout',
      label: 'Checkout',
      description: 'Checkout tag',
      handler: checkoutTag,
    },
    {
      key: 'change',
      label: 'Change commit',
      description: 'Change tag to point to a different commit',
      handler: changeTagCommit,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete tag (locally and optionally from remotes)',
      handler: deleteTag,
    },
  ]);
}

const searchTags = async () => {
  try {
    const tags = await getGitTags();

    if (tags.length === 0) {
      writeLine(yellow('No tags found!'));
      process.exit(0);
    }

    try {
      const selectedTag = await interactiveList<GitTag>(
        tags,
        (tag: GitTag) => {
          const hashInfo = tag.hash ? ` (${tag.hash})` : '';
          const subjectInfo = tag.subject ? ` - ${tag.subject}` : '';
          return `${tag.date} - ${tag.name}${hashInfo}${subjectInfo}`;
        },
        (tag: GitTag) => `${tag.name} ${tag.subject} ${tag.tagger}`, // Search name, subject, and tagger
        undefined, // No header
        createTagActions() // Actions
      );

      if (selectedTag) {
        writeLine();
        writeLine(`Selected tag: ${selectedTag.name}`);
        // Action has already been executed by the interactive list
        process.exit(0);
      } else {
        writeLine(yellow('No tag selected.'));
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
      `Error fetching tags: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

/**
 * Register tags command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'tags',
    description: 'Interactive tag selection with fuzzy search',
    action: searchTags,
  });
}
