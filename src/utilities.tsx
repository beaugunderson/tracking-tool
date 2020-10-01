import doubleMetaphone from 'double-metaphone';
import levenshtein from 'levenshtein-edit-distance';
import moment from 'moment';
import XRegExp from 'xregexp';
import { DATE_FORMAT_DISPLAY } from './constants';
import { deburr, endsWith, isString, mapValues, startsWith } from 'lodash';
import { Name, parseFullName } from 'parse-full-name';

const RE_NON_LETTERS = XRegExp('[^\\pL -]', 'g');

function simplify(string: string) {
  return deburr(string).toLowerCase().replace(RE_NON_LETTERS, '');
}

export function nameToParts(name: string): Name {
  const parsed = parseFullName(name.replace(/,\s*/g, ', '), 'all', false, false);
  return mapValues(parsed, (value) => (isString(value) ? simplify(value) : value)) as Name;
}

function substringMatch(a: string, b: string): boolean {
  return startsWith(a, b) || startsWith(b, a);
}

function firstNamesMatch(a: Name, b: Name): boolean {
  return (
    !a.first ||
    !b.first ||
    // handle shortened names like Tim/Timothy
    startsWith(a.first, b.first) ||
    startsWith(b.first, a.first) ||
    // handle when a nickname is used as a first name or vice versa
    (a.nick && substringMatch(a.nick, b.first)) ||
    (b.nick && substringMatch(a.first, b.nick)) ||
    // handle small typos e.g. Jones == Jonas, Jonnes
    levenshtein(a.first, b.first) < 2
  );
}

function middleNamesMatch(a: string, b: string): boolean {
  const aMiddles = a.split(' ');
  const bMiddles = b.split(' ');

  if (aMiddles.length === 0 || bMiddles.length === 0) {
    return true;
  }

  for (const aMiddle of aMiddles) {
    for (const bMiddle of bMiddles) {
      // handle middle initial vs. full middle name
      if (substringMatch(aMiddle, bMiddle)) {
        return true;
      }
    }
  }

  return false;
}

function lastNamesMatch(a: string, b: string) {
  const aLasts = a.split('-');
  const bLasts = b.split('-');

  for (const aLast of aLasts) {
    for (const bLast of bLasts) {
      if (levenshtein(aLast, bLast) < 2) {
        return true;
      }
    }
  }

  return false;
}

export function _namesRepresentSamePerson(a: string, b: string) {
  const x = nameToParts(a);
  const y = nameToParts(b);

  // if no first name, require both to specify nickname or first name to match nickname
  if (
    (!x.first && x.nick && !y.nick && !substringMatch(x.nick, y.first)) ||
    (!y.first && y.nick && !x.nick && !substringMatch(y.nick, x.first))
  ) {
    return false;
  }

  if (
    firstNamesMatch(x, y) &&
    middleNamesMatch(x.middle, y.middle) &&
    lastNamesMatch(x.last, y.last)
  ) {
    return true;
  }

  return false;
}

// const RE_STRICT_NON_LETTERS = XRegExp('(?=[^\\pL]+)', 'g');

const RE_SPLIT_CAPS = XRegExp('(?<=[a-z])(?=[A-Z])', 'g');

function splitSmooshedNames(name: string) {
  const parts = name.split(RE_SPLIT_CAPS);
  let unsmooshed = '';

  for (const part of parts) {
    unsmooshed += part;

    if (!endsWith(part.toLowerCase(), 'mc') && !endsWith(part.toLowerCase(), 'mac')) {
      unsmooshed += ' ';
    }
  }

  return unsmooshed.trim();
}

const RE_TWO_LAST_NAMES = XRegExp('^\\pL+\\s+\\pL+,');
const RE_TWO_LAST_NAMES_REPLACE = XRegExp('^(\\pL+)\\s+(\\pL+)(?=,)');

export function getPermutations(name: string) {
  const permutations = [name];
  const unsmooshed = splitSmooshedNames(name);

  if (unsmooshed) {
    permutations.push(unsmooshed);

    if (RE_TWO_LAST_NAMES.test(unsmooshed)) {
      permutations.push(XRegExp.replace(unsmooshed, RE_TWO_LAST_NAMES_REPLACE, '$1-$2'));
    }
  }

  return new Set(permutations);
}

export function namesRepresentSamePerson(a: string, b: string): boolean {
  for (const aPermutation of getPermutations(a)) {
    for (const bPermutation of getPermutations(b)) {
      if (_namesRepresentSamePerson(aPermutation, bPermutation)) {
        return true;
      }
    }
  }

  return false;
}

export function arraySimilarity(a: any[], b: any[]): number {
  let matches = 0;

  for (const item of a) {
    if (b.includes(item)) {
      matches++;
    }
  }

  return matches / Math.max(a.length, b.length);
}

export function metaphones(name: string): string[] {
  return name
    .trim()
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => doubleMetaphone(part)[0]);
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CONSONANTS = 'bcdfghjklmnpqrstvwxyz'.split('');
const NUMBERS = '0123456789'.split('');
const VOWELS = 'aeiou'.split('');

const CONSONANT_OFFSET = randomInRange(1, CONSONANTS.length - 1);
const DATE_OFFSET = randomInRange(1, 364);
const NUMBER_OFFSET = randomInRange(1, NUMBERS.length - 1);
const VOWEL_OFFSET = randomInRange(1, VOWELS.length - 1);

function isConsonant(string: string): boolean {
  return CONSONANTS.includes(string);
}

function isDigit(string: string): boolean {
  return NUMBERS.includes(string);
}

function isVowel(string: string): boolean {
  return VOWELS.includes(string);
}

export function obfuscateString(string: string): string {
  let obfuscated = '';

  for (const letter of string) {
    const isCapital = letter.toUpperCase() === letter;
    const capitalizationFunction = isCapital ? 'toUpperCase' : 'toLowerCase';
    const lowercaseLetter = letter.toLowerCase();

    if (isVowel(lowercaseLetter)) {
      obfuscated += VOWELS[(VOWELS.indexOf(lowercaseLetter) + VOWEL_OFFSET) % VOWELS.length][
        capitalizationFunction
      ]();
    } else if (isConsonant(lowercaseLetter)) {
      obfuscated += CONSONANTS[
        (CONSONANTS.indexOf(lowercaseLetter) + CONSONANT_OFFSET) % CONSONANTS.length
      ][capitalizationFunction]();
    } else {
      obfuscated += letter;
    }
  }

  return obfuscated;
}

export function obfuscateNumber(number: number | string): string {
  let obfuscated = '';

  for (const digit of number.toString()) {
    if (isDigit(digit)) {
      obfuscated += NUMBERS[(NUMBERS.indexOf(digit) + NUMBER_OFFSET) % NUMBERS.length];
    } else {
      obfuscated += digit;
    }
  }

  return obfuscated;
}

export function obfuscateDate(date: string): string {
  return moment(date).subtract(DATE_OFFSET, 'days').format(DATE_FORMAT_DISPLAY);
}
