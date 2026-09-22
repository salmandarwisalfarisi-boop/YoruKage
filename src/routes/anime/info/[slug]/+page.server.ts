import type { PageServerLoad } from './$types';
import { getAnimeDetails } from '$lib/server/anilist';

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.slug);
  const media = await getAnimeDetails(id);
  return {
    media
  };
};
