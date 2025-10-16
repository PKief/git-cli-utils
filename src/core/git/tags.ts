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
    throw new Error(
      `Error executing git command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const filterTags = (tags: GitTag[], searchTerm: string): GitTag[] => {
  if (!searchTerm) return tags;

  const normalizedSearchTerm = searchTerm.toLowerCase();

  return tags.filter((tag) => {
    const searchableText =
      `${tag.name} ${tag.date} ${tag.hash} ${tag.subject} ${tag.tagger}`.toLowerCase();

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
