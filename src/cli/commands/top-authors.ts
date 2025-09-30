import {
  FileAuthor,
  getFileAuthors,
  getLastAuthor,
} from '../../core/git/authors.js';
import { GitOperations } from '../../core/git/operations.js';
import { blue, green, red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';
import { writeErrorLine, writeLine } from '../utils/terminal.js';

export const topAuthors = async (filePath?: string) => {
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
      const selectedAuthor = await interactiveList<FileAuthor>(
        authors,
        (author: FileAuthor) => {
          const commits = author.commitCount === 1 ? 'commit' : 'commits';
          const lastCommitInfo = author.lastCommitHash
            ? ` | Last: #${author.lastCommitHash} ${author.lastCommitDate}`
            : '';
          return `${author.name} (${author.commitCount} ${commits})${lastCommitInfo}`;
        },
        (author: FileAuthor) => author.name, // Search by author name only
        header // Pass the header to stay visible during selection
      );

      if (selectedAuthor) {
        writeLine();
        writeLine(
          `Selected author: ${selectedAuthor.name} <${selectedAuthor.email}>`
        );
        writeLine(`Total commits: ${selectedAuthor.commitCount}`);

        if (selectedAuthor.lastCommitHash) {
          writeLine(
            `Last commit: #${selectedAuthor.lastCommitHash} on ${selectedAuthor.lastCommitDate}`
          );
        }

        try {
          await GitOperations.copyToClipboard(selectedAuthor.name);
          writeLine(green('Author name copied to clipboard!'));
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
