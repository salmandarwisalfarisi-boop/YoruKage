<script lang="ts">
  import Footer from '$lib/components/nav/Footer.svelte';
  import { userStore } from '$lib/stores/auth.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { User, Heart, Clock, Settings, Play, Trash2, Globe } from 'lucide-svelte';

  let activeTab = $state<'history' | 'favorites' | 'settings'>('history');

  function removeFavorite(id: number) {
    userStore.favorites = userStore.favorites.filter(f => f.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('anikage_favorites', JSON.stringify(userStore.favorites));
    }
    uiStore.showToast('Removed from favorites', 'info');
  }

  function clearHistory() {
    userStore.continueWatching = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anikage_continue_watching');
    }
    uiStore.showToast('Watch history cleared', 'info');
  }
</script>

<div class="pt-24 pb-12 max-w-7xl mx-auto px-6 space-y-8 min-h-screen">
  <!-- Profile Header Card -->
  <div class="bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl relative overflow-hidden">
    <div class="absolute -top-1/2 -right-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>

    <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-xl shrink-0">
      <img src={userStore.user.avatar} alt="User Avatar" class="h-full w-full object-cover" />
    </div>

    <div class="flex-1 text-center sm:text-left space-y-2">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">
          {userStore.user.name}
        </h1>
        <span class="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-2xs uppercase tracking-wider self-center sm:self-auto">
          PRO Member
        </span>
      </div>
      <p class="text-xs text-zinc-400 font-mono">
        Watching anime on AniKage • {userStore.favorites.length} Favorites • {userStore.continueWatching.length} Watched
      </p>
    </div>
  </div>

  <!-- Profile Tabs -->
  <div class="flex items-center gap-2 border-b border-white/10 pb-2">
    <button
      onclick={() => (activeTab = 'history')}
      class="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition border {activeTab === 'history'
        ? 'bg-amber-500 text-black border-amber-500 shadow-md'
        : 'bg-[#141414] border-white/10 text-zinc-400 hover:text-white'}"
    >
      <Clock class="w-4 h-4" /> Watch History ({userStore.continueWatching.length})
    </button>

    <button
      onclick={() => (activeTab = 'favorites')}
      class="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition border {activeTab === 'favorites'
        ? 'bg-amber-500 text-black border-amber-500 shadow-md'
        : 'bg-[#141414] border-white/10 text-zinc-400 hover:text-white'}"
    >
      <Heart class="w-4 h-4" /> Favorites ({userStore.favorites.length})
    </button>

    <button
      onclick={() => (activeTab = 'settings')}
      class="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition border {activeTab === 'settings'
        ? 'bg-amber-500 text-black border-amber-500 shadow-md'
        : 'bg-[#141414] border-white/10 text-zinc-400 hover:text-white'}"
    >
      <Settings class="w-4 h-4" /> Preferences
    </button>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'history'}
    <div class="space-y-4">
      {#if userStore.continueWatching.length > 0}
        <div class="flex justify-end">
          <button onclick={clearHistory} class="flex items-center gap-1.5 text-xs text-rose-400 hover:underline">
            <Trash2 class="w-3.5 h-3.5" /> Clear History
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each userStore.continueWatching as item}
            <div class="flex items-center gap-4 p-3 rounded-2xl bg-[#141414] border border-white/10 shadow-md">
              <img src={item.coverImage} alt={item.title} class="w-20 aspect-[2/3] object-cover rounded-xl shrink-0" />
              <div class="flex-1 min-w-0 space-y-1">
                <h4 class="font-bold text-sm text-white truncate font-display">{item.title}</h4>
                <span class="text-2xs text-amber-400 font-bold block">Episode {item.episode}</span>
                <a
                  href="/anime/watch/{item.id}?ep={item.episode}"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-black font-bold text-2xs mt-2"
                >
                  <Play class="w-3 h-3 fill-current" /> Resume
                </a>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="py-16 text-center text-zinc-500 bg-[#141414] rounded-2xl border border-white/10">
          No watch history recorded yet. Start watching anime!
        </div>
      {/if}
    </div>
  {:else if activeTab === 'favorites'}
    <div class="space-y-4">
      {#if userStore.favorites.length > 0}
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {#each userStore.favorites as item}
            <div class="relative group bg-[#141414] border border-white/10 rounded-2xl overflow-hidden p-2">
              <a href="/anime/info/{item.id}" class="block aspect-[2/3] w-full overflow-hidden rounded-xl">
                <img src={item.coverImage} alt={item.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </a>
              <div class="mt-2 flex items-center justify-between px-1">
                <span class="font-bold text-xs text-white truncate font-display">{item.title}</span>
                <button onclick={() => removeFavorite(item.id)} class="text-zinc-500 hover:text-rose-400 p-1">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="py-16 text-center text-zinc-500 bg-[#141414] rounded-2xl border border-white/10">
          No bookmarked anime yet. Click the heart icon on any anime page to add!
        </div>
      {/if}
    </div>
  {:else if activeTab === 'settings'}
    <div class="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-6 max-w-2xl shadow-xl">
      <h3 class="font-bold text-lg text-white font-display">App Preferences</h3>

      <div class="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h4 class="font-semibold text-sm text-white">Preferred Anime Title Language</h4>
          <p class="text-xs text-zinc-400">Choose between Japanese Romaji titles or English localized titles.</p>
        </div>
        <select
          value={uiStore.titleLanguage}
          onchange={(e) => uiStore.setTitleLanguage((e.target as HTMLSelectElement).value as any)}
          class="bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none"
        >
          <option value="userPreferred">Romaji / Japanese</option>
          <option value="english">English</option>
        </select>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-semibold text-sm text-white">Theme Palette</h4>
          <p class="text-xs text-zinc-400">Dark theme with warm amber accent `#f59e0b` (Strictly non-AI slop palette).</p>
        </div>
        <span class="h-6 w-6 rounded-full bg-amber-500 shadow-md"></span>
      </div>
    </div>
  {/if}
</div>

<Footer />
