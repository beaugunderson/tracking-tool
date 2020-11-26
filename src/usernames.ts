export const USERNAMES = {
  'araceli.tovarcarrill': 'Araceli Tovar Carrillo',
  'eileen.bilynsky': 'Eileen Bilynsky',
  'gretchen.hoyum': 'Gretchen Hoyum',
  'john.d.gonzales': 'John Gonzales',
  'patrick.stephens': 'Patrick Stephens',
  'rodney.antonson': 'Rodney Antonson',
  'shanna.sexton': 'Zoe Sexton',
  birdre1: 'Rebekah Wyse',
  blacex1: 'Eowyn Black',
  coxxra2: 'Rachel Cox',
  delame1: 'Marie Kong',
  farise1: 'Sylvia Farias',
  fillmx1: 'Mark Filler',
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
  'goodmx1',
  'john.d.gonzales',
  // TODO: will need to add an intern/employee date for interns that become employees
  'jonasa1', // December 7th Sam becomes a non-intern
  'kanedp2',
  'maysam1',
  'montme1',
  'n6335348',
  'n7867222',
  'pughat1',
  'rodney.antonson',
  'smithk',
];

export function usernameToName(username: string) {
  return USERNAMES[username.toLowerCase()] || username.toLowerCase();
}
