/**
 * session-store.ts — Poin 3: Infrastruktur Makro
 *
 * Distributed Session & Cookie Store:
 *   - Primary: Redis (jika REDIS_URL dikonfigurasi di env)
 *   - Fallback: Enhanced In-Memory LRU cache (jika Redis tidak tersedia)
 *
 * Digunakan untuk menyimpan cookie sesi Cloudflare, FlareSolverr session cookies,
 * dan token autentikasi yang berlaku lama agar bisa dipakai lintas-request.
 *
 * Format env: REDIS_URL=redis://user:pass@host:port
 */

import { env } from '$env/dynamic/private';

export interface SessionEntry {
  cookies: string;
  userAgent: string;
  createdAt: number;
  expiresAt: number;
  domain: string;
}

// -------------------------------------------------------------------
// LRU In-Memory Store (Fallback)
// -------------------------------------------------------------------

class LRUMemoryStore {
  private map = new Map<string, { value: SessionEntry; expiresAt: number }>();
  private readonly maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<SessionEntry | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    // LRU: pindahkan ke akhir
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  async set(key: string, value: SessionEntry, ttlSeconds: number): Promise<void> {
    if (this.map.size >= this.maxSize) {
      // Hapus entry terlama (front of map)
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  async size(): Promise<number> {
    // Bersihkan yang kedaluwarsa dulu
    const now = Date.now();
    for (const [k, v] of this.map.entries()) {
      if (now > v.expiresAt) this.map.delete(k);
    }
    return this.map.size;
  }
}

// -------------------------------------------------------------------
// Redis Store (Primary)
// -------------------------------------------------------------------

class RedisSessionStore {
  private client: any = null;
  private connected = false;
  private fallback = new LRUMemoryStore();

  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    const redisUrl = env.REDIS_URL;
    if (!redisUrl) return;

    try {
      // Dinamis import agar tidak crash jika paket tidak terinstall
      const { createClient } = await import('redis' as any);
      this.client = createClient({ url: redisUrl });
      this.client.on('error', (err: Error) => {
        if (this.connected) {
          console.error('[SessionStore] Redis error:', err.message);
          this.connected = false;
        }
      });
      this.client.on('ready', () => {
        this.connected = true;
        console.info('[SessionStore] Redis terhubung');
      });
      await this.client.connect();
    } catch (err) {
      console.warn('[SessionStore] Redis tidak tersedia, menggunakan in-memory fallback:', (err as Error).message);
      this.client = null;
    }
  }

  async get(key: string): Promise<SessionEntry | null> {
    if (this.connected && this.client) {
      try {
        const raw = await this.client.get(`session:${key}`);
        if (raw) return JSON.parse(raw) as SessionEntry;
        return null;
      } catch {
        this.connected = false;
      }
    }
    return this.fallback.get(key);
  }

  async set(key: string, value: SessionEntry, ttlSeconds = 3600): Promise<void> {
    if (this.connected && this.client) {
      try {
        await this.client.setEx(`session:${key}`, ttlSeconds, JSON.stringify(value));
        return;
      } catch {
        this.connected = false;
      }
    }
    await this.fallback.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    if (this.connected && this.client) {
      try {
        await this.client.del(`session:${key}`);
        return;
      } catch {
        this.connected = false;
      }
    }
    await this.fallback.delete(key);
  }

  isRedisConnected(): boolean {
    return this.connected;
  }

  async size(): Promise<number> {
    if (this.connected && this.client) {
      try {
        return await this.client.dbSize();
      } catch { /* fallthrough */ }
    }
    return this.fallback.size();
  }
}

export const sessionStore = new RedisSessionStore();
