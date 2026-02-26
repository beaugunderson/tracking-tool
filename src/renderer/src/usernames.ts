import { isAfter, parseISO } from 'date-fns';

export const USERNAMES = {
  'ailish.mackey': 'Ailish Mackey',
  'aimee.lybbert': 'Aimee Lybbert',
  'alice.allis': 'Alice Allis',
  'anna.yeom': 'Anna Yeom',
  'araceli.tovarcarrill': 'Araceli Tovar Carrillo',
  'beatrice.terino': 'Beatrice Terino',
  'carrie.mccolloch': 'Carrie McColloch',
  'chelsea.gault': 'Chelsea Gault',
  'christina.huebner': 'Christina Huebner',
  'dana.barnett1': 'Dana Barnett',
  'eileen.bilynsky': 'Eileen Bilynsky',
  'erika.langmeyer': 'Erika Langmeyer',
  'gretchen.hoyum': 'Gretchen Hoyum',
  'hannah.sjogren': 'Hannah Sjogren',
  'heather.rowlett': 'Heather Rowlett',
  'heather.shin': 'Heather Shin',
  'hillary.bucher-brown': 'Hillary Bucher-Brown',
  'john.d.gonzales': 'John Gonzales',
  'kristen.sievert': 'Kristen Sievert',
  'lauren.zemer': 'Lauren Zemer',
  'linsey.hunt': 'Linsey Hunt',
  'lucy.gunter': 'Lacy Gunter',
  'maia.bachman': 'Maia Bachman',
  'marilyn.oakes-greens': 'Marilyn Oakes-Greenspan',
  'morgan.heying': 'Morgan Heying',
  'patrick.stephens': 'Patrick Stephens',
  'rodney.antonson': 'Rodney Antonson',
  'sabrina.figueroa': 'Sabrina Figueroa',
  'samantha.theam': 'Samantha Theam',
  'shanna.sexton': 'Zoe Sexton',
  'shannon.youmans': 'Shannon Youmans',
  'shekinah.indrias': 'Shekinah Indrias',
  'steven.robinson': 'Steven Robinson',
  'tara.simmons': 'Tara Simmons',
  'trang.magahiz': 'Trang Magahiz',
  'xoe.amer': 'Xoe Amer',
  'yvonne.bergholm': 'Yvonne Bergholm',
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
  'dana.barnett1',
  'erika.langmeyer',
  'gheblx1',
  'goodmx1',
  'hannah.sjogren',
  'gretchen.hoyum',
  'hillary.bucher-brown',
  'john.d.gonzales',
  'jonasa1',
  'kanedp2',
  'kristen.sievert',
  'lauren.zemer',
  'linsey.hunt',
  'maia.bachman',
  'maysam1',
  'montme1',
  'morgan.heying',
  'n6335348',
  'n7867222',
  'patrick.stephens',
  'pughat1',
  'rodney.antonson',
  'sabrina.figueroa',
  'samantha.theam',
  'shanna.sexton',
  'shannon.youmans',
  'shekinah.indrias',
  'smithk',
  'tara.simmons',
  'xoe.amer',
  'yvonne.bergholm',
];

export function isIntern(username: string | null, encounterDate: string): boolean {
  const lowercaseUsername = (username || '').toLowerCase();
  const date = parseISO(encounterDate);

  if (lowercaseUsername === 'jonasa1' && isAfter(date, parseISO('2020-12-06'))) {
    return false;
  }

  if (lowercaseUsername === 'patrick.stephens' && isAfter(date, parseISO('2021-06-19'))) {
    return false;
  }

  if (lowercaseUsername === 'ailish.mackey' && isAfter(date, parseISO('2022-08-20'))) {
    return false;
  }

  if (lowercaseUsername === 'lauren.zemer' && isAfter(date, parseISO('2022-08-20'))) {
    return false;
  }

  if (lowercaseUsername === 'beatrice.terino' && isAfter(date, parseISO('2024-06-30'))) {
    return false;
  }

  if (lowercaseUsername === 'hannah.sjogren' && isAfter(date, parseISO('2024-08-01'))) {
    return false;
  }

  if (
    (lowercaseUsername === 'shannon.youmans' || lowercaseUsername === 'sabrina.figueroa') &&
    isAfter(date, parseISO('2024-08-31'))
  ) {
    return false;
  }

  return INTERNS.includes(lowercaseUsername);
}

export function usernameToName(username: string) {
  return USERNAMES[username.toLowerCase()] || username.toLowerCase();
}
