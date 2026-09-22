import { serverCache } from './cache';
import type { AnimeMedia, HomeData, AiringScheduleItem } from '$lib/types/anime';

const ANILIST_URL = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native userPreferred }
  coverImage { extraLarge large color }
  bannerImage
  format
  status
  episodes
  duration
  season
  seasonYear
  averageScore
  popularity
  genres
  description(asHtml: false)
  nextAiringEpisode { episode airingAt timeUntilAiring }
`;

export async function fetchAniList<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const cacheKey = JSON.stringify({ query, variables });

  if (serverCache.hasValid(cacheKey)) {
    return serverCache.get<T>(cacheKey)!;
  }

  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('AniList API error:', res.status, errorText);
      const stale = serverCache.get<T>(cacheKey);
      if (stale) return stale;
      throw new Error(`AniList HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) {
      console.error('AniList GraphQL errors:', json.errors);
      const stale = serverCache.get<T>(cacheKey);
      if (stale) return stale;
      throw new Error(json.errors[0]?.message || 'GraphQL Error');
    }

    const data = json.data;
    // Cache for default 1 hour
    serverCache.set(cacheKey, data, 3600);
    return data;
  } catch (err) {
    console.error('AniList fetch failed:', err);
    const stale = serverCache.get<T>(cacheKey);
    if (stale) return stale;
    throw err;
  }
}

export async function getHomeData(): Promise<HomeData> {
  const query = `
    query HomeQuery($season: MediaSeason, $seasonYear: Int) {
      trending: Page(page: 1, perPage: 12) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
      seasonal: Page(page: 1, perPage: 12) {
        media(sort: POPULARITY_DESC, type: ANIME, season: $season, seasonYear: $seasonYear, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
      popular: Page(page: 1, perPage: 12) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
      top10: Page(page: 1, perPage: 10) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
      movies: Page(page: 1, perPage: 10) {
        media(sort: POPULARITY_DESC, type: ANIME, format: MOVIE, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
      upcoming: Page(page: 1, perPage: 12) {
        media(sort: POPULARITY_DESC, type: ANIME, status: NOT_YET_RELEASED, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  // Calculate current season & year
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let season = 'FALL';
  if (month >= 0 && month <= 2) season = 'WINTER';
  else if (month >= 3 && month <= 5) season = 'SPRING';
  else if (month >= 6 && month <= 8) season = 'SUMMER';

  const data = await fetchAniList(query, { season, seasonYear: year });

  const trendingList: AnimeMedia[] = data?.trending?.media || [];
  const featured = trendingList.length > 0 ? trendingList[0] : null;

  return {
    trending: trendingList,
    seasonal: data?.seasonal?.media || [],
    popular: data?.popular?.media || [],
    top10: data?.top10?.media || [],
    movies: data?.movies?.media || [],
    upcoming: data?.upcoming?.media || [],
    featured
  };
}

export async function getAnimeDetails(id: number): Promise<AnimeMedia | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        studios(isMain: true) { nodes { name } }
        trailer { id site }
        characters(sort: [ROLE, RELEVANCE], perPage: 12) {
          edges {
            node { id name { full } image { large } }
            role
          }
        }
        recommendations(perPage: 6) {
          nodes {
            mediaRecommendation {
              id
              title { romaji english native userPreferred }
              coverImage { extraLarge large color }
              format
              status
              episodes
              averageScore
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { id });
  return data?.Media || null;
}

export async function searchAnime(
  search?: string,
  genre?: string,
  format?: string,
  status?: string,
  season?: string,
  year?: number,
  sort: string = 'POPULARITY_DESC',
  page: number = 1
) {
  const query = `
    query ($page: Int, $search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $year: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: 24) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(search: $search, genre: $genre, format: $format, status: $status, season: $season, seasonYear: $year, sort: $sort, type: ANIME, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, any> = { page, sort: [sort] };
  if (search && search.trim()) variables.search = search.trim();
  if (genre) variables.genre = genre;
  if (format) variables.format = format;
  if (status) variables.status = status;
  if (season) variables.season = season;
  if (year) variables.year = year;

  const data = await fetchAniList(query, variables);
  return data?.Page || { pageInfo: {}, media: [] };
}

export async function getAiringSchedule(weekStartTimestamp: number, weekEndTimestamp: number) {
  const query = `
    query ($weekStart: Int, $weekEnd: Int) {
      Page(page: 1, perPage: 100) {
        airingSchedules(airingAt_greater: $weekStart, airingAt_lesser: $weekEnd, sort: TIME) {
          id
          airingAt
          timeUntilAiring
          episode
          media {
            ${MEDIA_FIELDS}
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { weekStart: weekStartTimestamp, weekEnd: weekEndTimestamp });
  return (data?.Page?.airingSchedules || []) as AiringScheduleItem[];
}
