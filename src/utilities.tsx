import doubleMetaphone from 'double-metaphone';
import moment from 'moment';
import { DATE_FORMAT_DISPLAY } from './constants';

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
    .replace(/,/g, '')
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
