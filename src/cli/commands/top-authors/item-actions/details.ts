import {
  AuthorTimeline,
  FileAuthor,
  getAuthorTimeline,
} from '../../../../core/git/authors.js';
import { gray, green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Format and display a simple timeline showing years of activity
 */
const displayTimeline = (timeline: AuthorTimeline) => {
  if (timeline.authorYears.length === 0) {
    writeLine(yellow('No timeline data available.'));
    return;
  }

  const yearsActive = timeline.authorYears.length;
  const totalTimespan =
    timeline.repositoryLastYear - timeline.repositoryFirstYear + 1;

  writeLine();
  writeLine(
    gray(
      `Repository timeline: ${timeline.repositoryFirstYear} - ${timeline.repositoryLastYear}`
    )
  );

  const minYear = timeline.repositoryFirstYear;
  const maxYear = timeline.repositoryLastYear;
  const yearRange = maxYear - minYear;

  if (yearRange === 0) {
    const hasActivity = timeline.authorYears.includes(minYear);
    const symbol = hasActivity ? green('\u25CF') : gray('\u2500');
    writeLine(`${symbol} ${minYear}`);
  } else {
    let timelineStr = '';

    for (let i = 0; i <= yearRange; i++) {
      const currentYear = minYear + i;
      if (timeline.authorYears.includes(currentYear)) {
        timelineStr += green('\u25CF');
      } else {
        timelineStr += gray('\u2500');
      }
    }

    writeLine(`${minYear} ${timelineStr} ${maxYear}`);
    writeLine(
      `Active in ${green(yearsActive.toString())} of ${totalTimespan} years`
    );
  }
};

/**
 * Show author details and activity timeline
 */
export async function showAuthorDetails(
  author: FileAuthor,
  filePath?: string
): Promise<ActionResult<FileAuthor>> {
  try {
    writeLine();
    writeLine(`${author.name} <${author.email}>`);
    writeLine(
      `${author.commitCount} commits | Last: #${author.lastCommitHash} on ${author.lastCommitDate}`
    );

    try {
      const timeline = await getAuthorTimeline(author.email, filePath);
      displayTimeline(timeline);
    } catch {
      writeLine(yellow('Could not generate timeline data.'));
    }

    return actionSuccess(`Author details shown`);
  } catch (error) {
    const errorMessage = `Show details failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`\u2717 ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
