export interface ReviewComment {
  user: string;
  text: string;
  date: string;
}

export interface SimilarAlbum {
  id: number;
  album: string;
  artist: string;
  image: string;
}

export type BreakdownBlockType = 'paragraph' | 'image' | 'music';

export interface BreakdownBlock {
  type: BreakdownBlockType;
  title?: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  spotifyId?: string;
  youtubeMusicId?: string;
}

export interface ReviewContent {
  id: number;
  slug?: string;
  album: string;
  artist: string;
  image: string;
  releaseDate: number | string;
  label: string;
  genre: string;
  description: string;
  context: string;
  introduction: string;
  breakdown: BreakdownBlock[];
  conclusion: string;
  similarAlbums: SimilarAlbum[];
  comments: ReviewComment[];
}

export interface ReviewListMeta {
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

export interface CmsPayload {
  reviews: ReviewContent[];
  listMeta: ReviewListMeta[];
}