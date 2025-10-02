import { gitExecutor } from './executor.js';

export interface GitCommit {
  hash: string;
  date: string;
  branch: string;
  subject: string;
}

export const getGitCommits = async (): Promise<GitCommit[]> => {
  try {
    const command =
      'git log --all --date=relative --pretty=format:%h|%cd|%D|%s';
    const result = await gitExecutor.executeStreamingCommand(command);

    const commits: GitCommit[] = [];

    result.data.forEach((line) => {
      if (!line.trim()) return;
      const [hash, date, refs, subject] = line.split('|');
      const branches = refs
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r && !r.startsWith('tag:') && !r.startsWith('HEAD'));

      commits.push({
        hash,
        date,
        branch: branches.join(', '),
        subject,
      });
    });

    return commits;
  } catch (error) {
    throw new Error(
      `Error executing git command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const filterCommits = (
  commits: GitCommit[],
  searchTerm: string
): GitCommit[] => {
  if (!searchTerm) return commits;

  const normalizedSearchTerm = searchTerm.toLowerCase();

  return commits.filter((c) => {
    const searchableText =
      `${c.hash} ${c.date} ${c.branch} ${c.subject}`.toLowerCase();

    if (searchableText.includes(normalizedSearchTerm)) {
      return true;
    }

    const textNoSeparators = searchableText.replace(/[-_\/\.\s]/g, '');
    const searchTermNoSeparators = normalizedSearchTerm.replace(
      /[-_\/\.\s]/g,
      ''
    );

    if (textNoSeparators.includes(searchTermNoSeparators)) {
      return true;
    }

    let searchIndex = 0;
    for (
      let i = 0;
      i < textNoSeparators.length &&
      searchIndex < searchTermNoSeparators.length;
      i++
    ) {
      if (textNoSeparators[i] === searchTermNoSeparators[searchIndex]) {
        searchIndex++;
      }
    }

    return searchIndex === searchTermNoSeparators.length;
  });
};
