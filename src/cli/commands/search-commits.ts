import { GitCommit, getGitCommits } from '../../core/git/commits.js';
import { GitOperations } from '../../core/git/operations.js';
import { green, red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';

export const searchCommits = async () => {
  try {
    const commits = await getGitCommits();

    if (commits.length === 0) {
      console.log(yellow('No commits found!'));
      process.exit(0);
    }

    const selectedCommit = await interactiveList<GitCommit>(
      commits,
      (commit: GitCommit) =>
        `${commit.date} ${commit.hash} - ${commit.subject}`,
      (commit: GitCommit) => `${commit.hash} - ${commit.subject}` // Match the format in display text
    );

    if (selectedCommit) {
      console.log(`\nSelected commit: ${selectedCommit.hash}`);
      console.log(`Subject: ${selectedCommit.subject}`);

      try {
        await GitOperations.copyToClipboard(selectedCommit.hash);
        console.log(green('Commit SHA copied to clipboard!'));
        process.exit(0);
      } catch (error) {
        console.error(
          red(
            `Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        console.log(yellow(`Commit SHA: ${selectedCommit.hash}`));
        // In CI/non-interactive environments, don't fail the entire command just because clipboard failed
        const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
        process.exit(isCI ? 0 : 1);
      }
    } else {
      console.log(yellow('No commit selected.'));
      process.exit(0);
    }
  } catch (error) {
    console.error(
      red(
        `Error fetching commits: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
};
