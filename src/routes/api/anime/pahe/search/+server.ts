import { json, type RequestHandler } from '@sveltejs/kit';
import { searchAnime } from '$lib/server/animepahe/client';
import { serverCache } from '$lib/server/cache';
import { clientKey, rateLimit } from '$lib/server/rate-limit';
import { circuitAllows, circuitFailure, circuitSuccess } from '$lib/server/circuit-breaker';

export const GET: RequestHandler = async ({ url, request }) => {
  if (!rateLimit(`pahe:search:${clientKey(request, 'unknown')}`, 10, 60_000)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }
  const query = url.searchParams.get('query')?.trim() || '';
  if (query.length < 2 || query.length > 100) return json({ error: 'query must contain 2-100 characters' }, { status: 400 });

  const key = `animepahe:search:${query.toLowerCase()}`;
  if (!circuitAllows('animepahe')) return json({ error: 'AnimePahe temporarily unavailable' }, { status: 503 });
  try {
    if (serverCache.hasValid(key)) return json({ data: serverCache.get(key) });
    const data = await searchAnime(query);
    serverCache.set(key, data, 3600);
    circuitSuccess('animepahe');
    return json({ data });
  } catch (error) {
    circuitFailure('animepahe');
    const stale = serverCache.get(key);
    if (stale) return json({ data: stale, stale: true });
    console.error('AnimePahe search error:', error);
    return json({ error: 'AnimePahe search unavailable' }, { status: 502 });
  }
};
