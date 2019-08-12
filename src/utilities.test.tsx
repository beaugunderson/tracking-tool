import { arraySimilarity, metaphones } from './utilities';

describe('arraySimilarity', () => {
  it('should work', () => {
    expect(arraySimilarity([], [])).toBe(NaN);

    expect(arraySimilarity([0], [])).toBe(0);
    expect(arraySimilarity([], [0])).toBe(0);

    expect(arraySimilarity([0], [0])).toBe(1);
    expect(arraySimilarity([0, 1, 2, 3], [0, 1, 2, 3])).toBe(1);

    expect(arraySimilarity([0, 1, 2], [0, 1, 2, 3])).toBe(0.75);
    expect(arraySimilarity([0, 1, 2, 3], [0, 1, 2])).toBe(0.75);
  });

  it('should work with metaphones', () => {
    const beau1 = metaphones('Beau Gunderson');
    const beau2 = metaphones('Gunderson, Beau');
    const beau3 = metaphones('   Gunderson ,     Beau ');
    const beau4 = metaphones('Gunderson, Beau Allen');

    expect(arraySimilarity(beau1, beau1)).toBe(1);
    expect(arraySimilarity(beau1, beau2)).toBe(1);
    expect(arraySimilarity(beau1, beau3)).toBe(1);
    expect(arraySimilarity(beau2, beau3)).toBe(1);

    expect(arraySimilarity(beau1, beau4)).toBe(2 / 3);
    expect(arraySimilarity(beau2, beau4)).toBe(2 / 3);
    expect(arraySimilarity(beau3, beau4)).toBe(2 / 3);
  });
});

describe('metaphones', () => {
  it('should work', () => {
    expect(metaphones('Beau Gunderson')).toStrictEqual(['P', 'KNTRSN']);
  });
});
