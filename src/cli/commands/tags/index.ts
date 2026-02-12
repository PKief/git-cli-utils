import { Command } from 'commander';
import { GitTag, getGitTags } from '../../../core/git/tags.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { AppError } from '../../utils/exit.js';
import { writeLine } from '../../utils/terminal.js';
import { getTagGlobalActions } from './global-actions/index.js';
import { getTagItemActions } from './item-actions/index.js';

const searchTags = async (): Promise<void | CommandResult> => {
  try {
    const tags = await getGitTags();

    if (tags.length === 0) {
      writeLine(yellow('No tags found!'));
      return;
    }

    const result = await selectionList<GitTag>({
      items: tags,
      renderItem: (tag) => {
        const hashInfo = tag.hash ? ` (${tag.hash})` : '';
        const subjectInfo = tag.subject ? ` - ${tag.subject}` : '';
        return `${tag.date} - ${tag.name}${hashInfo}${subjectInfo}`;
      },
      getSearchText: (tag) => `${tag.name} ${tag.subject} ${tag.tagger}`,
      actions: getTagItemActions(),
      allowBack: true,
    });

    if (result.back) {
      return { back: true };
    }

    if (result.success && result.item) {
      writeLine();
      writeLine(`Selected tag: ${result.item.name}`);
    } else {
      writeLine(yellow('No tag selected.'));
    }
  } catch (error) {
    throw AppError.fromError(error, 'Failed to fetch tags');
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
