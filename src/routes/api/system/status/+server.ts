/**
 * /api/system/status — Debug endpoint untuk memantau status semua layer infrastruktur
 *
 * GET /api/system/status
 * Mengembalikan status:
 *   - ProxyPool (total, aktif, cooldown)
 *   - FlareSolverr availability
 *   - SessionStore (Redis / in-memory)
 *   - Circuit breakers
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { proxyPool } from '$lib/server/proxy-pool';
import { isFlareSolverrAvailable } from '$lib/server/flaresolverr';
import { sessionStore } from '$lib/server/session-store';

export const GET: RequestHandler = async () => {
  const [flareAvailable, sessionCount] = await Promise.all([
    isFlareSolverrAvailable(),
    sessionStore.size()
  ]);

  return json({
    timestamp: new Date().toISOString(),
    proxyPool: proxyPool.status(),
    flaresolverr: {
      available: flareAvailable,
      purpose: 'Bypass Cloudflare UAM / Turnstile'
    },
    sessionStore: {
      backend: sessionStore.isRedisConnected() ? 'redis' : 'in-memory-lru',
      entriesCount: sessionCount
    }
  });
};
