import { spawn } from 'child_process';

export interface GitCommit {
  hash: string;
  date: string;
  branch: string;
  subject: string;
}

export const getGitCommits = (): Promise<GitCommit[]> => {
  return new Promise((resolve, reject) => {
    const git = spawn('git', [
      'log',
      '--all',
      '--date=short',
      '--pretty=format:%h|%cd|%D|%s',
    ]);

    const commits: GitCommit[] = [];
    let buffer = '';

    git.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line

      lines.forEach((line) => {
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
    });

    git.stdout.on('end', () => {
      resolve(commits);
    });

    git.on('error', (error: Error) => {
      reject(error);
    });
  });
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
