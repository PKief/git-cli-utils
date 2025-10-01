import { gitExecutor } from './executor.js';

export interface FileAuthor {
  name: string;
  email: string;
  commitCount: number;
  lastCommitHash: string;
  lastCommitDate: string;
}

export interface LastAuthor {
  name: string;
  email: string;
  commitHash: string;
  date: string;
}

/**
 * Get the last author who worked on a specific file
 */
export const getLastAuthor = async (
  filePath: string
): Promise<LastAuthor | null> => {
  try {
    const command = `git log -1 --pretty=format:"%an|%ae|%h|%cd" --date=format:"%d.%m.%Y %H:%M" -- "${filePath}"`;
    const result = await gitExecutor.executeCommand(command);

    if (!result.stdout.trim()) {
      return null;
    }

    const [name, email, commitHash, date] = result.stdout.split('|');
    return {
      name,
      email,
      commitHash,
      date,
    };
  } catch {
    return null;
  }
};

/**
 * Get authors sorted by their commit count on a specific file
 * Optimized version that uses a single git command to get all data at once
 */
export const getFileAuthors = async (
  filePath?: string
): Promise<FileAuthor[]> => {
  try {
    // Use a single git command to get all commit data with author info, hash, and date
    // Format: "author_name|author_email|commit_hash|commit_date"
    let command =
      'git log --pretty=format:"%an|%ae|%h|%cd" --date=format:"%d.%m.%Y %H:%M"';

    if (filePath) {
      command += ` -- "${filePath}"`;
    }

    const result = await gitExecutor.executeCommand(command);
    const lines = result.stdout.split('\n').filter((line) => line.trim());

    // Track authors and their commit info
    const authorData: Map<
      string,
      {
        name: string;
        email: string;
        commits: Array<{ hash: string; date: string }>;
      }
    > = new Map();

    // Process all commits in a single pass
    lines.forEach((line: string) => {
      if (!line.trim()) return;

      const parts = line.split('|');
      if (parts.length !== 4) return;

      const [name, email, hash, date] = parts;
      const key = email.trim(); // Use email as unique key

      if (authorData.has(key)) {
        const existing = authorData.get(key)!;
        existing.commits.push({ hash: hash.trim(), date: date.trim() });
      } else {
        authorData.set(key, {
          name: name.trim(),
          email: key,
          commits: [{ hash: hash.trim(), date: date.trim() }],
        });
      }
    });

    // Convert to FileAuthor format with last commit info
    const authors: FileAuthor[] = Array.from(authorData.values()).map(
      ({ name, email, commits }) => {
        // The first commit in the list is the most recent (git log is in reverse chronological order)
        const lastCommit = commits[0];

        return {
          name,
          email,
          commitCount: commits.length,
          lastCommitHash: lastCommit?.hash || '',
          lastCommitDate: lastCommit?.date || '',
        };
      }
    );

    // Sort by commit count descending
    authors.sort((a, b) => b.commitCount - a.commitCount);
    return authors;
  } catch (error) {
    throw error;
  }
};
