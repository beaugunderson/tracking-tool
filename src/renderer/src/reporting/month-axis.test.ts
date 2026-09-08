import { monthRange, monthTicks, monthTitle, showValueLabels } from './month-axis';

describe('monthRange', () => {
  it('fills in months with no data', () => {
    expect(monthRange('2020-11', '2021-02')).toEqual(['2020-11', '2020-12', '2021-01', '2021-02']);
  });

  it('returns a single month when first equals last', () => {
    expect(monthRange('2024-06', '2024-06')).toEqual(['2024-06']);
  });

  it('spans six years', () => {
    expect(monthRange('2020-09', '2026-09')).toHaveLength(73);
  });
});

describe('monthTicks', () => {
  const sixYears = monthRange('2020-09', '2026-09');

  it('labels every month as MM/yyyy when bars are wide', () => {
    const ticks = monthTicks(monthRange('2025-11', '2026-02'), 200);
    expect(ticks.map((t) => t.label)).toEqual(['11/2025', '12/2025', '01/2026', '02/2026']);
  });

  it('labels only Januaries by year when bars are narrow, plus the first month', () => {
    const ticks = monthTicks(sixYears, 19);
    expect(ticks.map((t) => t.label)).toEqual([
      'Sep 2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
    ]);
  });

  it('labels quarters at medium widths', () => {
    const ticks = monthTicks(monthRange('2024-01', '2024-12'), 30);
    expect(ticks.map((t) => t.label)).toEqual(['Jan 2024', 'Apr', 'Jul', 'Oct']);
  });

  it('drops the first-month label when it would crowd the first January', () => {
    // Dec 2020 is one bar (19px) before Jan 2021, too close for both labels
    const ticks = monthTicks(monthRange('2020-12', '2021-12'), 19);
    expect(ticks.map((t) => t.label)).toEqual(['2021']);
  });

  it('keeps every year label on a narrow window', () => {
    // 12px bars: Sep 2020 is 48px from Jan 2021, so the start label yields to the year
    const ticks = monthTicks(sixYears, 12);
    expect(ticks.map((t) => t.label)).toEqual(['2021', '2022', '2023', '2024', '2025', '2026']);
  });

  it('returns nothing for no months', () => {
    expect(monthTicks([], 19)).toEqual([]);
  });
});

describe('showValueLabels', () => {
  it('hides values on narrow bars', () => {
    expect(showValueLabels(19)).toBe(false);
    expect(showValueLabels(80)).toBe(true);
  });
});

describe('monthTitle', () => {
  it('formats a month key for hover text', () => {
    expect(monthTitle('2020-09')).toBe('Sep 2020');
  });
});
