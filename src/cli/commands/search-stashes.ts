import { GitOperations } from '../../core/git/operations.js';
import { GitStash, getGitStashes } from '../../core/git/stashes.js';
import { red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';
import { writeErrorLine, writeLine } from '../utils/terminal.js';

export const searchStashes = async () => {
  try {
    // Get all stashes
    const stashes = await getGitStashes();

    if (stashes.length === 0) {
      writeLine(yellow('No stashes found!'));
      process.exit(0);
    }

    // Create a scrollable list of stashes
    try {
      const selectedStash = await interactiveList<GitStash>(
        stashes,
        (stash: GitStash) => {
          // Restructure: put searchable content first, date last (separated)
          return `stash@{${stash.index}} ${stash.branch} | ${stash.hash} | ${stash.message} | ${stash.date}`;
        },
        (stash: GitStash) => {
          // Search function matches the first part of display (everything except date)
          return `stash@{${stash.index}} ${stash.branch} | ${stash.hash} | ${stash.message}`;
        },
        yellow('Available stashes') // Header
      );

      if (selectedStash) {
        writeLine();
        writeLine(`Selected stash: stash@{${selectedStash.index}}`);
        writeLine(`Branch: ${selectedStash.branch}`);
        writeLine(`Message: ${selectedStash.message}`);

        try {
          await GitOperations.copyToClipboard(`stash@{${selectedStash.index}}`);
          process.exit(0);
        } catch (error) {
          writeErrorLine(
            red(
              `Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}`
            )
          );
          writeLine(yellow(`Stash reference: stash@{${selectedStash.index}}`));
          // In CI/non-interactive environments, don't fail the entire command just because clipboard failed
          const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
          process.exit(isCI ? 0 : 1);
        }
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
      red(
        `Error fetching stashes: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
};
