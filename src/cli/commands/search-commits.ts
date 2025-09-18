import { GitCommit, getGitCommits } from '../../core/git/commits.js';
import { GitOperations } from '../../core/git/operations.js';
import ANSI from '../../core/ui/ansi.js';
import { interactiveList } from '../../core/ui/interactive-list.js';

export const searchCommits = async () => {
  try {
    const commits = await getGitCommits();

    if (commits.length === 0) {
      console.log(`${ANSI.yellow}No commits found!${ANSI.reset}`);
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
        console.log(
          `${ANSI.green}Commit SHA copied to clipboard!${ANSI.reset}`
        );
        process.exit(0);
      } catch (error) {
        console.error(
          `${ANSI.red}Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}${ANSI.reset}`
        );
        console.log(
          `${ANSI.yellow}Commit SHA: ${selectedCommit.hash}${ANSI.reset}`
        );
        // In CI/non-interactive environments, don't fail the entire command just because clipboard failed
        const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
        process.exit(isCI ? 0 : 1);
      }
    } else {
      console.log(`${ANSI.yellow}No commit selected.${ANSI.reset}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(
      `${ANSI.red}Error fetching commits: ${error instanceof Error ? error.message : String(error)}${ANSI.reset}`
    );
    process.exit(1);
  }
};
