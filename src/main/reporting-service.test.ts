import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  applyMigrations,
  normalizeGlobPattern,
  openDataStore,
  usernameFromEncounterPath,
} from './reporting-service';

describe('normalizeGlobPattern', () => {
  it('converts Windows backslashes to forward slashes', () => {
    expect(normalizeGlobPattern('S:\\tracking\\*\\encounters.json')).toBe(
      'S:/tracking/*/encounters.json',
    );
  });

  it('handles UNC paths', () => {
    expect(normalizeGlobPattern('\\\\server\\share\\*\\encounters.json')).toBe(
      '//server/share/*/encounters.json',
    );
  });

  it('preserves forward slashes (Unix/macOS)', () => {
    expect(normalizeGlobPattern('/Users/beau/tracking/*/encounters.json')).toBe(
      '/Users/beau/tracking/*/encounters.json',
    );
  });

  it('handles mixed separators', () => {
    expect(normalizeGlobPattern('C:\\Users/beau\\tracking/*/encounters.json')).toBe(
      'C:/Users/beau/tracking/*/encounters.json',
    );
  });

  it('handles deep Windows paths like the actual network drive', () => {
    const input =
      'S:\\PublicWorkGroups\\Social Workers\\Staff\\Tracking tool and Instructions\\2019\\*\\encounters.json';
    const expected =
      'S:/PublicWorkGroups/Social Workers/Staff/Tracking tool and Instructions/2019/*/encounters.json';
    expect(normalizeGlobPattern(input)).toBe(expected);
  });

  it('handles G: drive path', () => {
    const input =
      'G:\\SCI\\PublicWorkGroups\\Social Workers\\Staff\\Tracking tool and Instructions\\2019\\*\\encounters.json';
    expect(normalizeGlobPattern(input)).toMatch(/^G:\/SCI\/.*\/\*\/encounters\.json$/);
  });

  it('handles empty string', () => {
    expect(normalizeGlobPattern('')).toBe('');
  });

  it('handles path with no backslashes', () => {
    expect(normalizeGlobPattern('just/forward/slashes')).toBe('just/forward/slashes');
  });

  it('produces a valid glob pattern from a Windows path.join result', () => {
    // Simulate what path.join produces on Windows
    const windowsJoinResult = 'S:\\tracking-tool\\*\\encounters.json';
    const pattern = normalizeGlobPattern(windowsJoinResult);
    expect(pattern).toBe('S:/tracking-tool/*/encounters.json');
    expect(pattern).toContain('*'); // wildcard is preserved
    expect(pattern).not.toContain('\\'); // no backslashes remain
  });
});

describe('usernameFromEncounterPath', () => {
  // glob v13 always returns forward-slash paths, even on Windows.
  // These tests use forward slashes since that's what the function receives in practice.

  it('extracts username from forward-slash path', () => {
    expect(usernameFromEncounterPath('S:/tracking/beau/encounters.json')).toBe('beau');
  });

  it('extracts username from Unix path', () => {
    expect(usernameFromEncounterPath('/Users/beau/tracking/jsmith/encounters.json')).toBe(
      'jsmith',
    );
  });

  it('extracts username from deep network drive path', () => {
    expect(
      usernameFromEncounterPath(
        'S:/PublicWorkGroups/Social Workers/Staff/Tracking tool and Instructions/2019/lindce2/encounters.json',
      ),
    ).toBe('lindce2');
  });

  it('extracts username from G: drive path', () => {
    expect(
      usernameFromEncounterPath(
        'G:/SCI/PublicWorkGroups/Social Workers/Staff/Tracking tool and Instructions/2019/nejash1/encounters.json',
      ),
    ).toBe('nejash1');
  });

  it('handles temp directory path (copied files)', () => {
    expect(usernameFromEncounterPath('/tmp/reporting-abc123/valejd1/encounters.json')).toBe(
      'valejd1',
    );
  });

  it('extracts username from Windows temp path with forward slashes', () => {
    expect(
      usernameFromEncounterPath(
        'C:/Users/ADMIN/AppData/Local/Temp/reporting-xyz/nordje1/encounters.json',
      ),
    ).toBe('nordje1');
  });

  it('works with path.basename(path.dirname()) on native paths', () => {
    // On the current platform, path.join produces native separators.
    // usernameFromEncounterPath should handle them.
    const nativePath = path.join('/some', 'root', 'carynstewart', 'encounters.json');
    expect(usernameFromEncounterPath(nativePath)).toBe('carynstewart');
  });
});

describe('migration c1823bb1 (future DOB correction)', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-test-'));
    dbPath = path.join(tmpDir, 'encounters.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function insertDoc(doc: Record<string, unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      const ds = openDataStore(dbPath);
      ds.insert(doc, (err) => (err ? reject(err) : resolve()));
    });
  }

  function findAll(ds: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      ds.find({ encounterType: 'patient' }, (err: Error | null, docs: any[]) =>
        err ? reject(err) : resolve(docs),
      );
    });
  }

  it('corrects a future DOB by subtracting 100 years', async () => {
    // Two-digit year "1/1/30" with current year 2026 → 2030 (future), so migration should fix
    // Use a definitely-future four-digit year to avoid two-digit year parsing ambiguity
    await insertDoc({
      encounterType: 'patient',
      dateOfBirth: '01/01/2090',
    });

    const ds = openDataStore(dbPath);
    await applyMigrations(ds);

    const docs = await findAll(ds);
    expect(docs).toHaveLength(1);
    expect(docs[0].dateOfBirth).toBe('1990-01-01');
  });

  it('leaves a past DOB unchanged', async () => {
    await insertDoc({
      encounterType: 'patient',
      dateOfBirth: '03/25/1990',
    });

    const ds = openDataStore(dbPath);
    await applyMigrations(ds);

    const docs = await findAll(ds);
    expect(docs).toHaveLength(1);
    expect(docs[0].dateOfBirth).toBe('03/25/1990');
  });

  it('leaves an invalid DOB unchanged', async () => {
    await insertDoc({
      encounterType: 'patient',
      dateOfBirth: 'not-a-date',
    });

    const ds = openDataStore(dbPath);
    await applyMigrations(ds);

    const docs = await findAll(ds);
    expect(docs).toHaveLength(1);
    expect(docs[0].dateOfBirth).toBe('not-a-date');
  });
});
