import { fuzzyFilter, getErrorMessage } from '../utils.js';
import { gitExecutor } from './executor.js';

export interface GitCommit {
  hash: string;
  date: string;
  branch: string;
  subject: string;
  tags: string[];
}

export const getGitCommits = async (
  filePath?: string,
  showAllBranches = false,
  branch?: string
): Promise<GitCommit[]> => {
  try {
    const args = ['log'];

    // Add --all flag if requested
    if (showAllBranches) {
      args.push('--all');
    }

    // Add branch filter if specified (only when not showing all branches)
    if (branch && !showAllBranches) {
      args.push(branch);
    }

    args.push('--date=relative', '--pretty=format:%h|%cd|%D|%s');

    // Add file path filter if provided
    if (filePath) {
      args.push('--', filePath);
    }

    const result = await gitExecutor.executeStreamingCommand(args);

    const commits: GitCommit[] = [];

    result.data.forEach((line) => {
      if (!line.trim()) return;
      const [hash, date, refs, subject] = line.split('|');

      const refList = refs
        ? refs
            .split(',')
            .map((r) => r.trim())
            .filter((r) => r)
        : [];

      const branches = refList.filter(
        (r) => !r.startsWith('tag:') && !r.startsWith('HEAD')
      );

      const tags = refList
        .filter((r) => r.startsWith('tag:'))
        .map((r) => r.replace(/^tag:\s*/, ''));

      commits.push({
        hash,
        date,
        branch: branches.join(', '),
        subject,
        tags,
      });
    });

    return commits;
  } catch (error) {
    throw new Error(`Error executing git command: ${getErrorMessage(error)}`);
  }
};

export const getReflogCommits = async (): Promise<GitCommit[]> => {
  try {
    const args = [
      'reflog',
      '--date=relative',
      '--pretty=format:%h|%cd|%gd|%gs',
    ];

    const result = await gitExecutor.executeStreamingCommand(args);

    const commits: GitCommit[] = [];

    result.data.forEach((line) => {
      if (!line.trim()) return;
      const [hash, date, selector, description] = line.split('|');

      commits.push({
        hash,
        date,
        branch: selector ?? '',
        subject: description ?? '',
        tags: [],
      });
    });

    return commits;
  } catch (error) {
    throw new Error(`Error executing git command: ${getErrorMessage(error)}`);
  }
};

export const filterCommits = (
  commits: GitCommit[],
  searchTerm: string
): GitCommit[] => {
  return fuzzyFilter(
    commits,
    searchTerm,
    (c) => `${c.hash} ${c.date} ${c.branch} ${c.subject} ${c.tags.join(' ')}`
  );
};
