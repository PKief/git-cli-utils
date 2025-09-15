import { getGitBranches, GitBranch } from '../git/branches.js';
import { getGitCommits, GitCommit } from '../git/commits.js';

export const searchBranches = async (searchTerm: string): Promise<GitBranch[]> => {
  const branches = await getGitBranches();
  return branches.filter(branch => branch.name.includes(searchTerm));
};

export const searchCommits = async (searchTerm: string): Promise<GitCommit[]> => {
  const commits = await getGitCommits();
  return commits.filter(commit => commit.subject.includes(searchTerm));
};