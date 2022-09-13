import moment from 'moment';

export const USERNAMES = {
  'ailish.mackey': 'Ailish Mackey',
  'araceli.tovarcarrill': 'Araceli Tovar Carrillo',
  'chelsea.gault': 'Chelsea Gault',
  'eileen.bilynsky': 'Eileen Bilynsky',
  'gretchen.hoyum': 'Gretchen Hoyum',
  'hannah.sjogren': 'Hannah Sjogren',
  'heather.shin': 'Heather Shin',
  'john.d.gonzales': 'John Gonzales',
  'lucy.gunter': 'Lacy Gunter',
  'lauren.zemer': 'Lauren Zemer',
  'linsey.hunt': 'Linsey Hunt',
  'marilyn.oakes-greens': 'Marilyn Oakes-Greenspan',
  'patrick.stephens': 'Patrick Stephens',
  'rodney.antonson': 'Rodney Antonson',
  'shanna.sexton': 'Zoe Sexton',
  'steven.robinson': 'Steven Robinson',
  'zhaoyang.xie': 'Dora Xie',
  birdre1: 'Rebekah Wyse',
  blacex1: 'Eowyn Black',
  coxxra2: 'Rachel Cox',
  delame1: 'Marie Kong',
  farise1: 'Sylvia Farias',
  fillmx1: 'Mark Filler',
  fletel2: 'Emili Fletcher',
  foxxva1: 'Vivian Foxx',
  goodmx1: 'Morgan Goodney',
  johnss1: 'Sandra Johnson',
  jonasa1: 'Samuel Jonas',
  kanedp2: 'Daniel Kane',
  lindce2: 'Caryn Stewart',
  mastsr1: 'Sharon Mast',
  maysam1: 'Ariel Mays-Lewis',
  mednnb1: 'Nancy Mednick',
  montme1: 'Maya Montemayor',
  n6335348: 'Caitlin Minniear',
  n7867222: 'Katherine Smith',
  nordje1: 'Jennifer Nordstrom-Lozano',
  p480265: 'Drew Pierce-Street',
  philcm1: 'Courtney Phillips-Youman',
  pughat1: 'Alan Pugh',
  riormp1: 'Maxine Riordan',
  selbse1: 'Sandra Selby',
  semasl1: 'Sharla Semana',
  smithk: 'Katherine Smith',
  stracp1: 'Carolyn Maret',
  stramr3: 'Meg Strader',
  tennta1: 'Tyne Tennyson-Ray',
  torrdc1: 'Danielle McLaughlin',
  yangge1: 'Grace Yang',
  yangvf1: 'Vickie Yang',

  // development users
  beau: 'Beau Gunderson',
  carynstewart: 'Caryn Stewart',
};

export const INTERNS = [
  'ailish.mackey',
  'araceli.tovarcarrill',
  'goodmx1',
  'gretchen.hoyum',
  'john.d.gonzales',
  'jonasa1', // December 7th Sam becomes a non-intern
  'kanedp2',
  'lauren.zemer',
  'linsey.hunt',
  'maysam1',
  'montme1',
  'n6335348',
  'n7867222',
  'patrick.stephens', // Becomes a non-intern 6/19/2021
  'pughat1',
  'rodney.antonson',
  'shanna.sexton',
  'smithk',
];

export function isIntern(username: string | null, date: moment.Moment): boolean {
  const lowercaseUsername = (username || '').toLowerCase();

  if (lowercaseUsername === 'jonasa1' && date.isAfter(moment('12/6/2020'))) {
    return false;
  }

  if (lowercaseUsername === 'patrick.stephens' && date.isAfter(moment('6/19/2021'))) {
    return false;
  }

  if (lowercaseUsername === 'ailish.mackey' && date.isAfter(moment('8/20/2022'))) {
    return false;
  }

  if (lowercaseUsername === 'lauren.zemer' && date.isAfter(moment('8/20/2022'))) {
    return false;
  }

  return INTERNS.includes(lowercaseUsername);
}

export function usernameToName(username: string) {
  return USERNAMES[username.toLowerCase()] || username.toLowerCase();
}
