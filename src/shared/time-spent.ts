export const TIME_SPENT_MULTIPLE_ERROR = 'Must be rounded to the nearest multiple of 5';

/** Time Spent is entered in minutes rounded to a multiple of 5. */
export function isMultipleOfFive(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) % 5 === 0;
}
