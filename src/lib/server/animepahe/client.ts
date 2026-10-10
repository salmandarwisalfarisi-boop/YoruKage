import { env } from '$env/dynamic/private';
import { load } from 'cheerio';
import { initDohResolver } from '$lib/server/doh-resolver';
import { isFlareSolverrAvailable, fetchWithCloudflareBypass } from '$lib/server/flaresolverr';

// Aktifkan proteksi DoH untuk seluruh request AnimePahe
initDohResolver();

const ANIMEPAHE_BASE_URL = (env.ANIMEPAHE_BASE_URL || 'https://animepahe.ru').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = Number(env.ANIMEPAHE_TIMEOUT_MS || 15_000);
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface AnimePaheSearchResult {
  id: string;
  title: string;
  poster: string | null;
  type?: string;
  year?: number;
}

export interface AnimePaheEpisode {
  id: string;
  episode: number;
  title: string | null;
  snapshot: string | null;
  duration: number | null;
  filler: boolean;
}

export interface AnimePaheEpisodes {
  episodes: AnimePaheEpisode[];
  currentPage: number;
  lastPage: number;
  total: number;
}

export interface AnimePaheServer {
  id: string;
  label: string;
  quality: string | null;
  audio: string | null;
  url: string;
}

function assertValue(value: string, name: string): string {
  const result = value.trim();
  if (!result) throw new Error(`${name} must not be empty`);
  return result;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let lastError: unknown;
  const fullUrl = `${ANIMEPAHE_BASE_URL}${path}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      // 1. Coba fetch langsung terlebih dahulu
      const response = await fetch(fullUrl, {
        ...init,
        headers: {
          Accept: 'application/json, text/html;q=0.9, */*;q=0.8',
          'User-Agent': USER_AGENT,
          Referer: `${ANIMEPAHE_BASE_URL}/`,
          ...(init.headers || {})
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });

      if (response.ok) return response;

      // 2. Jika Cloudflare memblokir (403 atau 503), gunakan bypass FlareSolverr jika tersedia
      if ([403, 503].includes(response.status)) {
        if (await isFlareSolverrAvailable()) {
          console.log(`[AnimePahe] HTTP ${response.status} terdeteksi, mencoba bypass via FlareSolverr...`);
          const bypassed = await fetchWithCloudflareBypass(fullUrl, init);
          if (bypassed.ok) return bypassed;
        }
      }

      if (![408, 429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(`AnimePahe HTTP ${response.status}`);
      }
      lastError = new Error(`AnimePahe HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
  }

  throw lastError instanceof Error ? lastError : new Error('AnimePahe request failed');
}

function absoluteUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value, ANIMEPAHE_BASE_URL).href;
  } catch {
    return null;
  }
}

export async function searchAnime(query: string): Promise<AnimePaheSearchResult[]> {
  const search = assertValue(query, 'query');
  const response = await request(`/api?m=search&q=${encodeURIComponent(search)}`);
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload?.data;

  if (!Array.isArray(rows)) return [];

  return rows
    .map((item): AnimePaheSearchResult | null => {
      const id = String(item.session ?? item.id ?? '').trim();
      const title = String(item.title ?? item.name ?? '').trim();
      if (!id || !title) return null;

      return {
        id,
        title,
        poster: absoluteUrl(item.poster ?? item.image),
        type: item.type ? String(item.type) : undefined,
        year: Number.isFinite(Number(item.year)) ? Number(item.year) : undefined
      };
    })
    .filter((item): item is AnimePaheSearchResult => item !== null);
}

export async function getEpisodes(animeSession: string, page = 1): Promise<AnimePaheEpisodes> {
  const session = assertValue(animeSession, 'animeSession');
  if (!Number.isInteger(page) || page < 1) throw new Error('page must be a positive integer');

  const response = await request(
    `/api?m=release&id=${encodeURIComponent(session)}&sort=episode_asc&page=${page}`
  );
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload?.data;

  const episodes = (Array.isArray(rows) ? rows : [])
    .map((item): AnimePaheEpisode | null => {
      const id = String(item.session ?? item.id ?? '').trim();
      const episode = Number(item.episode);
      if (!id || !Number.isFinite(episode)) return null;

      return {
        id,
        episode,
        title: item.title ? String(item.title) : null,
        snapshot: absoluteUrl(item.snapshot ?? item.image),
        duration: Number.isFinite(Number(item.duration)) ? Number(item.duration) : null,
        filler: Boolean(item.filler)
      };
    })
    .filter((item): item is AnimePaheEpisode => item !== null);

  const lastPage = Number(payload?.last_page ?? payload?.lastPage ?? payload?.pagination?.last_page);
  const total = Number(payload?.total ?? payload?.pagination?.total);

  return {
    episodes,
    currentPage: page,
    lastPage: Number.isInteger(lastPage) && lastPage > 0 ? lastPage : page,
    total: Number.isFinite(total) ? total : episodes.length
  };
}

export async function getEpisodeServers(
  animeSession: string,
  episodeSession: string
): Promise<AnimePaheServer[]> {
  const anime = assertValue(animeSession, 'animeSession');
  const episode = assertValue(episodeSession, 'episodeSession');
  const response = await request(`/play/${encodeURIComponent(anime)}/${encodeURIComponent(episode)}`, {
    headers: { Accept: 'text/html,application/xhtml+xml' }
  });
  const html = await response.text();
  const $ = load(html);
  const servers: AnimePaheServer[] = [];

  $('#pickDownload a, [data-video-id], a[href*="kwik."] , a[href*="/e/"]').each((_, element) => {
    const node = $(element);
    const url = absoluteUrl(node.attr('href') ?? node.attr('data-src') ?? node.attr('data-video-url'));
    if (!url || !/^https?:\/\/(?:www\.)?kwik\.(?:cx|com)\//i.test(url)) return;
    if (servers.some((server) => server.url === url)) return;

    const label = node.text().replace(/\s+/g, ' ').trim() || node.attr('title') || 'Unknown';
    const quality = label.match(/(?:360|480|720|1080|1440|2160)p/i)?.[0] ?? null;
    const audio = /dub/i.test(label) ? 'dub' : /sub/i.test(label) ? 'sub' : null;

    servers.push({ id: `${servers.length}:${url}`, label, quality, audio, url });
  });

  return servers;
}
