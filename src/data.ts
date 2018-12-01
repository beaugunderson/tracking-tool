import { userFilePath } from './store';

const DataStore = window.require('nedb');

export const openEncounters = () =>
  new DataStore({
    autoload: true,
    compareStrings: (a: string, b: string) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    },
    filename: userFilePath('encounters.json'),
    timestampData: true
  });
