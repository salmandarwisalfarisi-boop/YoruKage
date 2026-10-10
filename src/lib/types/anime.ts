export interface Title {
  romaji?: string;
  english?: string;
  native?: string;
  userPreferred: string;
}

export interface CoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string;
}

export interface NextAiringEpisode {
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export interface StudioNode {
  name: string;
}

export interface CharacterNode {
  id: number;
  name: { full: string };
  image: { large: string };
}

export interface CharacterEdge {
  node: CharacterNode;
  role: string;
}

export interface RecommendationNode {
  mediaRecommendation?: AnimeMedia;
}

export interface AnimeMedia {
  id: number;
  idMal?: number;
  title: Title;
  coverImage: CoverImage;
  bannerImage?: string;
  format?: string;
  status?: string;
  episodes?: number;
  duration?: number;
  season?: string;
  seasonYear?: number;
  startDate?: { year?: number; month?: number; day?: number };
  averageScore?: number;
  popularity?: number;
  genres: string[];
  description?: string;
  nextAiringEpisode?: NextAiringEpisode;
  studios?: { nodes: StudioNode[] };
  trailer?: { id?: string; site?: string };
  characters?: { edges: CharacterEdge[] };
  recommendations?: { nodes: RecommendationNode[] };
}

export interface AiringScheduleItem {
  id: number;
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
  media: AnimeMedia;
}

export interface HomeData {
  trending: AnimeMedia[];
  seasonal: AnimeMedia[];
  popular: AnimeMedia[];
  top10: AnimeMedia[];
  movies: AnimeMedia[];
  upcoming: AnimeMedia[];
  featured: AnimeMedia | null;
}
