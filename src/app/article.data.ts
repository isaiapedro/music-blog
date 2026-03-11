export interface Article {
  id: number;
  title: string;
  keywords: string;
  image: string;
  description: string;
  date: string;
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    title: 'The Evolution of Music Genres: A Journey Through Time',
    keywords: 'music, genres, evolution, history, culture',
    image: 'https://i.scdn.co/image/ab67616d0000b273ad27e16c5f844ea1ad6797cd',
    description: 'Explore the fascinating evolution of music genres, from classical to contemporary, and how they have shaped our cultural landscape.',
    date: '2026-10-01'
  },
  {
    id: 2,
    title: 'The Art of Album Cover Design: Visual Storytelling in Music',
    keywords: 'album cover, design, art, music, visual storytelling',
    image: 'https://i.scdn.co/image/ab67616d0000b273ad27e16c5f844ea1ad6797cd',
    description: 'Discover the art of album cover design and how it serves as a powerful medium for visual storytelling in the music industry.',
    date: '2026-10-15'
  },
  {
    id: 3,
    title: 'The Role of Music in Mental Health: Healing Through Sound',
    keywords: 'music, mental health, healing, therapy, sound',
    image: 'https://i.scdn.co/image/ab67616d0000b273ad27e16c5f844ea1ad6797cd',
    description: 'Learn about the therapeutic benefits of music and how it can play a crucial role in improving mental health and well-being.',
    date: '2026-11-01'
  },
  {
    id: 4,
    title: 'The Influence of Technology on Music Production: From Analog to Digital',
    keywords: 'technology, music production, analog, digital, innovation',
    image: 'https://i.scdn.co/image/ab67616d0000b273ad27e16c5f844ea1ad6797cd',
    description: 'Examine the profound influence of technology on music production, tracing the transition from analog to digital and its impact on creativity.',
    date: '2026-11-15'
  }
];