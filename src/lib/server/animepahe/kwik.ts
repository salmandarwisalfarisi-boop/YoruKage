/**
 * kwik.ts — Updated dengan deobfuscator lengkap (Poin 1) + Cloudflare bypass (Poin 2)
 * + proxy pool (Poin 3)
 *
 * Alur:
 *  1. Fetch halaman Kwik embed dengan proxied fetch + sesi tersimpan
 *  2. Jika 403/503 → FlareSolverr bypass otomatis
 *  3. Jalankan pipeline deobfuscation lengkap (Packer, SARot, CFF, escape decode)
 *  4. Ekstrak stream URL + token info
 *  5. Cache hasil dengan TTL aman (respek expiry token)
 */

import { deobfuscate, type DeobfuscationResult } from './deobfuscator';
import { fetchWithCloudflareBypass } from '$lib/server/flaresolverr';
import { proxiedFetch } from '$lib/server/proxy-pool';
import { serverCache } from '$lib/server/cache';
import { initDohResolver } from '$lib/server/doh-resolver';

initDohResolver();

const KWIK_DOMAINS = ['kwik.cx', 'kwik.si', 'kwik.net', 'kwik.com'];
const REFERER = 'https://animepahe.ru/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface KwikStreamResult {
  streamUrl: string;
  token: string | null;
  expiresAt: number | null;
  /** Teknik deobfuscation yang digunakan */
  techniques: string[];
  /** Fingerprint kode yang di-unpack (untuk debugging) */
  fingerprint: string;
  /** Apakah hasil ini diambil dari cache */
  fromCache: boolean;
}

function isKwikUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return KWIK_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * Mengekstrak semua blok script dari HTML dan mengembalikan yang paling kemungkinan
 * mengandung kode obfuscasi / definisi stream URL.
 */
function extractScriptBlocks(html: string): string[] {
  const blocks: string[] = [];
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;

  while ((m = scriptPattern.exec(html)) !== null) {
    const content = m[1].trim();
    if (content.length > 100) blocks.push(content);
  }

  return blocks;
}

/**
 * Fungsi inti: ambil dan ekstrak stream URL dari halaman Kwik embed.
 */
export async function extractKwikStream(kwikUrl: string): Promise<KwikStreamResult> {
  if (!isKwikUrl(kwikUrl)) {
    throw new Error(`URL bukan domain Kwik yang dikenal: ${kwikUrl}`);
  }

  // Cek cache terlebih dahulu
  const cacheKey = `kwik:v2:${kwikUrl}`;
  const cached = serverCache.get<KwikStreamResult>(cacheKey);
  if (cached) {
    // Verifikasi token tidak kedaluwarsa
    if (!cached.expiresAt || Date.now() < cached.expiresAt) {
      return { ...cached, fromCache: true };
    }
  }

  // -------------------------------------------------------------------
  // Step 1: Fetch halaman Kwik
  // -------------------------------------------------------------------
  let html: string;

  const commonHeaders = {
    'User-Agent': UA,
    'Referer': REFERER,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Dest': 'iframe',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site'
  };

  try {
    // Attempt 1: Proxied fetch biasa
    const res = await proxiedFetch(kwikUrl, {
      headers: commonHeaders,
      maxRetries: 2,
      timeoutMs: 12_000
    });

    if (res.ok) {
      html = await res.text();
    } else if ([403, 503].includes(res.status)) {
      // Attempt 2: FlareSolverr bypass
      console.info(`[Kwik] HTTP ${res.status} — mencoba FlareSolverr bypass...`);
      const result = await fetchWithCloudflareBypass(kwikUrl, {}, commonHeaders);
      html = await result.text();
    } else {
      throw new Error(`Kwik HTTP ${res.status}`);
    }
  } catch (err: any) {
    // Terakhir: coba FlareSolverr sebagai fallback absolut
    if (err.message?.includes('FlareSolverr')) throw err;
    try {
      const result = await fetchWithCloudflareBypass(kwikUrl, {}, commonHeaders);
      html = await result.text();
    } catch {
      throw new Error(`Gagal mengambil halaman Kwik: ${err.message}`);
    }
  }

  // -------------------------------------------------------------------
  // Step 2: Ekstrak semua blok script dan jalankan pipeline deobfuscation
  // -------------------------------------------------------------------
  const scriptBlocks = extractScriptBlocks(html);

  if (scriptBlocks.length === 0) {
    throw new Error('Tidak ada blok script ditemukan di halaman Kwik');
  }

  let bestResult: DeobfuscationResult | null = null;

  for (const block of scriptBlocks) {
    const result = deobfuscate(block);
    if (result.streamInfo.streamUrl) {
      bestResult = result;
      break;
    }
    // Jika blok ini lebih banyak teknik yang berhasil, ambil sebagai kandidat terbaik
    if (!bestResult || result.techniques.length > bestResult.techniques.length) {
      bestResult = result;
    }
  }

  if (!bestResult?.streamInfo.streamUrl) {
    throw new Error(
      `Stream URL tidak ditemukan. Teknik yang dicoba: ${bestResult?.techniques.join(', ') || 'none'}. ` +
      'Kemungkinan obfuscation script diperbarui.'
    );
  }

  const { streamInfo, techniques, fingerprint } = bestResult;

  // -------------------------------------------------------------------
  // Step 3: Hitung TTL cache berdasarkan token expiry
  // -------------------------------------------------------------------
  let ttlSeconds = 600; // default 10 menit
  if (streamInfo.expiresAt) {
    const remaining = Math.floor((streamInfo.expiresAt - Date.now()) / 1000);
    // Simpan dengan buffer 30 detik sebelum kedaluwarsa
    ttlSeconds = Math.max(60, remaining - 30);
  }

  const streamResult: KwikStreamResult = {
    streamUrl: streamInfo.streamUrl,
    token: streamInfo.token,
    expiresAt: streamInfo.expiresAt,
    techniques,
    fingerprint,
    fromCache: false
  };

  serverCache.set(cacheKey, streamResult, ttlSeconds);
  return streamResult;
}
