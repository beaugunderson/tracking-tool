import {
  arraySimilarity,
  getPermutations,
  metaphones,
  namesRepresentSamePerson,
  nameToParts,
} from './utilities';
import { Name } from 'parse-full-name';
import { uniqBy } from 'lodash';

const EMPTY_NAME: Name = {
  error: [],
  first: '',
  last: '',
  middle: '',
  nick: '',
  suffix: '',
  title: '',
};

const NAMES: [string, Name][] = [
  ['Jones, Tim', { ...EMPTY_NAME, first: 'tim', last: 'jones' }],
  ['Jónés, Tim', { ...EMPTY_NAME, first: 'tim', last: 'jones' }],
  ['Jones, Tim A', { ...EMPTY_NAME, first: 'tim', last: 'jones', middle: 'a' }],
  ['Jones, Tim Alex', { ...EMPTY_NAME, first: 'tim', last: 'jones', middle: 'alex' }],
  ['Jones, Timothy', { ...EMPTY_NAME, first: 'timothy', last: 'jones' }],
  ['Jones, Timothy A', { ...EMPTY_NAME, first: 'timothy', last: 'jones', middle: 'a' }],
  ['Jones, Timothy Alex', { ...EMPTY_NAME, first: 'timothy', last: 'jones', middle: 'alex' }],
  [
    'Jones, Timothy Alex “Tim”',
    { ...EMPTY_NAME, first: 'timothy', last: 'jones', middle: 'alex', nick: 'tim' },
  ],
  ['Jones, Timothy “Tim”', { ...EMPTY_NAME, first: 'timothy', last: 'jones', nick: 'tim' }],
  ['JONES,TIM', { ...EMPTY_NAME, first: 'tim', last: 'jones' }],
  ['Jones-Smith, Tim', { ...EMPTY_NAME, first: 'tim', last: 'jones-smith' }],
  // incorrectly interprets first name as suffix
  ['Jones Smith, Tim', { ...EMPTY_NAME, first: 'jones', last: 'smith', suffix: 'tim' }],
  ['JonesSmith, Tim', { ...EMPTY_NAME, first: 'tim', last: 'jonessmith' }],
  ['Jones, TimothyAlex', { ...EMPTY_NAME, first: 'timothyalex', last: 'jones' }],
  ['Jonnes, Tim', { ...EMPTY_NAME, first: 'tim', last: 'jonnes' }],
  ['Jonas, Tim', { ...EMPTY_NAME, first: 'tim', last: 'jonas' }],
  ['Tim Jones', { ...EMPTY_NAME, first: 'tim', last: 'jones' }],
  ['Tim A Jones', { ...EMPTY_NAME, first: 'tim', last: 'jones', middle: 'a' }],
  ['T Alex Jones', { ...EMPTY_NAME, first: 't', last: 'jones', middle: 'alex' }],
  [
    'Jones, Timothy Alex, DDS',
    { ...EMPTY_NAME, first: 'timothy', last: 'jones', middle: 'alex', suffix: 'dds' },
  ],
  ['Jones, Timothy A R', { ...EMPTY_NAME, first: 'timothy', last: 'jones', middle: 'a r' }],

  ['O’Malley, Donna', { ...EMPTY_NAME, first: 'donna', last: 'omalley' }],
  ['OMalley, Donna', { ...EMPTY_NAME, first: 'donna', last: 'omalley' }],

  ['F C Reinsch', { ...EMPTY_NAME, first: 'f', middle: 'c', last: 'reinsch' }],
  ['"Bud" Reinsch', { ...EMPTY_NAME, last: 'reinsch', nick: 'bud' }],
  ['Bud Crawford Reinsch', { ...EMPTY_NAME, first: 'bud', middle: 'crawford', last: 'reinsch' }],
  [
    'Francis Crawford "Bud" Reinsch',
    { ...EMPTY_NAME, first: 'francis', last: 'reinsch', middle: 'crawford', nick: 'bud' },
  ],
];

const NAME_GROUPS = [
  [
    'JONES,TIM',
    'Jonas, Tim',
    'Jones Smith, Tim',
    'Jones, Tim A',
    'Jones, Tim Alex',
    'Jones, Tim',
    'Jones, Timothy A R',
    'Jones, Timothy A',
    'Jones, Timothy Alex “Tim”',
    'Jones, Timothy Alex',
    'Jones, Timothy Alex, DDS',
    'Jones, Timothy “Tim”',
    'Jones, Timothy',
    'Jones, TimothyAlex',
    'Jones-Smith, Tim',
    'JonesSmith, Tim',
    'Jonnes, Tim',
    'Jónés, Tim',
    'T Alex Jones',
    'Tim A Jones',
    'Tim Jones',
  ],
  ['O’Malley, Donna', 'OMalley, Donna'],
  ['Reinsch, Francis Crawford "Bud"', '"Bud" Reinsch', 'Bud Crawford Reinsch'],
  ['F C Reinsch', 'Reinsch, Francis Crawford "Bud"'],
];

const NAME_GROUP_COMBINATIONS = [];

for (const group of NAME_GROUPS) {
  for (const a of group) {
    for (const b of group) {
      if (
        (a === 'Jonas, Tim' && b === 'Jonnes, Tim') ||
        (b === 'Jonas, Tim' && a === 'Jonnes, Tim')
      ) {
        continue;
      }

      NAME_GROUP_COMBINATIONS.push([a, b]);
    }
  }
}

const SHOULD_NOT_MATCH_NAMES = [
  'Aline Glenn McFee',
  'Antipatros Naram-Sin Černý',
  'Asa Haden',
  'Ayan Hotaru Horvat',
  'Benedict Boomer',
  'Birgitta Marijan Friedrich',
  'Borys Nairyosangha Wojewoda',
  'Brain Yandell',
  'Burt Tee',
  'Christoper Bunner',
  'Claude Beebe',
  'Cornell Parham',
  'Curt Paek',
  'Darren Jozwiak',
  'Darrick Pontious',
  'Deniece Vlado Ó Seanáin',
  'Doroteja Rosa MacCrumb',
  'Edison Hubble',
  'Eka Saylor Starek',
  'Elias Sykora',
  'Elroy Holmberg',
  'Emery Vanostrand',
  'Emil Jolicoeur',
  'Emmitt Casado',
  'Errol Leibowitz',
  'Eusebio Hickman',
  'Ezequiel Pascoe',
  'Frederick Specht',
  'Freeman Calzada',
  'Gala Milda Grosser',
  'Heath Lirette',
  'Helmi Flavienne Ó Doirnáin',
  'Hollis Krom',
  'Horace Muller',
  'Houston Gully',
  'Idalia Chukwuma Mutton',
  'Jaki Paul Westenberg',
  'Jane Austen',
  'Jane Christie',
  'Jason Neal',
  'Jasper Tandy',
  'Jeff Murdoch',
  'Joan Trishna Christians',
  'Kenton Nesby',
  'Kristina Carver Kovalchuk',
  'Kristopher Eilert Tailler',
  'Kurt Nunez',
  'Kwame Gunnarr Leblanc',
  'Laurentia Esmond Gilliam',
  'Leonard Scarboro',
  'Lorenzo Fossett',
  'Lucius Osmun',
  'Margarito Banta',
  'Mark Rhouth Beck',
  'Mauro Soto',
  'Meredith Adedayo McCoy',
  'Milena Leila Ellisson',
  'Milodrag Herais McNaughton',
  'Noel Jared',
  'Oliver Morris',
  'Palmer Patten',
  'Patrick Maitland',
  'Paul Kupfer',
  'Porter Cutts',
  'Praveena Priscilla Ó Díomasaigh',
  'Priti İlkin McAdams',
  'Prokopios Fikret Ramos',
  'Raymundo Catledge',
  'Ryan Hereford',
  'Sally Harper',
  'Scot Almeda',
  'Scott Stapp',
  'Sebastian Brandenburg',
  'Simen Wangui Mlakar',
  'Snake Plissken',
  'Solid Snake',
  'Sonja Ľudovít Alunni',
  'Steve Buscemi',
  'Steve Taylor',
  'Stevie Brumbaugh',
  'Stevie Ray Vaughn',
  'Sunil Iara Keegan',
  'Susan Walker',
  'Thad Luick',
  'Toynbee Idea',
  'Trinidad Shead',
  'Tristan Barden',
  'Tyson Chidester',
  'Wilber Priestley',
  'Wiley Carnes',
  'Wm Phan',
  'Zahrah Orvokki Mooren',
  'Zuri Hendrik Zawisza',
  'Árni Hamid Jain',
];

const SHOULD_NOT_MATCH_COMBINATIONS = [];

for (const a of SHOULD_NOT_MATCH_NAMES) {
  for (const b of SHOULD_NOT_MATCH_NAMES) {
    if (a === b) {
      continue;
    }

    SHOULD_NOT_MATCH_COMBINATIONS.push([a, b]);
  }
}

function dedupe(array: [string, string][]) {
  return uniqBy(array, (combination) => [...combination].sort().join('::'));
}

describe('getPermutations', () => {
  it('should get permutations', () => {
    expect(getPermutations('SmithJones, Tim')).toEqual(
      new Set(['SmithJones, Tim', 'Smith Jones, Tim', 'Smith-Jones, Tim']),
    );
  });
});

describe('nameToParts', () =>
  test.each(NAMES)('%p should parse correctly', (name, result) =>
    expect(nameToParts(name)).toEqual(result),
  ));

describe('namesRepresentSamePerson should match', () =>
  test.each(dedupe(NAME_GROUP_COMBINATIONS))('%p should represent %p', (a, b) =>
    expect(namesRepresentSamePerson(a, b)).toBe(true),
  ));

describe('namesRepresentSamePerson should not match', () => {
  it('should not allow matching middle names to ignore non-matching first names', () => {
    expect(namesRepresentSamePerson('"Bud" Reinsch', 'F C Reinsch')).toBe(false);
  });

  test.each(dedupe(SHOULD_NOT_MATCH_COMBINATIONS))('%p should not represent %p', (a, b) =>
    expect(namesRepresentSamePerson(a, b)).toBe(false),
  );
});

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
    const beau5 = metaphones("B'eau Gunderson");

    expect(arraySimilarity(beau1, beau1)).toBe(1);
    expect(arraySimilarity(beau1, beau2)).toBe(1);
    expect(arraySimilarity(beau1, beau3)).toBe(1);
    expect(arraySimilarity(beau1, beau5)).toBe(1);
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
