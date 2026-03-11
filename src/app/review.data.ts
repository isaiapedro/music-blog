export interface Review {
  id: number;
  album: string;
  artist: string;
  year: number;
  image: string;
  description: string;
  date: string;
  genres: string;
  subgenres: string;
  country: string;
}

export const REVIEWS: Review[] = [
  { 
    id: 1, 
    album: 'Eli And The Thirteenth Confession', 
    artist: 'Laura Nyro',
    year: 1968,
    image: 'https://i.scdn.co/image/57362d54bb8d4dc1137467bdc6242c9f563adcc0',
    description: 'Eli and the Thirteenth Confession is the second album by New York City-born singer, songwriter, and pianist Laura Nyro, released in 1968.',
    date: '2026-10-03',
    genres: 'Pop, Soul, Singer-Songwriter',
    subgenres: 'Pop Soul, Progressive Soul, Progressive Pop',
    country: 'US'
  },
  { 
    id: 2, 
    album: 'Listen Without Prejudice Vol. 1', 
    artist: 'George Michael',
    year: 1990,
    image: 'https://i.scdn.co/image/46fe08e9249442a3973f0fba948be3940c746956',
    description: 'Listen Without Prejudice Vol. 1 is the second solo studio album by the English singer-songwriter George Michael, released on 3 September 1990 by Columbia Records (Epic Records in the UK). The album was Michael´s final album of all-new material on Columbia until 2004´s Patience. ',
    date: '2026-11-03',
    genres: 'Pop, R&B, Singer-Songwriter',
    subgenres: 'Pop Soul, Sophisti-Pop, Singer-Songwriter, Contemporary R&B',
    country: 'UK'
  },
  { 
    id: 3, 
    album: 'Diamond Life', 
    artist: 'Sade',
    year: 1984,
    image: 'https://i.scdn.co/image/ab67616d0000b273ad27e16c5f844ea1ad6797cd',
    description: 'Diamond Life is the debut studio album by English band Sade, released in the United Kingdom on 16 July 1984 by Epic Records and in the United States on 27 February 1985 by Portrait Records. After studying fashion design, and later modelling, Sade Adu began backup-singing with British band Pride.',
    date: '2026-12-03',
    genres: 'Pop, Soul, Jazz',
    subgenres: 'Sophisti-Pop, Smooth Soul, Smooth Jazz',
    country: 'UK'
  },
  { 
    id: 4, 
    album: 'Out Of The Blue', 
    artist: 'Electric Light Orchestra',
    year: 1977,
    image: 'https://i.scdn.co/image/a6f64edd91bd69365e0862dd15570dc1bc7511ec',
    description: 'Out of the Blue is the seventh studio album by the British rock group Electric Light Orchestra (ELO), released in October 1977. Written and produced by ELO frontman Jeff Lynne, the double album is among the most commercially successful records in the group´s history, selling about 10 million copies worldwide by 2007.',
    date: '2026-13-03',
    genres: 'Pop, Rock',
    subgenres: 'Pop Rock, Symphonic Rock, Progressive Pop',
    country: 'UK'
  },
  {
    id: 5, 
    album: 'Bayou Country', 
    artist: 'Creedence Clearwater Revival',
    year: 1969,
    image: 'https://i.scdn.co/image/ea953711d7aee5d77ec89a3524eb1ca1913c4cbd',
    description: 'Bayou Country is the second studio album by American rock band Creedence Clearwater Revival, released by Fantasy Records in January 1969, and was the first of three albums CCR released in that year.',
    date: '2026-14-03',
    genres: 'Rock, Blues',
    subgenres: 'Swamp-Rock, Blues-Rock, Southern-Rock, Folk Rock',
    country: 'US'
  },
];