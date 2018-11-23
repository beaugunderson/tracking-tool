// @flow

import { userFilePath } from './store';

const DataStore = window.require('nedb');

export const openEncounters = () =>
  new DataStore({
    autoload: true,
    filename: userFilePath('encounters.json')
  });
