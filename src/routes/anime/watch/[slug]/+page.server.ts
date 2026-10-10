import type { PageServerLoad } from './$types';
import { getAnimeDetails } from '$lib/server/anilist';
import { searchAnime, getEpisodes } from '$lib/server/animepahe/client';
import { serverCache } from '$lib/server/cache';

/** Fungsi skor kecocokan judul (sederhana, case-insensitive, tanpa regex) */
function titleMatchScore(candidate: string, reference: string): number {
  const a = candidate.toLowerCase().trim();
  const b = reference.toLowerCase().trim();
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  // Hitung kata yang sama
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = b.split(/\s+/);
  const matches = wordsB.filter((w) => wordsA.has(w)).length;
  return wordsB.length > 0 ? Math.round((matches / wordsB.length) * 60) : 0;
}

/** Ambil metadata mapping AniList ID -> TMDB/IMDb ID via AniZip */
async function getAnimeMappings(anilistId: number) {
  const cacheKey = `mapping:anizip:${anilistId}`;
  if (serverCache.hasValid(cacheKey)) {
    return serverCache.get<{ tmdbId: string | null; imdbId: string | null; type: string }>(cacheKey)!;
  }
  try {
    const res = await fetch(`https://api.ani.zip/mappings?anilist_id=${anilistId}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      const result = {
        tmdbId: data.mappings?.themoviedb_id ? String(data.mappings.themoviedb_id) : null,
        imdbId: data.mappings?.imdb_id ? String(data.mappings.imdb_id) : null,
        type: data.mappings?.type ? String(data.mappings.type) : 'TV'
      };
      serverCache.set(cacheKey, result, 86_400 * 7); // Cache 7 hari
      return result;
    }
  } catch (err) {
    console.warn(`[AniZip] Gagal fetch mapping untuk ${anilistId}:`, err);
  }
  return { tmdbId: null, imdbId: null, type: 'TV' };
}

export const load: PageServerLoad = async ({ params, url }) => {
  const id = parseInt(params.slug);
  const epParam = url.searchParams.get('ep');
  const ep = epParam ? parseInt(epParam) : 1;

  // Ambil data AniList & TMDB mappings secara paralel
  const [media, mappings] = await Promise.all([
    getAnimeDetails(id),
    getAnimeMappings(id)
  ]);

  // --- AnimePahe matching (opsional / fallback) ---
  let paheAnimeSession: string | null = null;
  let paheEpisodes: Awaited<ReturnType<typeof getEpisodes>> | null = null;
  let paheMatchTitle: string | null = null;
  let paheMatchError: string | null = null;

  try {
    // Cek cache mapping AniList ID → AnimePahe session
    const mappingKey = `pahe:mapping:${id}`;
    const cachedMapping = serverCache.get<{ session: string; title: string }>(mappingKey);

    if (cachedMapping) {
      paheAnimeSession = cachedMapping.session;
      paheMatchTitle = cachedMapping.title;
    } else if (media) {
      // Coba semua varian judul yang tersedia (romaji, english, native)
      const titleCandidates = [
        media.title?.romaji,
        media.title?.english,
        media.title?.native
      ].filter(Boolean) as string[];

      let bestScore = 0;
      let bestSession: string | null = null;
      let bestTitle: string | null = null;

      for (const query of titleCandidates) {
        if (!query) continue;
        try {
          const results = await searchAnime(query);
          for (const result of results) {
            // Cocokkan juga berdasarkan tahun jika tersedia
            const yearMatch =
              !media.startDate?.year ||
              !result.year ||
              Math.abs(result.year - media.startDate.year) <= 1;

            const score = titleMatchScore(result.title, query) + (yearMatch ? 10 : 0);
            if (score > bestScore) {
              bestScore = score;
              bestSession = result.id;
              bestTitle = result.title;
            }
          }
          if (bestScore >= 80) break; // Sudah cukup cocok, hentikan iterasi
        } catch {
          // Lanjut ke judul berikutnya jika gagal
        }
      }

      if (bestSession && bestScore >= 40) {
        paheAnimeSession = bestSession;
        paheMatchTitle = bestTitle;
        // Cache mapping ini selama 24 jam
        serverCache.set(mappingKey, { session: bestSession, title: bestTitle }, 86_400);
      } else {
        paheMatchError = 'Anime tidak ditemukan di AnimePahe';
      }
    }

    // Ambil list episode dari AnimePahe jika session ditemukan
    if (paheAnimeSession) {
      const epCacheKey = `pahe:episodes:${paheAnimeSession}:1`;
      const cachedEps = serverCache.get<Awaited<ReturnType<typeof getEpisodes>>>(epCacheKey);
      if (cachedEps) {
        paheEpisodes = cachedEps;
      } else {
        paheEpisodes = await getEpisodes(paheAnimeSession, 1);
        serverCache.set(epCacheKey, paheEpisodes, 3600);
      }
    }
  } catch (err: any) {
    paheMatchError = err?.message || 'Gagal mengambil data AnimePahe';
  }

  const calculatedTotal =
    paheEpisodes?.total ||
    media?.episodes ||
    (media?.nextAiringEpisode ? media.nextAiringEpisode.episode - 1 : 12);

  return {
    media,
    mappings,
    currentEpisode: ep,
    totalEpisodes: calculatedTotal,
    pahe: {
      animeSession: paheAnimeSession,
      matchTitle: paheMatchTitle,
      episodes: paheEpisodes?.episodes ?? null,
      totalEpisodes: calculatedTotal,
      lastPage: paheEpisodes?.lastPage ?? null,
      error: paheMatchError
    }
  };
};
