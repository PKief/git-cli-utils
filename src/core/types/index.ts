export interface Branch {
  name: string;
  date: string;
}

export interface Commit {
  hash: string;
  date: string;
  branch: string;
  subject: string;
}

export interface GitUtilities {
  getBranches: () => Promise<Branch[]>;
  getCommits: () => Promise<Commit[]>;
}