interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      // Return stale data if needed or expire
      // We keep stale entry for emergency fallback if network fails
      return entry.data;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  hasValid(key: string): boolean {
    const entry = this.cache.get(key);
    return !!entry && Date.now() <= entry.expiresAt;
  }
}

export const serverCache = new InMemoryCache();
