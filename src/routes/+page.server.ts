import type { PageServerLoad } from './$types';
import { getHomeData } from '$lib/server/anilist';

export const load: PageServerLoad = async () => {
  try {
    const data = await getHomeData();
    return {
      trending: data.trending,
      seasonal: data.seasonal,
      popular: data.popular,
      top10: data.top10,
      movies: data.movies,
      upcoming: data.upcoming,
      featured: data.featured
    };
  } catch (err) {
    console.error('Failed to load homepage SSR data:', err);
    return {
      trending: [],
      seasonal: [],
      popular: [],
      top10: [],
      movies: [],
      upcoming: [],
      featured: null
    };
  }
};
