import { getGitCommits, GitCommit } from '../core/git/commits.js';
import { interactiveList } from '../core/ui/interactive-list.js';

export const commitSelector = async (): Promise<GitCommit | null> => {
  const commits = await getGitCommits();
  if (commits.length === 0) {
    console.log('No commits found!');
    return null;
  }

  const selectedCommit = await interactiveList<GitCommit>(commits, (commit: GitCommit) => `${commit.date} ${commit.hash} - ${commit.subject}`);
  return selectedCommit;
};