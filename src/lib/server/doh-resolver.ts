/**
 * doh-resolver.ts — In-App DNS-over-HTTPS (DoH) Resolver
 *
 * Mengabaikan DNS lokal ISP (seperti Telkomsel/IndiHome/FirstMedia) secara otomatis.
 * Semua request DNS untuk domain anime/streaming diarahkan langsung ke:
 *  1. Cloudflare DNS (1.1.1.1, 1.0.0.1) & Google DNS (8.8.8.8) via UDP
 *  2. Fallback: Google DoH (https://dns.google/resolve) via HTTPS (Port 443)
 *     sehingga 100% kebal dari transparent DNS hijacking / filtering ISP.
 */

import dns from 'node:dns';

interface DnsCacheEntry {
  addresses: string[];
  expiresAt: number;
}

// In-Memory DNS Cache (TTL default 10 menit)
const dnsCache = new Map<string, DnsCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Daftar pola domain yang otomatis diproteksi oleh DoH
const PROTECTED_DOMAINS = [
  'animepahe',
  'kwik',
  'ani.zip',
  'vidsrc',
  '2embed',
  'consumet',
  'anify'
];

function shouldProtectDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return PROTECTED_DOMAINS.some((pattern) => lower.includes(pattern));
}

/**
 * Resolusi DNS via Google DNS-over-HTTPS (port 443 HTTPS terenkripsi)
 */
async function resolveViaDoH(hostname: string): Promise<string[]> {
  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.Answer || !Array.isArray(data.Answer)) return [];
    return data.Answer.filter((ans: any) => ans.type === 1 && ans.data).map((ans: any) => String(ans.data));
  } catch {
    return [];
  }
}

/**
 * Resolusi DNS via Cloudflare DNS-over-HTTPS (fallback DoH kedua)
 */
async function resolveViaCloudflareDoH(hostname: string): Promise<string[]> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`;
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.Answer || !Array.isArray(data.Answer)) return [];
    return data.Answer.filter((ans: any) => ans.type === 1 && ans.data).map((ans: any) => String(ans.data));
  } catch {
    return [];
  }
}

let isInitialized = false;

/**
 * Pasang DoH resolver secara global di runtime Node.js server.
 */
export function initDohResolver(): void {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // Set default nameservers ke Cloudflare & Google
    dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);
  } catch (err) {
    console.warn('[DoH] Tidak dapat mengatur dns.setServers:', err);
  }

  const originalLookup = dns.lookup.bind(dns);

  // Monkey-patch dns.lookup yang dipakai oleh fetch() dan https.request() di Node.js
  // @ts-ignore
  dns.lookup = function patchedLookup(
    hostname: string,
    options: any,
    callback: (err: NodeJS.ErrnoException | null, address: any, family?: number) => void
  ) {
    let cb = callback;
    let opt = options;
    if (typeof options === 'function') {
      cb = options;
      opt = {};
    }

    if (!hostname || !shouldProtectDomain(hostname)) {
      return originalLookup(hostname, opt, cb);
    }

    const now = Date.now();
    const cached = dnsCache.get(hostname);

    if (cached && now < cached.expiresAt && cached.addresses.length > 0) {
      if (opt && opt.all) {
        return cb(
          null,
          cached.addresses.map((addr) => ({ address: addr, family: 4 }))
        );
      }
      return cb(null, cached.addresses[0], 4);
    }

    // 1. Coba resolve4 dengan Cloudflare/Google DNS
    dns.resolve4(hostname, async (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        dnsCache.set(hostname, { addresses, expiresAt: now + CACHE_TTL_MS });
        if (opt && opt.all) {
          return cb(
            null,
            addresses.map((addr) => ({ address: addr, family: 4 }))
          );
        }
        return cb(null, addresses[0], 4);
      }

      // 2. Jika UDP port 53 diblokir ISP, fallback ke HTTPS DoH (Google/Cloudflare Port 443)
      try {
        let dohAddresses = await resolveViaDoH(hostname);
        if (dohAddresses.length === 0) {
          dohAddresses = await resolveViaCloudflareDoH(hostname);
        }

        if (dohAddresses.length > 0) {
          dnsCache.set(hostname, { addresses: dohAddresses, expiresAt: now + CACHE_TTL_MS });
          if (opt && opt.all) {
            return cb(
              null,
              dohAddresses.map((addr) => ({ address: addr, family: 4 }))
            );
          }
          return cb(null, dohAddresses[0], 4);
        }
      } catch {
        // Abaikan error DoH
      }

      // 3. Fallback terakhir ke sistem OS jika semuanya gagal
      return originalLookup(hostname, opt, cb);
    });
  };

  console.log('✅ [DoH Resolver] Aktif: Resolusi DNS AnimePahe & Kwik kini kebal blokir ISP.');
}
