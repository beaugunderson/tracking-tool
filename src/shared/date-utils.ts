import { isValid as dfIsValid, differenceInYears, format, parse } from 'date-fns';

export const FIRST_TRACKING_DATE = new Date(2018, 10, 1); // November 1, 2018
export const OLDEST_POSSIBLE_AGE = 117;

/** Expand two-digit year to four digits using current-year pivot (matching moment.parseTwoDigitYear). */
function expandTwoDigitYear(twoDigitYear: number): number {
  const currentYearSuffix = new Date().getFullYear() % 100;
  return twoDigitYear <= currentYearSuffix ? 2000 + twoDigitYear : 1900 + twoDigitYear;
}

// Patterns that match two-digit-year formats (M/D/YY or M-D-YY)
const RE_SLASH_YY = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
const RE_DASH_YY = /^(\d{1,2})-(\d{1,2})-(\d{2})$/;

const FOUR_DIGIT_FORMATS = ['MM/dd/yyyy', 'M/d/yyyy', 'MM-dd-yyyy', 'M-d-yyyy', 'yyyy-MM-dd'];

const REF_DATE = new Date(2000, 0, 1);

function tryParse(trimmed: string, fmt: string): Date | null {
  const parsed = parse(trimmed, fmt, REF_DATE);
  if (!dfIsValid(parsed)) return null;

  // Strict validation: re-format and re-parse to reject overflow (e.g., month 13)
  const reformatted = format(parsed, fmt);
  const reparsed = parse(reformatted, fmt, REF_DATE);
  if (parsed.getTime() !== reparsed.getTime()) return null;

  return parsed;
}

/**
 * Parse a date string trying multiple formats in order. Returns null for invalid input.
 * Two-digit year correction: years <= current year suffix → 2000s, else → 1900s.
 */
export function parseDate(date: string): Date | null {
  const trimmed = date ? date.trim() : '';
  if (!trimmed) return null;

  // Check for two-digit year patterns first, expand to four digits, then parse
  const slashMatch = trimmed.match(RE_SLASH_YY);
  if (slashMatch) {
    const expanded = `${slashMatch[1]}/${slashMatch[2]}/${expandTwoDigitYear(parseInt(slashMatch[3], 10))}`;
    return tryParse(expanded, 'M/d/yyyy');
  }

  const dashMatch = trimmed.match(RE_DASH_YY);
  if (dashMatch) {
    const expanded = `${dashMatch[1]}-${dashMatch[2]}-${expandTwoDigitYear(parseInt(dashMatch[3], 10))}`;
    return tryParse(expanded, 'M-d-yyyy');
  }

  // Try four-digit-year formats
  for (const fmt of FOUR_DIGIT_FORMATS) {
    const result = tryParse(trimmed, fmt);
    if (result) return result;
  }

  return null;
}

/** Format a Date as 'yyyy-MM-dd' (database storage format). */
export function formatDatabase(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Format a Date as 'MM/dd/yyyy' (display format). */
export function formatDisplay(date: Date): string {
  return format(date, 'MM/dd/yyyy');
}

/** Calculate age in whole years (same semantics as moment .diff(dob, 'years')). */
export function ageInYears(encounterDate: Date, dateOfBirth: Date): number {
  return differenceInYears(encounterDate, dateOfBirth);
}
