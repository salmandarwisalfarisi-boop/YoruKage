import type { PageServerLoad } from './$types';
import { getAnimeDetails } from '$lib/server/anilist';

export const load: PageServerLoad = async ({ params, url }) => {
  const id = parseInt(params.slug);
  const epParam = url.searchParams.get('ep');
  const ep = epParam ? parseInt(epParam) : 1;
  const media = await getAnimeDetails(id);

  return {
    media,
    currentEpisode: ep
  };
};
