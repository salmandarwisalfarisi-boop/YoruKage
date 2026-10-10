import { json, type RequestHandler } from '@sveltejs/kit';
import { getEpisodes } from '$lib/server/animepahe/client';
import { serverCache } from '$lib/server/cache';
import { clientKey, rateLimit } from '$lib/server/rate-limit';
import { circuitAllows, circuitFailure, circuitSuccess } from '$lib/server/circuit-breaker';

export const GET: RequestHandler = async ({ url, request }) => {
  if (!rateLimit(`pahe:episodes:${clientKey(request, 'unknown')}`, 30, 60_000)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }
  const session = url.searchParams.get('session')?.trim() || '';
  const page = Number(url.searchParams.get('page') || 1);
  if (!session || !/^[\w-]+$/.test(session)) return json({ error: 'valid session is required' }, { status: 400 });
  if (!Number.isInteger(page) || page < 1 || page > 100) return json({ error: 'page must be 1-100' }, { status: 400 });

  const key = `animepahe:episodes:${session}:${page}`;
  if (!circuitAllows('animepahe')) return json({ error: 'AnimePahe temporarily unavailable' }, { status: 503 });
  try {
    if (serverCache.hasValid(key)) return json({ data: serverCache.get(key) });
    const data = await getEpisodes(session, page);
    serverCache.set(key, data, 600);
    circuitSuccess('animepahe');
    return json({ data });
  } catch (error) {
    circuitFailure('animepahe');
    const stale = serverCache.get(key);
    if (stale) return json({ data: stale, stale: true });
    console.error('AnimePahe episodes error:', error);
    return json({ error: 'AnimePahe episodes unavailable' }, { status: 502 });
  }
};
