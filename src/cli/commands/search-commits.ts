import { GitCommit, getGitCommits } from '../../core/git/commits.js';
import { GitOperations } from '../../core/git/operations.js';
import { green, red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';
import { writeErrorLine, writeLine } from '../utils/terminal.js';

export const searchCommits = async () => {
  try {
    const commits = await getGitCommits();

    if (commits.length === 0) {
      writeLine(yellow('No commits found!'));
      process.exit(0);
    }

    try {
      const selectedCommit = await interactiveList<GitCommit>(
        commits,
        (commit: GitCommit) =>
          `${commit.date} ${commit.hash} - ${commit.subject}`,
        (commit: GitCommit) => `${commit.hash} - ${commit.subject}` // Match the format in display text
      );

      if (selectedCommit) {
        writeLine();
        writeLine(`Selected commit: ${selectedCommit.hash}`);
        writeLine(`Subject: ${selectedCommit.subject}`);

        try {
          await GitOperations.copyToClipboard(selectedCommit.hash);
          writeLine(green('Commit SHA copied to clipboard!'));
          process.exit(0);
        } catch (error) {
          writeErrorLine(
            red(
              `Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}`
            )
          );
          writeLine(yellow(`Commit SHA: ${selectedCommit.hash}`));
          // In CI/non-interactive environments, don't fail the entire command just because clipboard failed
          const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
          process.exit(isCI ? 0 : 1);
        }
      } else {
        writeLine(yellow('No commit selected.'));
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
        `Error fetching commits: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
};
