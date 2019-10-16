export const USERNAMES = {
  birdre1: 'Rebekah Wyse',
  blacex1: 'Eowyn Black',
  coxxra2: 'Rachel Cox',
  delame1: 'Marie Kong',
  farise1: 'Sylvia Farias',
  fillmx1: 'Mark Filler',
  foxxva1: 'Vivian Foxx',
  goodmx1: 'Morgan Goodney',
  'john.d.gonzales': 'John Gonzales',
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
  'rodney.antonson': 'Rodney Antonson',
  semasl1: 'Sharla Semana',
  stracp1: 'Carolyn Maret',
  stramr3: 'Meg Strader',
  tennta1: 'Tyne Tennyson-Ray',
  torrdc1: 'Danielle McLaughlin',
  yangge1: 'Grace Yang',
  yangvf1: 'Vickie Yang',

  // development users
  beau: 'Beau Gunderson',
  carynstewart: 'Caryn Stewart'
};

export const INTERNS = [
  'goodmx1',
  'john.d.gonzales',
  'jonasa1',
  'kanedp2',
  'maysam1',
  'montme1',
  'n6335348',
  'n7867222',
  'pughat1',
  'rodney.antonson'
];

export function usernameToName(username: string) {
  return USERNAMES[username.toLowerCase()] || username.toLowerCase();
}
