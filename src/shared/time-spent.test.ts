import { isMultipleOfFive } from './time-spent';

describe('isMultipleOfFive', () => {
  it('accepts multiples of 5', () => {
    expect(isMultipleOfFive('0')).toBe(true);
    expect(isMultipleOfFive('5')).toBe(true);
    expect(isMultipleOfFive('75')).toBe(true);
    expect(isMultipleOfFive('210')).toBe(true);
  });

  it('rejects other numbers', () => {
    expect(isMultipleOfFive('208')).toBe(false);
    expect(isMultipleOfFive('1')).toBe(false);
    expect(isMultipleOfFive('52')).toBe(false);
  });

  it('rejects empty and non-numeric input', () => {
    expect(isMultipleOfFive('')).toBe(false);
    expect(isMultipleOfFive('abc')).toBe(false);
    expect(isMultipleOfFive('1.5')).toBe(false);
  });
});
