export interface Review {
  id: number;
  album: string;
  artist: string;
  image: string;
  releaseDate: number;
  label: string;
  genre: string;
  description: string;
  context: string;
  introduction: string;
  breakdown: string[];
  conclusion: string;
  similarAlbums: string[];
  comments: string[];
  date: string;
}