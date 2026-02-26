import { ageInYears, formatDatabase, formatDisplay, parseDate } from './date-utils';

describe('parseDate', () => {
  it('parses MM/DD/YYYY', () => {
    const d = parseDate('01/15/2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });

  it('parses M/D/YYYY', () => {
    const d = parseDate('1/5/2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-05');
  });

  it('parses M/D/YY with two-digit year <= current year → 2000s', () => {
    const d = parseDate('1/1/18');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2018);
  });

  it('parses M/D/YY with two-digit year > current year → 1900s', () => {
    const d = parseDate('1/1/99');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(1999);
  });

  it('two-digit year boundary: current year suffix → 2000s', () => {
    const currentYearSuffix = new Date().getFullYear() - 2000;
    const d = parseDate(`1/1/${currentYearSuffix}`);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2000 + currentYearSuffix);
  });

  it('two-digit year boundary: current year + 1 suffix → 1900s', () => {
    const nextYearSuffix = new Date().getFullYear() - 2000 + 1;
    const d = parseDate(`1/1/${nextYearSuffix}`);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(1900 + nextYearSuffix);
  });

  it('parses MM-DD-YYYY', () => {
    const d = parseDate('01-15-2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });

  it('parses M-D-YYYY', () => {
    const d = parseDate('1-5-2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-05');
  });

  it('parses M-D-YY', () => {
    const d = parseDate('1-5-23');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-05');
  });

  it('parses database format YYYY-MM-DD', () => {
    const d = parseDate('2023-01-15');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(parseDate('not a date')).toBeNull();
  });

  it('trims whitespace', () => {
    const d = parseDate('  01/15/2023  ');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });
});

describe('formatDatabase', () => {
  it('formats as yyyy-MM-dd', () => {
    expect(formatDatabase(new Date(2023, 0, 15))).toBe('2023-01-15');
  });
});

describe('formatDisplay', () => {
  it('formats as MM/dd/yyyy', () => {
    expect(formatDisplay(new Date(2023, 0, 15))).toBe('01/15/2023');
  });
});

describe('ageInYears', () => {
  it('calculates age in whole years', () => {
    const encounter = new Date(2023, 5, 15);
    const dob = new Date(1980, 0, 1);
    expect(ageInYears(encounter, dob)).toBe(43);
  });

  it('returns age before birthday in the encounter year', () => {
    const encounter = new Date(2023, 5, 15);
    const dob = new Date(1980, 6, 1);
    expect(ageInYears(encounter, dob)).toBe(42);
  });

  it('returns age on birthday', () => {
    const encounter = new Date(2023, 5, 15);
    const dob = new Date(1980, 5, 15);
    expect(ageInYears(encounter, dob)).toBe(43);
  });
});
