export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

class UIStore {
  searchOpen = $state(false);
  titleLanguage = $state<'userPreferred' | 'english' | 'romaji'>('userPreferred');
  toasts = $state<Toast[]>([]);

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
  }

  setSearchOpen(open: boolean) {
    this.searchOpen = open;
  }

  setTitleLanguage(lang: 'userPreferred' | 'english' | 'romaji') {
    this.titleLanguage = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('anikage_title_lang', lang);
    }
  }

  showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const id = Math.random().toString(36).substring(2);
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  init() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('anikage_title_lang');
      if (stored === 'english' || stored === 'romaji' || stored === 'userPreferred') {
        this.titleLanguage = stored;
      }
    }
  }
}

export const uiStore = new UIStore();
