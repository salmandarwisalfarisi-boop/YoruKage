import { json, type RequestHandler } from '@sveltejs/kit';
import { getEpisodeServers } from '$lib/server/animepahe/client';
import { serverCache } from '$lib/server/cache';
import { clientKey, rateLimit } from '$lib/server/rate-limit';
import { circuitAllows, circuitFailure, circuitSuccess } from '$lib/server/circuit-breaker';

export const GET: RequestHandler = async ({ url, request }) => {
  if (!rateLimit(`pahe:servers:${clientKey(request, 'unknown')}`, 20, 60_000)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }
  const animeSession = url.searchParams.get('animeSession')?.trim() || '';
  const episodeSession = url.searchParams.get('epSession')?.trim() || '';
  if (!/^[\w-]+$/.test(animeSession) || !/^[\w-]+$/.test(episodeSession)) {
    return json({ error: 'valid animeSession and epSession are required' }, { status: 400 });
  }

  const key = `animepahe:servers:${animeSession}:${episodeSession}`;
  if (!circuitAllows('animepahe')) return json({ error: 'AnimePahe temporarily unavailable' }, { status: 503 });
  try {
    if (serverCache.hasValid(key)) return json({ data: serverCache.get(key) });
    const data = await getEpisodeServers(animeSession, episodeSession);
    serverCache.set(key, data, 120);
    circuitSuccess('animepahe');
    return json({ data });
  } catch (error) {
    circuitFailure('animepahe');
    const stale = serverCache.get(key);
    if (stale) return json({ data: stale, stale: true });
    console.error('AnimePahe servers error:', error);
    return json({ error: 'AnimePahe servers unavailable' }, { status: 502 });
  }
};
