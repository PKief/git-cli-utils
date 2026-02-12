import { Command } from 'commander';
import {
  AuthorTimeline,
  FileAuthor,
  getAuthorTimeline,
  getFileAuthors,
  getLastAuthor,
} from '../../../core/git/authors.js';
import { GitOperations } from '../../../core/git/operations.js';
import { blue, gray, green, red, yellow } from '../../ui/ansi.js';
import { selectionList } from '../../ui/selection-list/index.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';

/**
 * Format and display a simple timeline showing years of activity
 */
const displayTimeline = (timeline: AuthorTimeline) => {
  if (timeline.authorYears.length === 0) {
    writeLine(yellow('No timeline data available.'));
    return;
  }

  const yearsActive = timeline.authorYears.length;
  const totalTimespan =
    timeline.repositoryLastYear - timeline.repositoryFirstYear + 1;

  writeLine();
  writeLine(
    gray(
      `Repository timeline: ${timeline.repositoryFirstYear} - ${timeline.repositoryLastYear}`
    )
  );

  // Create a timeline spanning the entire repository history
  const minYear = timeline.repositoryFirstYear;
  const maxYear = timeline.repositoryLastYear;
  const yearRange = maxYear - minYear;

  if (yearRange === 0) {
    // Repository has only one year of activity
    const hasActivity = timeline.authorYears.includes(minYear);
    const symbol = hasActivity ? green('●') : gray('─');
    writeLine(`${symbol} ${minYear}`);
  } else {
    // Multi-year repository timeline
    let timelineStr = '';

    for (let i = 0; i <= yearRange; i++) {
      const currentYear = minYear + i;
      if (timeline.authorYears.includes(currentYear)) {
        timelineStr += green('●');
      } else {
        timelineStr += gray('─');
      }
    }

    writeLine(`${minYear} ${timelineStr} ${maxYear}`);
    writeLine(
      `Active in ${green(yearsActive.toString())} of ${totalTimespan} years`
    );
  }
};

const topAuthors = async (filePath?: string) => {
  try {
    // Get authors sorted by commit count
    const authors = await getFileAuthors(filePath);

    if (authors.length === 0) {
      writeLine(yellow('No authors found!'));
      process.exit(0);
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

    // Create a scrollable list with persistent header
    try {
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
      });

      if (result.success && result.item) {
        const selectedAuthor = result.item;
        writeLine();
        writeLine(`${selectedAuthor.name} <${selectedAuthor.email}>`);
        writeLine(
          `${selectedAuthor.commitCount} commits | Last: #${selectedAuthor.lastCommitHash} on ${selectedAuthor.lastCommitDate}`
        );

        // Show the timeline
        try {
          const timeline = await getAuthorTimeline(
            selectedAuthor.email,
            filePath
          );
          displayTimeline(timeline);
        } catch {
          // Don't fail the entire command if timeline fails
          writeLine(yellow('Could not generate timeline data.'));
        }

        try {
          const clipboardResult = await GitOperations.copyToClipboard(
            selectedAuthor.name
          );
          writeLine(green(`✓ ${clipboardResult.message}`));
          process.exit(0);
        } catch (error) {
          writeErrorLine(
            red(
              `Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}`
            )
          );
          writeLine(yellow(`Author name: ${selectedAuthor.name}`));
          // In CI/non-interactive environments, don't fail the entire command just because clipboard failed
          const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
          process.exit(isCI ? 0 : 1);
        }
      } else {
        writeLine(yellow('No author selected.'));
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
        `Error fetching authors: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
};

/**
 * Register authors command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  const authorsCommand = async (...args: unknown[]) => {
    const file = args[0] as string | undefined;
    await topAuthors(file);
  };

  return createCommand(program, {
    name: 'authors',
    description:
      'Show top contributors by commit count, optionally for a specific file',
    action: authorsCommand,
    argument: {
      name: '[file]',
      description: 'file path to analyze (optional)',
    },
  });
}
