import {
  FileAuthor,
  getFileAuthors,
  getLastAuthor,
} from '../../core/git/authors.js';
import { GitOperations } from '../../core/git/operations.js';
import { green, red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';

export const topAuthors = async (filePath?: string) => {
  try {
    // If a file path is provided, show last author info first
    if (filePath) {
      console.log(`📁 File: ${filePath}\n`);

      try {
        const lastAuthor = await getLastAuthor(filePath);
        if (lastAuthor) {
          console.log(yellow('Last person worked on this file:'));
          console.log(
            `${lastAuthor.name} #${lastAuthor.commitHash} ${lastAuthor.date}\n`
          );
        } else {
          console.log(yellow('No commit history found for this file.\n'));
        }
      } catch {
        console.log(yellow('Could not retrieve last author information.\n'));
      }
    } else {
      console.log(yellow('📊 Repository-wide author statistics\n'));
    }

    // Get authors sorted by commit count
    const authors = await getFileAuthors(filePath);

    if (authors.length === 0) {
      console.log(yellow('No authors found!'));
      process.exit(0);
    }

    // Create a scrollable list
    const selectedAuthor = await interactiveList<FileAuthor>(
      authors,
      (author: FileAuthor) => {
        const commits = author.commitCount === 1 ? 'commit' : 'commits';
        const lastCommitInfo = author.lastCommitHash
          ? ` | Last: #${author.lastCommitHash} ${author.lastCommitDate}`
          : '';
        return `${author.name} (${author.commitCount} ${commits})${lastCommitInfo}`;
      },
      (author: FileAuthor) => author.name // Search by author name only
    );

    if (selectedAuthor) {
      console.log(
        `\n📧 Selected author: ${selectedAuthor.name} <${selectedAuthor.email}>`
      );
      console.log(`📈 Total commits: ${selectedAuthor.commitCount}`);

      if (selectedAuthor.lastCommitHash) {
        console.log(
          `🕒 Last commit: #${selectedAuthor.lastCommitHash} on ${selectedAuthor.lastCommitDate}`
        );
      }

      try {
        await GitOperations.copyToClipboard(selectedAuthor.name);
        console.log(green('Author name copied to clipboard!'));
        process.exit(0);
      } catch (error) {
        console.error(
          red(
            `Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        console.log(yellow(`Author name: ${selectedAuthor.name}`));
        // In CI/non-interactive environments, don't fail the entire command just because clipboard failed
        const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
        process.exit(isCI ? 0 : 1);
      }
    } else {
      console.log(yellow('No author selected.'));
      process.exit(0);
    }
  } catch (error) {
    console.error(
      red(
        `Error fetching authors: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
};
