import { json, type RequestHandler } from '@sveltejs/kit';
import { fetchAniList } from '$lib/server/anilist';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { query, variables } = await request.json();
    if (!query) {
      return json({ error: 'Query is required' }, { status: 400 });
    }
    const data = await fetchAniList(query, variables);
    return json({ data });
  } catch (err: any) {
    console.error('API GraphQL proxy error:', err);
    return json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
};
