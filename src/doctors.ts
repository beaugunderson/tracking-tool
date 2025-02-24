type Doctor = {
  text: string;
  value?: string;
  inactive?: boolean;
};

export const RAW_DOCTORS: readonly Doctor[] = [
  { text: 'Agena, Joanna', inactive: true },
  { text: 'Alassas, Mohamed' },
  { text: 'Alshaban, Ahmed' },
  { text: 'Aye, Ralph' },
  { text: 'Barnett, Todd' },
  { text: 'Barr, Darlene' },
  { text: 'Bastawrous, Amir' },
  { text: 'Batchelder, Ami', inactive: true },
  { text: 'Benitez Kruidenier, Sandra', inactive: true },
  { text: 'Benkers, Tara', inactive: true },
  { text: 'Bensinger, William', inactive: true },
  { text: 'Bhark, Sandy' },
  { text: 'Blanshan, Stephanie', inactive: true },
  { text: 'Bograd, Adam' },
  { text: 'BonDurant, Amy' },
  { text: 'Bonis, William' },
  { text: 'Boxwell, Anthony' },
  { text: 'Brashears, James' },
  { text: 'Brower, Jessica' },
  { text: 'Brown, Thomas', inactive: true },
  { text: 'Buchanan, Claire', inactive: true },
  { text: 'Buscariollo, Daniela', value: 'Buscariolo, Daniela' },
  { text: 'Caraway, Megan' },
  { text: 'Carlin, Delainey' },
  { text: 'Chen, Grace' },
  { text: 'Chitila, Phoebe' },
  { text: 'Clay, Martha', inactive: true },
  { text: 'Cobbs, Charles' },
  { text: 'Cram, Samantha' },
  { text: 'Crown, Angelena', value: 'Crown, Angelina' },
  { text: 'Deshmukh, Abhijit' },
  { text: 'Devarakonda Siddhartha' },
  { text: 'Dong, David', inactive: true },
  { text: 'Douglas, Robert' },
  { text: 'Drescher, Charles' },
  { text: 'Dunleavy, Vanessa' },
  { text: 'Eaton, Lindsey' },
  { text: 'Eden, Michelle' },
  { text: 'Egan, Dan' },
  { text: 'Ellis, Erin' },
  { text: 'Eulau, Stephen' },
  { text: 'Face, Nicole' },
  { text: 'Fang, Christine' },
  { text: 'Farivar, Alexander' },
  { text: 'Fer, Mehmet', inactive: true },
  { text: 'File, Danielle' },
  { text: 'Gensert, Emma', value: 'Thomas, Emma', inactive: true },
  { text: 'Gilbert, Christopher' },
  { text: 'Glennie, Sonia' },
  { text: 'Gold, Philip' },
  { text: 'Goldberg, Sheldon' },
  { text: 'Golden, Joseph' },
  { text: 'Goldie, Christina (Christa)', inactive: true },
  { text: 'Gorden, Jed' },
  { text: 'Grethlein, Sara Jo' },
  { text: 'Griffin, John' },
  { text: 'Grob, Emily' },
  { text: 'Groves, Kashina' },
  { text: 'Han, Michelle' },
  { text: 'Hawkins, Melinda' },
  { text: 'Hegerova, Livia', inactive: true },
  { text: 'Hendershott, Karen', inactive: true },
  { text: 'Henson, John' },
  { text: 'Herbert Aliea' },
  { text: 'Herring, Vanessa' },
  { text: 'Hinzey, Adam' },
  { text: 'Holdread, Heather', inactive: true },
  { text: 'Hough, Katherine' },
  { text: 'Hu, Sherry' },
  { text: 'Huang, Jennifer' },
  { text: 'Ivory, Rebecca' },
  { text: 'Johnston, Eileen' },
  { text: 'Kaplan, Henry (Hank)', inactive: true },
  { text: 'Keo, Sarith' },
  { text: 'Kerekes, Kristen' },
  { text: 'Khan, Nadia' },
  { text: 'Kim, Namou' },
  { text: 'Kim, Patricia' },
  { text: 'Klein, Phyllis' },
  { text: 'Kratz, Rodney' },
  { text: 'Landis, Daniel' },
  { text: 'Lazarus, Laura' },
  { text: 'Lee, Christine' },
  { text: 'Lee, Douglas' },
  { text: 'Lee, Ellyn' },
  { text: 'Lindsley, Skylar' },
  { text: 'Loiselle, Christopher' },
  { text: 'Lopez, Jay' },
  { text: 'Lott, Jenny' },
  { text: 'Louie, Brian' },
  { text: 'Lynn, Cecilia' },
  { text: 'Mackay, Emily' },
  { text: 'Marrs, Jessie' },
  { text: 'Mawad, Raya' },
  { text: 'McConnell, Christina' },
  { text: 'McCormick, Kinsey' },
  { text: 'McGehee, Elizabeth' },
  { text: 'Mehta, Vivek' },
  { text: 'Meier, Robert' },
  { text: 'Menon, Raman' },
  { text: 'Milhoan, Linda' },
  { text: 'Montgomery, Susan' },
  { text: 'Moore, David', inactive: true },
  { text: 'Morgan, Amy' },
  { text: 'Morris, Astrid' },
  { text: 'Mrozinski, Yuiho Walker' },
  { text: 'Muggoch, Nancy', inactive: true },
  { text: 'Musa, Fernanda' },
  { text: 'Namburi, Swathi' },
  { text: 'Ochsner, Alyssa' },
  { text: 'Ong, Evan' },
  { text: 'Pagel, John', inactive: true },
  { text: 'Paget, Ellen' },
  { text: 'Palmer, Martin' },
  { text: 'Park, Min' },
  { text: 'Parker, Julia' },
  { text: 'Passalaris, Tina' },
  { text: 'Patel, Krish' },
  { text: 'Patel, Mona' },
  { text: 'Patterson-Lawlor, Kelli' },
  { text: 'Paulson, Kelly' },
  { text: 'Peters, William' },
  { text: 'Peterson, K.L.' },
  { text: 'Pollock, Darren' },
  { text: 'Press, Joshua' },
  { text: 'Quam, Nicholas' },
  { text: 'Rana, Fauzia', inactive: true },
  { text: 'Ranker, Elizabeth' },
  { text: 'Reddy, Aruna' },
  { text: 'Rhieu, Andrew' },
  { text: 'Rinn, Kristine', inactive: true },
  { text: 'Robin, Jeffrey', inactive: true },
  { text: 'Rogers, Jeffrey' },
  { text: 'Romine, Perrin' },
  { text: 'Ryu, Lio' },
  { text: 'Sarkar, Reith' },
  { text: 'Sceats, Lindsay' },
  { text: 'Schaffel, Stephanie' },
  { text: 'Schwede Matthew' },
  { text: 'Shah, Chirag' },
  { text: 'Shango, Maryann', inactive: true },
  { text: 'Sharma, Nancy' },
  { text: 'Sharma, Subhash' },
  { text: 'Simmons, Forrest', inactive: true },
  { text: 'Smith, Spencer' },
  { text: 'Sniezek, Joseph' },
  { text: 'Solanki, Krupa', value: 'Solanki, Kupra' },
  { text: 'Spiegel, James' },
  { text: 'Subramaniam, Somasundaram (Soma)' },
  { text: 'Takamiya, Robert' },
  { text: 'Tierney, Shannon', inactive: true },
  { text: 'Tiu, Maitram Christine', inactive: true },
  { text: 'Trotter, Jacob' },
  { text: 'Tsai, Michaela' },
  { text: 'Vallieres, Eric' },
  { text: 'Vaynshteyn, Rostislav' },
  { text: 'Veljovich, Dan' },
  { text: 'Vermeulen, Sandra' },
  { text: 'Vyas, Shilpa' },
  { text: 'Wahl, Tanya' },
  { text: 'Walsh, Nathan' },
  { text: 'Ward, Jeffery', inactive: true },
  { text: 'West, Howard (Jack)', inactive: true },
  { text: 'White, Peter' },
  { text: 'Wignall, Aiza' },
  { text: 'Wilcox, Kristin' },
  { text: 'Wulff, Jennifer', inactive: true },
  { text: 'Xie, Bin' },
  { text: 'Yan, Fengting' },
  { text: 'Zhao, Meng' },
  { text: 'Zhao, Song' },
  { text: 'Zucker, David' },
  //
  // Unassigned should be last
  //
  { text: 'Unassigned' },
] as const;

export const DOCTORS: Doctor[] = RAW_DOCTORS.map((doctor) => ({
  ...doctor,
  value: doctor.value || doctor.text,
}));

export function isInactive(value: string) {
  if (DOCTORS.find((doctor) => doctor.value === value && doctor.inactive)) {
    return true;
  }

  return false;
}
