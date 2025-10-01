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

export interface AuthorTimeline {
  authorYears: number[];
  totalCommits: number;
  firstCommitYear: number;
  lastCommitYear: number;
  repositoryFirstYear: number;
  repositoryLastYear: number;
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

/**
 * Get repository timeline bounds (first commit to today)
 */
const getRepositoryTimeline = async (
  filePath?: string
): Promise<{ firstYear: number; lastYear: number }> => {
  try {
    // Get the very first commit year in the repository (or file)
    let firstCommitCommand =
      'git log --reverse --pretty=format:"%cd" --date=format:"%Y" | head -1';
    if (filePath) {
      firstCommitCommand = `git log --reverse --pretty=format:"%cd" --date=format:"%Y" -- "${filePath}" | head -1`;
    }

    const firstResult = await gitExecutor.executeCommand(firstCommitCommand);
    const firstYear =
      Number.parseInt(firstResult.stdout.trim()) || new Date().getFullYear();

    // Last year is always current year (today)
    const currentYear = new Date().getFullYear();

    return {
      firstYear,
      lastYear: currentYear,
    };
  } catch {
    const currentYear = new Date().getFullYear();
    return {
      firstYear: currentYear,
      lastYear: currentYear,
    };
  }
};

/**
 * Get a timeline showing when an author was active within the full repository timeline
 */
export const getAuthorTimeline = async (
  authorEmail: string,
  filePath?: string
): Promise<AuthorTimeline> => {
  try {
    // Get repository timeline bounds
    const repoTimeline = await getRepositoryTimeline(filePath);

    // Get all commits by this author with just the year
    let command = `git log --pretty=format:"%cd" --date=format:"%Y" --author="${authorEmail}"`;

    if (filePath) {
      command += ` -- "${filePath}"`;
    }

    const result = await gitExecutor.executeCommand(command);
    const years = result.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((year) => Number.parseInt(year.trim()))
      .filter((year) => !Number.isNaN(year));

    if (years.length === 0) {
      return {
        authorYears: [],
        totalCommits: 0,
        firstCommitYear: 0,
        lastCommitYear: 0,
        repositoryFirstYear: repoTimeline.firstYear,
        repositoryLastYear: repoTimeline.lastYear,
      };
    }

    // Get unique years and sort them
    const uniqueYears = [...new Set(years)].sort((a, b) => a - b);

    return {
      authorYears: uniqueYears,
      totalCommits: years.length,
      firstCommitYear: uniqueYears[0],
      lastCommitYear: uniqueYears[uniqueYears.length - 1],
      repositoryFirstYear: repoTimeline.firstYear,
      repositoryLastYear: repoTimeline.lastYear,
    };
  } catch {
    const currentYear = new Date().getFullYear();
    // Return empty timeline on error
    return {
      authorYears: [],
      totalCommits: 0,
      firstCommitYear: 0,
      lastCommitYear: 0,
      repositoryFirstYear: currentYear,
      repositoryLastYear: currentYear,
    };
  }
};
