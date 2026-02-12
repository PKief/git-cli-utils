import { GitExecutor } from '../../../../core/git/executor.js';
import { GitTag } from '../../../../core/git/tags.js';
import { red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Show tag details action
 */
export async function showTagDetails(
  tag: GitTag
): Promise<ActionResult<GitTag>> {
  try {
    const executor = GitExecutor.getInstance();

    // Show tag information
    writeLine(`Tag: ${tag.name}`);
    writeLine(`Date: ${tag.date}`);
    if (tag.hash) {
      writeLine(`Commit: ${tag.hash}`);
    }
    if (tag.subject) {
      writeLine(`Subject: ${tag.subject}`);
    }
    if (tag.tagger) {
      writeLine(`Tagger: ${tag.tagger}`);
    }

    // Show tag message if available
    try {
      const tagMessage = await executor.executeCommand(
        `git tag -n99 ${tag.name}`
      );
      if (tagMessage.stdout.trim() !== tag.name) {
        writeLine(`\nMessage:`);
        writeLine(tagMessage.stdout.replace(tag.name, '').trim());
      }
    } catch {
      // Tag message not available or error occurred
    }

    return actionSuccess(`Tag details shown`);
  } catch (error) {
    const errorMessage = `Show details failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
