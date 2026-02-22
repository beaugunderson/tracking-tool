import { isIntern, usernameToName } from './usernames';

describe('usernameToName', () => {
  it('returns display name for known username', () => {
    expect(usernameToName('beau')).toBe('Beau Gunderson');
  });

  it('returns display name for dotted username', () => {
    expect(usernameToName('ailish.mackey')).toBe('Ailish Mackey');
  });

  it('returns lowercased fallback for unknown username', () => {
    expect(usernameToName('UNKNOWN_USER')).toBe('unknown_user');
  });

  it('is case insensitive', () => {
    expect(usernameToName('BEAU')).toBe('Beau Gunderson');
    expect(usernameToName('Beau')).toBe('Beau Gunderson');
  });
});

describe('isIntern', () => {
  it('returns true for current intern with no transition date', () => {
    expect(isIntern('goodmx1', '2024-01-15')).toBe(true);
  });

  it('returns false for non-intern username', () => {
    expect(isIntern('beau', '2023-01-15')).toBe(false);
  });

  it('returns false for null username', () => {
    expect(isIntern(null, '2023-01-15')).toBe(false);
  });

  describe('jonasa1: transition 12/6/2020', () => {
    it('is intern before cutoff', () => {
      expect(isIntern('jonasa1', '2020-12-05')).toBe(true);
    });

    it('is not intern after cutoff', () => {
      expect(isIntern('jonasa1', '2020-12-07')).toBe(false);
    });
  });

  describe('patrick.stephens: transition 6/19/2021', () => {
    it('is intern before cutoff', () => {
      expect(isIntern('patrick.stephens', '2021-06-18')).toBe(true);
    });

    it('is not intern after cutoff', () => {
      expect(isIntern('patrick.stephens', '2021-06-20')).toBe(false);
    });
  });

  describe('ailish.mackey: transition 8/20/2022', () => {
    it('is intern before cutoff', () => {
      expect(isIntern('ailish.mackey', '2022-08-19')).toBe(true);
    });

    it('is not intern after cutoff', () => {
      expect(isIntern('ailish.mackey', '2022-08-21')).toBe(false);
    });
  });

  describe('lauren.zemer: transition 8/20/2022', () => {
    it('is intern before cutoff', () => {
      expect(isIntern('lauren.zemer', '2022-08-19')).toBe(true);
    });

    it('is not intern after cutoff', () => {
      expect(isIntern('lauren.zemer', '2022-08-21')).toBe(false);
    });
  });

  describe('beatrice.terino: transition 6/30/2024', () => {
    it('is intern before cutoff', () => {
      expect(isIntern('beatrice.terino', '2024-06-29')).toBe(true);
    });

    it('is not intern after cutoff', () => {
      expect(isIntern('beatrice.terino', '2024-07-01')).toBe(false);
    });
  });

  describe('hannah.sjogren: transition 8/1/2024', () => {
    it('is intern before cutoff', () => {
      expect(isIntern('hannah.sjogren', '2024-07-31')).toBe(true);
    });

    it('is not intern after cutoff', () => {
      expect(isIntern('hannah.sjogren', '2024-08-02')).toBe(false);
    });
  });

  describe('shannon.youmans and sabrina.figueroa: transition 8/31/2024', () => {
    it('shannon.youmans is intern before cutoff', () => {
      expect(isIntern('shannon.youmans', '2024-08-30')).toBe(true);
    });

    it('shannon.youmans is not intern after cutoff', () => {
      expect(isIntern('shannon.youmans', '2024-09-01')).toBe(false);
    });

    it('sabrina.figueroa is intern before cutoff', () => {
      expect(isIntern('sabrina.figueroa', '2024-08-30')).toBe(true);
    });

    it('sabrina.figueroa is not intern after cutoff', () => {
      expect(isIntern('sabrina.figueroa', '2024-09-01')).toBe(false);
    });
  });
});
