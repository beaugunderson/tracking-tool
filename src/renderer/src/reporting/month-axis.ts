/**
 * Helpers for the Tasks by Month chart's x axis. Month keys are 'yyyy-MM'.
 */

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Bar width (px) at or above which every month gets a label and a value. */
const MONTHLY_LABEL_WIDTH = 60;
/** Bar width (px) at or above which quarters get labels. Below this only January does. */
const QUARTERLY_LABEL_WIDTH = 22;
/** Bar width (px) at or above which the value is written above each bar. */
const VALUE_LABEL_WIDTH = 40;
/** Minimum horizontal distance (px) between two labeled ticks. */
const MIN_LABEL_SPACING = 60;

export type MonthTick = { key: string; label: string };

function split(key: string): [number, number] {
  const [year, month] = key.split('-');
  return [Number(year), Number(month)];
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Every month from first to last inclusive, so months with no data still take up a slot. */
export function monthRange(first: string, last: string): string[] {
  const [firstYear, firstMonth] = split(first);
  const [lastYear, lastMonth] = split(last);
  const months: string[] = [];

  for (
    let year = firstYear, month = firstMonth;
    year < lastYear || (year === lastYear && month <= lastMonth);
  ) {
    months.push(monthKey(year, month));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function monthName(key: string): string {
  return MONTH_NAMES[split(key)[1] - 1];
}

function yearOf(key: string): number {
  return split(key)[0];
}

/**
 * Which months get an axis label, and what it says, given how many pixels each bar has.
 * Wide bars: every month as MM/yyyy. Narrower: quarters ("Jan 2023", "Apr", "Jul", "Oct").
 * Narrowest: January only, as the year. The first month is labeled too so the range start
 * is readable, unless that would crowd the first January. Other labels that would crowd
 * the previous one are dropped.
 */
export function monthTicks(months: string[], bandWidth: number): MonthTick[] {
  if (months.length === 0) {
    return [];
  }

  if (bandWidth >= MONTHLY_LABEL_WIDTH) {
    return months.map((key) => {
      const [year, month] = split(key);
      return { key, label: `${String(month).padStart(2, '0')}/${year}` };
    });
  }

  const quarterly = bandWidth >= QUARTERLY_LABEL_WIDTH;
  const ticks: MonthTick[] = [];
  let lastIndex = -Infinity;

  const firstJanuary = months.findIndex((key) => split(key)[1] === 1);
  const labelFirst = firstJanuary <= 0 || firstJanuary * bandWidth >= MIN_LABEL_SPACING;

  months.forEach((key, index) => {
    const month = split(key)[1];
    const isJanuary = month === 1;
    const isQuarterStart = month === 1 || month === 4 || month === 7 || month === 10;
    const isFirst = index === 0 && labelFirst;

    if (!isFirst && !isJanuary && !(quarterly && isQuarterStart)) {
      return;
    }

    if ((index - lastIndex) * bandWidth < MIN_LABEL_SPACING) {
      return;
    }

    let label: string;
    if (quarterly) {
      label = isJanuary || isFirst ? `${monthName(key)} ${yearOf(key)}` : monthName(key);
    } else {
      label = isJanuary ? `${yearOf(key)}` : `${monthName(key)} ${yearOf(key)}`;
    }

    ticks.push({ key, label });
    lastIndex = index;
  });

  return ticks;
}

export function showValueLabels(bandWidth: number): boolean {
  return bandWidth >= VALUE_LABEL_WIDTH;
}

/** "Sep 2020" for hover titles. */
export function monthTitle(key: string): string {
  return `${monthName(key)} ${yearOf(key)}`;
}
