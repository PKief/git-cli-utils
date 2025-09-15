import { getGitCommits, GitCommit } from '../../core/git/commits.js';
import { interactiveList } from '../../core/ui/interactive-list.js';
import { GitOperations } from '../../core/git/operations.js';
import ANSI from '../../core/ui/ansi.js';

export const searchCommits = async () => {
  try {
    const commits = await getGitCommits();

    if (commits.length === 0) {
      console.log(`${ANSI.YELLOW}No commits found!${ANSI.RESET}`);
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
          `${ANSI.GREEN}Commit SHA copied to clipboard!${ANSI.RESET}`
        );
        process.exit(0);
      } catch (error) {
        console.error(
          `${ANSI.RED}Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}${ANSI.RESET}`
        );
        console.log(
          `${ANSI.YELLOW}Commit SHA: ${selectedCommit.hash}${ANSI.RESET}`
        );
        process.exit(1);
      }
    } else {
      console.log(`${ANSI.YELLOW}No commit selected.${ANSI.RESET}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(
      `${ANSI.RED}Error fetching commits: ${error instanceof Error ? error.message : String(error)}${ANSI.RESET}`
    );
    process.exit(1);
  }
};
