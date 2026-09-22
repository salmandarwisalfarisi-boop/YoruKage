export interface ContinueWatchingItem {
  id: number;
  title: string;
  coverImage: string;
  episode: number;
  progressSeconds: number;
  durationSeconds: number;
  updatedAt: number;
}

export interface FavoriteItem {
  id: number;
  title: string;
  coverImage: string;
  format?: string;
  addedAt: number;
}

class UserStore {
  isLoggedIn = $state(true); // Demo user active
  user = $state({
    name: 'Nono Otaku',
    avatar: 'https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png'
  });
  continueWatching = $state<ContinueWatchingItem[]>([]);
  favorites = $state<FavoriteItem[]>([]);

  init() {
    if (typeof window !== 'undefined') {
      const cw = localStorage.getItem('anikage_continue_watching');
      if (cw) {
        try { this.continueWatching = JSON.parse(cw); } catch (e) {}
      }
      const favs = localStorage.getItem('anikage_favorites');
      if (favs) {
        try { this.favorites = JSON.parse(favs); } catch (e) {}
      }
    }
  }

  saveProgress(item: Omit<ContinueWatchingItem, 'updatedAt'>) {
    const existingIdx = this.continueWatching.findIndex(i => i.id === item.id);
    const newItem: ContinueWatchingItem = { ...item, updatedAt: Date.now() };
    if (existingIdx >= 0) {
      this.continueWatching[existingIdx] = newItem;
    } else {
      this.continueWatching.unshift(newItem);
    }
    this.continueWatching = this.continueWatching.slice(0, 20); // Keep last 20
    if (typeof window !== 'undefined') {
      localStorage.setItem('anikage_continue_watching', JSON.stringify(this.continueWatching));
    }
  }

  toggleFavorite(item: Omit<FavoriteItem, 'addedAt'>) {
    const exists = this.favorites.some(f => f.id === item.id);
    if (exists) {
      this.favorites = this.favorites.filter(f => f.id !== item.id);
    } else {
      this.favorites.unshift({ ...item, addedAt: Date.now() });
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('anikage_favorites', JSON.stringify(this.favorites));
    }
  }

  isFavorite(id: number): boolean {
    return this.favorites.some(f => f.id === id);
  }
}

export const userStore = new UserStore();
