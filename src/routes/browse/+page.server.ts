import type { PageServerLoad } from './$types';
import { searchAnime } from '$lib/server/anilist';

export const load: PageServerLoad = async ({ url }) => {
  const search = url.searchParams.get('search') || undefined;
  const genre = url.searchParams.get('genre') || undefined;
  const format = url.searchParams.get('format') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const season = url.searchParams.get('season') || undefined;
  const yearStr = url.searchParams.get('year');
  const sort = url.searchParams.get('sort') || 'POPULARITY_DESC';
  const pageStr = url.searchParams.get('page');

  const year = yearStr ? parseInt(yearStr) : undefined;
  const page = pageStr ? parseInt(pageStr) : 1;

  const result = await searchAnime(search, genre, format, status, season, year, sort, page);

  return {
    items: result.media || [],
    pageInfo: result.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
    filters: { search, genre, format, status, season, year, sort, page }
  };
};
