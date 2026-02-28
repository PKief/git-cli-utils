import { fuzzyFilter, getErrorMessage } from '../utils.js';
import { gitExecutor } from './executor.js';

export interface GitTag {
  name: string;
  date: string;
  hash: string;
  subject: string;
  tagger: string;
}

export const getGitTags = async (): Promise<GitTag[]> => {
  try {
    // Get tags with their commit info
    // Use %(objectname:short) for lightweight tags and %(*objectname:short) for annotated tags
    // Use %(contents:subject) for lightweight tags and %(*subject) for annotated tags
    const command =
      'git tag --sort=-version:refname --format=%(refname:short)|%(creatordate:relative)|%(objectname:short)|%(*objectname:short)|%(contents:subject)|%(*subject)|%(taggername)';
    const result = await gitExecutor.executeStreamingCommand(command);

    const tags: GitTag[] = [];

    result.data.forEach((line) => {
      if (!line.trim()) return;
      const [
        name,
        date,
        lightweightHash,
        annotatedHash,
        lightweightSubject,
        annotatedSubject,
        tagger,
      ] = line.split('|');

      // Use annotated tag info if available, otherwise fall back to lightweight tag info
      const hash = annotatedHash || lightweightHash || '';
      const subject = annotatedSubject || lightweightSubject || '';

      tags.push({
        name,
        date: date || 'Unknown',
        hash,
        subject,
        tagger: tagger || 'Unknown',
      });
    });

    return tags;
  } catch (error) {
    throw new Error(`Error executing git command: ${getErrorMessage(error)}`);
  }
};

export const filterTags = (tags: GitTag[], searchTerm: string): GitTag[] => {
  return fuzzyFilter(
    tags,
    searchTerm,
    (tag) => `${tag.name} ${tag.date} ${tag.hash} ${tag.subject} ${tag.tagger}`
  );
};
