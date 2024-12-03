import moment from 'moment';

export const USERNAMES = {
  'ailish.mackey': 'Ailish Mackey',
  'aimee.lybbert': 'Aimee Lybbert',
  'alice.allis': 'Alice Allis',
  'araceli.tovarcarrill': 'Araceli Tovar Carrillo',
  'beatrice.terino': 'Beatrice Terino',
  'carrie.mccolloch': 'Carrie McColloch',
  'chelsea.gault': 'Chelsea Gault',
  'christina.huebner': 'Christina Huebner',
  'eileen.bilynsky': 'Eileen Bilynsky',
  'erika.langmeyer': 'Erika Langmeyer',
  'gretchen.hoyum': 'Gretchen Hoyum',
  'hannah.sjogren': 'Hannah Sjogren',
  'heather.rowlett': 'Heather Rowlett',
  'heather.shin': 'Heather Shin',
  'john.d.gonzales': 'John Gonzales',
  'kristen.sievert': 'Kristen Sievert',
  'lauren.zemer': 'Lauren Zemer',
  'linsey.hunt': 'Linsey Hunt',
  'lucy.gunter': 'Lacy Gunter',
  'marilyn.oakes-greens': 'Marilyn Oakes-Greenspan',
  'morgan.heying': 'Morgan Heying',
  'patrick.stephens': 'Patrick Stephens',
  'rodney.antonson': 'Rodney Antonson',
  'sabrina.figueroa': 'Sabrina Figueroa',
  'shanna.sexton': 'Zoe Sexton',
  'shannon.youmans': 'Shannon Youmans',
  'steven.robinson': 'Steven Robinson',
  'trang.magahiz': 'Trang Magahiz',
  'zhaoyang.xie': 'Dora Xie',

  birdre1: 'Rebekah Wyse',
  blacex1: 'Eowyn Black',
  coxxra2: 'Rachel Cox',
  delame1: 'Marie Kong',
  farise1: 'Sylvia Farias',
  fillmx1: 'Mark Filler',
  fletel2: 'Emili Fletcher',
  foxxva1: 'Vivian Foxx',
  gheblx1: 'Luam Ghebrehiwet',
  goodmx1: 'Morgan Goodney',
  johnss1: 'Sandra Johnson',
  jonasa1: 'Samuel Jonas',
  kanedp2: 'Daniel Kane',
  khaxtt1: 'Trang Magahiz',
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
  'aimee.lybbert',
  'araceli.tovarcarrill',
  'beatrice.terino',
  'carrie.mccolloch',
  'christina.huebner',
  'erika.langmeyer',
  'gheblx1',
  'goodmx1',
  'gretchen.hoyum',
  'john.d.gonzales',
  'jonasa1',
  'kanedp2',
  'kristen.sievert',
  'lauren.zemer',
  'linsey.hunt',
  'maysam1',
  'montme1',
  'morgan.heying',
  'n6335348',
  'n7867222',
  'patrick.stephens',
  'pughat1',
  'rodney.antonson',
  'sabrina.figueroa',
  'shanna.sexton',
  'shannon.youmans',
  'smithk',
];

export function isIntern(username: string | null, encounterDate: string): boolean {
  const lowercaseUsername = (username || '').toLowerCase();
  const date = moment(encounterDate);

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

  if (lowercaseUsername === 'beatrice.terino' && date.isAfter(moment('6/30/2024'))) {
    return false;
  }

  if (lowercaseUsername === 'hannah.sjogren' && date.isAfter(moment('8/1/2024'))) {
    return false;
  }

  if (
    (lowercaseUsername === 'shannon.youmans' || lowercaseUsername === 'sabrina.figueroa') &&
    date.isAfter(moment('8/31/2024'))
  ) {
    return false;
  }

  return INTERNS.includes(lowercaseUsername);
}

export function usernameToName(username: string) {
  return USERNAMES[username.toLowerCase()] || username.toLowerCase();
}
