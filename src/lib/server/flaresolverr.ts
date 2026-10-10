/**
 * flaresolverr.ts — Poin 2: Sisi Menembus Batasan Keamanan
 *
 * Client untuk FlareSolverr — layanan microservice headless browser (Chromium)
 * yang secara otomatis:
 *   - Melewati Cloudflare UAM (JS Challenge / Turnstile)
 *   - Mengembalikan cookie sesi yang valid + User-Agent browser asli
 *   - Mengembalikan konten HTML halaman setelah challenge selesai
 *
 * Setup FlareSolverr (via Docker):
 *   docker run -d --name=flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest
 *
 * Konfigurasi env:
 *   FLARESOLVERR_URL=http://localhost:8191   (default)
 *   FLARESOLVERR_TIMEOUT=60000               (ms, default 60 detik)
 *
 * Behavioral Simulation bawaan FlareSolverr:
 *   - Mouse movement randomization
 *   - Human-like click delay
 *   - Natural scroll behavior
 *   - TLS fingerprint masking (menggunakan Chromium asli)
 */

import { env } from '$env/dynamic/private';
import { sessionStore, type SessionEntry } from '$lib/server/session-store';

const FLARESOLVERR_URL = (env.FLARESOLVERR_URL || 'http://localhost:8191').replace(/\/$/, '');
const FLARESOLVERR_TIMEOUT = Number(env.FLARESOLVERR_TIMEOUT || 60_000);

export interface FlareSolverrResponse {
  status: 'ok' | 'error';
  message: string;
  startTimestamp: number;
  endTimestamp: number;
  version: string;
  solution: {
    url: string;
    status: number;
    headers: Record<string, string>;
    response: string;
    cookies: Array<{ name: string; value: string; domain: string; path: string; expires: number }>;
    userAgent: string;
  };
}

export interface FlareSolverrResult {
  html: string;
  cookies: string;
  userAgent: string;
  cached: boolean;
}

/**
 * Cek apakah FlareSolverr service sedang berjalan.
 */
export async function isFlareSolverrAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${FLARESOLVERR_URL}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Kirim request GET ke FlareSolverr untuk melewati Cloudflare challenge.
 * Akan menyimpan cookie sesi hasil bypass ke SessionStore agar tidak
 * perlu menjalankan browser berulang kali untuk domain yang sama.
 *
 * @param targetUrl   URL target yang dilindungi Cloudflare
 * @param forceRefresh  Paksa bypass ulang walau sesi tersimpan masih valid
 */
export async function solveWithFlareSolverr(
  targetUrl: string,
  forceRefresh = false
): Promise<FlareSolverrResult> {
  const domain = new URL(targetUrl).hostname;
  const sessionKey = `flare:${domain}`;

  // Cek sesi yang sudah ada terlebih dahulu
  if (!forceRefresh) {
    const cached = await sessionStore.get(sessionKey);
    if (cached) {
      return {
        html: '', // HTML tidak dicache — hanya cookie
        cookies: cached.cookies,
        userAgent: cached.userAgent,
        cached: true
      };
    }
  }

  // Kirim ke FlareSolverr
  const payload = {
    cmd: 'request.get',
    url: targetUrl,
    maxTimeout: FLARESOLVERR_TIMEOUT
  };

  const response = await fetch(`${FLARESOLVERR_URL}/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(FLARESOLVERR_TIMEOUT + 5000)
  });

  if (!response.ok) {
    throw new Error(`FlareSolverr HTTP error: ${response.status}`);
  }

  const data = (await response.json()) as FlareSolverrResponse;

  if (data.status !== 'ok') {
    throw new Error(`FlareSolverr error: ${data.message}`);
  }

  const { solution } = data;

  // Format cookies ke string untuk dipakai di header request berikutnya
  const cookieString = solution.cookies
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  // Simpan sesi ke SessionStore (TTL 6 jam — waktu tipikal sesi Cloudflare)
  const sessionEntry: SessionEntry = {
    cookies: cookieString,
    userAgent: solution.userAgent,
    createdAt: Date.now(),
    expiresAt: Date.now() + 6 * 3600 * 1000,
    domain
  };
  await sessionStore.set(sessionKey, sessionEntry, 6 * 3600);

  return {
    html: solution.response,
    cookies: cookieString,
    userAgent: solution.userAgent,
    cached: false
  };
}

/**
 * Fetch dengan fallback otomatis ke FlareSolverr jika menerima 403/503.
 *
 * Alur:
 *   1. Coba fetch biasa menggunakan cookie sesi yang sudah disimpan.
 *   2. Jika gagal (403/503) → panggil FlareSolverr untuk bypass.
 *   3. Ulangi fetch dengan cookie baru dari FlareSolverr.
 *   4. Jika FlareSolverr tidak tersedia → lempar error informatif.
 */
export async function fetchWithCloudflareBypass(
  targetUrl: string,
  init: RequestInit = {},
  headers: Record<string, string> = {}
): Promise<Response> {
  const domain = new URL(targetUrl).hostname;
  const sessionKey = `flare:${domain}`;

  // Coba ambil sesi yang tersimpan
  const session = await sessionStore.get(sessionKey);

  const buildHeaders = (cookies: string, ua: string) => ({
    'User-Agent': ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Cookie: cookies,
    Referer: `https://${domain}/`,
    ...headers,
    ...(init.headers as Record<string, string> || {})
  });

  // Attempt 1: Fetch dengan sesi yang ada (jika ada)
  if (session) {
    const res = await fetch(targetUrl, {
      ...init,
      headers: buildHeaders(session.cookies, session.userAgent),
      signal: AbortSignal.timeout(15_000)
    });
    if (res.ok || ![403, 503].includes(res.status)) return res;
    // Sesi kedaluwarsa — hapus dan lanjut ke FlareSolverr
    await sessionStore.delete(sessionKey);
  }

  // Attempt 2: FlareSolverr bypass
  const available = await isFlareSolverrAvailable();
  if (!available) {
    throw new Error(
      'Cloudflare challenge terdeteksi dan FlareSolverr tidak tersedia. ' +
      'Jalankan: docker run -d -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest'
    );
  }

  const flare = await solveWithFlareSolverr(targetUrl, true);

  // Attempt 3: Fetch dengan cookie fresh dari FlareSolverr
  return fetch(targetUrl, {
    ...init,
    headers: buildHeaders(flare.cookies, flare.userAgent),
    signal: AbortSignal.timeout(15_000)
  });
}
