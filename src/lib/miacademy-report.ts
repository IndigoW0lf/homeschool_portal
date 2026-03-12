/**
 * MiAcademy PDF / report text parser.
 * Used by parse-curriculum API and by MiAcademy crawl import.
 * Format: "DATE TOPIC_NAME | ACTIVITY_TYPE: DESCRIPTION SCORE%"
 */

export interface MiAcademyParsedRow {
  taskName: string;
  course: string;
  date: string;
  score: number | null;
}

function parseDate(dateStr: string): string | null {
  const cleaned = dateStr.trim().replace(/^"|"$/g, '');
  const slashParts = cleaned.split('/');
  if (slashParts.length === 3) {
    const [month, day, year] = slashParts;
    const m = month.padStart(2, '0');
    const d = day.padStart(2, '0');
    const y = year.length === 2 ? '20' + year : year;
    if (/^\d{4}-\d{2}-\d{2}$/.test(`${y}-${m}-${d}`)) {
      return `${y}-${m}-${d}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) return isoDate.toISOString().split('T')[0];
  return null;
}

/**
 * Returns true if the text looks like MiAcademy PDF report format
 * (lines starting with MM/DD/YYYY followed by task content).
 */
export function isMiAcademyReportFormat(rawText: string): boolean {
  const lines = rawText.split('\n');
  const reportLines = lines.filter((l) =>
    /^\d{1,2}\/\d{1,2}\/\d{4}\s+\w+/.test(l.trim())
  );
  return reportLines.length > 3;
}

/**
 * Parse MiAcademy PDF report format (not CSV).
 * Handles course headers, data rows, and concatenated dates from PDF extraction.
 */
export function parseMiAcademyReport(rawText: string): MiAcademyParsedRow[] {
  const lines = rawText.split('\n');
  const rows: MiAcademyParsedRow[] = [];
  let currentCourse = 'Unknown Course';

  const courseHeaderPatterns: [RegExp, string][] = [
    [/^Math:?\s*(Level\s*\w+)?/i, 'Math'],
    [/^Reading\s*Comprehension/i, 'Reading'],
    [/^Survivor'?s?\s*Quest/i, "Survivor's Quest"],
    [/^Science/i, 'Science'],
    [/^Writing/i, 'Writing'],
    [/^History/i, 'History'],
    [/^U\.?S\.?\s*Government/i, 'U.S. Government'],
    [/^Social\s*Studies/i, 'Social Studies'],
    [/^Language\s*Arts/i, 'Language Arts'],
    [/^Art\b/i, 'Art'],
    [/^Music/i, 'Music'],
    [/^Logic/i, 'Logic'],
    [/^Beliefs/i, 'Social-Emotional'],
    [/^Self-?Management/i, 'Social-Emotional'],
    [/^Growth\s*Mindset/i, 'Social-Emotional'],
    [/^Critical\s*Thinking/i, 'Logic'],
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;

    if (/^Student Skill Assessments/i.test(trimmed)) continue;
    if (/^Report Card/i.test(trimmed)) continue;
    if (/^Progress$/i.test(trimmed)) continue;
    if (/^Date\s+Name\s+Score$/i.test(trimmed)) continue;
    if (/^\d+$/.test(trimmed)) continue;

    let matchedCourse = false;
    for (const [pattern, courseName] of courseHeaderPatterns) {
      if (pattern.test(trimmed)) {
        const fullName = trimmed.split(/Course Study Time|Overall Grade/i)[0].trim();
        currentCourse = fullName || courseName;
        matchedCourse = true;
        break;
      }
    }
    if (matchedCourse) continue;

    if (/^Grade for Selected|^Overall Grade|^Course Study Time/i.test(trimmed)) continue;

    const singleDateMatch = trimmed.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+([A-Za-z].*)$/);
    if (singleDateMatch) {
      const dateStr = singleDateMatch[1];
      const restOfLine = singleDateMatch[2].trim();
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(restOfLine)) continue;
      if (restOfLine.length < 5) continue;
      const scoreMatch = restOfLine.match(/(\d+)%\s*$/);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      const date = parseDate(dateStr);
      if (date && restOfLine) {
        rows.push({
          taskName: restOfLine,
          course: currentCourse,
          date,
          score,
        });
      }
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}\/\d{1,2}\/\d{4})+/.test(trimmed)) {
      continue;
    }
  }

  return rows;
}
