import { Command } from 'commander';
import { GitTag, getGitTags } from '../../../core/git/tags.js';
import { yellow } from '../../ui/ansi.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { getTagGlobalActions } from './global-actions/index.js';
import { getTagItemActions } from './item-actions/index.js';

const searchTags = async () => {
  try {
    const tags = await getGitTags();

    if (tags.length === 0) {
      writeLine(yellow('No tags found!'));
      process.exit(0);
    }

    try {
      const result = await selectionList<GitTag>({
        items: tags,
        renderItem: (tag) => {
          const hashInfo = tag.hash ? ` (${tag.hash})` : '';
          const subjectInfo = tag.subject ? ` - ${tag.subject}` : '';
          return `${tag.date} - ${tag.name}${hashInfo}${subjectInfo}`;
        },
        getSearchText: (tag) => `${tag.name} ${tag.subject} ${tag.tagger}`,
        actions: getTagItemActions(),
      });

      if (result.success && result.item) {
        writeLine();
        writeLine(`Selected tag: ${result.item.name}`);
        // Action has already been executed by the selection list
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
    commandActions: getTagGlobalActions(),
  });
}
