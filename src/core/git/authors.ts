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
    const command = `git log -1 --pretty=format:'%an|%ae|%h|%cd' --date=format:'%d.%m.%Y %H:%M' -- "${filePath}"`;
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
 */
export const getFileAuthors = async (
  filePath?: string
): Promise<FileAuthor[]> => {
  try {
    // Use pure git log without shell piping to ensure Windows compatibility
    let command = "git log --pretty=format:'%an <%ae>'";

    if (filePath) {
      command = `git log --pretty=format:'%an <%ae>' -- "${filePath}"`;
    }

    const result = await gitExecutor.executeCommand(command);
    const authors: Map<string, FileAuthor> = new Map();

    // Process the output line by line and count manually (JavaScript equivalent of sort | uniq -c)
    const lines = result.stdout.split('\n');
    const authorCounts: Map<string, { name: string; email: string; count: number }> = new Map();

    lines.forEach((line: string) => {
      if (!line.trim()) return;

      // Parse format: "John Doe <john.doe@example.com>"
      const match = line.match(/^(.+?)\s+<(.+?)>$/);
      if (!match) return;

      const [, name, email] = match;
      const key = email; // Use email as unique key
      
      if (authorCounts.has(key)) {
        const existing = authorCounts.get(key)!;
        existing.count++;
      } else {
        authorCounts.set(key, { name: name.trim(), email, count: 1 });
      }
    });

    // Convert to FileAuthor format
    authorCounts.forEach(({ name, email, count }) => {
      authors.set(email, {
        name,
        email,
        commitCount: count,
        lastCommitHash: '',
        lastCommitDate: '',
      });
    });

    // Get last commit info for each author
    const authorList = Array.from(authors.values());

    // Get last commit details for each author
    const promises = authorList.map(async (author) => {
      try {
        const lastCommit = await getLastCommitByAuthor(author.email, filePath);
        return {
          ...author,
          lastCommitHash: lastCommit?.hash || '',
          lastCommitDate: lastCommit?.date || '',
        };
      } catch {
        return author;
      }
    });

    const authorsWithLastCommit = await Promise.all(promises);
    // Sort by commit count descending
    authorsWithLastCommit.sort((a, b) => b.commitCount - a.commitCount);
    return authorsWithLastCommit;
  } catch (error) {
    throw error;
  }
};

/**
 * Get the last commit by a specific author for a file or repository
 */
const getLastCommitByAuthor = async (
  authorEmail: string,
  filePath?: string
): Promise<{ hash: string; date: string } | null> => {
  try {
    let command = `git log -1 --pretty=format:'%h|%cd' --date=format:'%d.%m.%Y %H:%M' --author='${authorEmail}'`;

    if (filePath) {
      command += ` -- "${filePath}"`;
    }
    const result = await gitExecutor.executeCommand(command);

    if (!result.stdout.trim()) {
      return null;
    }

    const [hash, date] = result.stdout.split('|');
    return { hash, date };
  } catch {
    return null;
  }
};
