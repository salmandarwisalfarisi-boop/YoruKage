/**
 * /api/anime/pahe/extract — Endpoint untuk mengekstrak direct stream URL dari Kwik
 * Updated: menggunakan pipeline Kwik v2 (deobfuscator + flaresolverr + proxy)
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { extractKwikStream } from '$lib/server/animepahe/kwik';
import { clientKey, rateLimit } from '$lib/server/rate-limit';

export const GET: RequestHandler = async ({ url, request }) => {
  if (!rateLimit(`pahe:extract:${clientKey(request, 'unknown')}`, 30, 60_000)) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }

  const kwikUrl = url.searchParams.get('url')?.trim() || '';
  if (!kwikUrl || !/^https?:\/\/(?:www\.)?kwik\.(?:cx|si|net|com)\//i.test(kwikUrl)) {
    return json({ error: 'Valid Kwik URL is required' }, { status: 400 });
  }

  try {
    const result = await extractKwikStream(kwikUrl);
    return json({
      streamUrl: result.streamUrl,
      token: result.token,
      expiresAt: result.expiresAt,
      fromCache: result.fromCache,
      techniques: result.techniques,
      fingerprint: result.fingerprint
    });
  } catch (error: any) {
    console.error('[/api/anime/pahe/extract]', error?.message || error);
    return json({ error: error?.message || 'Failed to extract stream from Kwik' }, { status: 502 });
  }
};
