<script lang="ts">
  import { uiStore } from '$lib/stores/ui.svelte';
  import { Search, X, Loader2, Play } from 'lucide-svelte';
  import type { AnimeMedia } from '$lib/types/anime';

  let query = $state('');
  let results = $state<AnimeMedia[]>([]);
  let loading = $state(false);
  let recents = $state<string[]>([]);

  $effect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('anikage_recents');
      if (stored) {
        try { recents = JSON.parse(stored); } catch (e) {}
      }
    }
  });

  // Global hotkey Ctrl+K / Cmd+K listener
  $effect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        uiStore.toggleSearch();
      }
      if (e.key === 'Escape' && uiStore.searchOpen) {
        uiStore.setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  let debounceTimer: any;
  function handleInput(val: string) {
    query = val;
    clearTimeout(debounceTimer);
    if (!val.trim()) {
      results = [];
      loading = false;
      return;
    }
    loading = true;
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query ($search: String) {
                Page(page: 1, perPage: 8) {
                  media(search: $search, type: ANIME, isAdult: false) {
                    id
                    title { userPreferred romaji english }
                    coverImage { extraLarge large color }
                    format
                    status
                    episodes
                    averageScore
                    seasonYear
                  }
                }
              }
            `,
            variables: { search: val }
          })
        });
        const json = await res.json();
        results = json?.data?.Page?.media || [];
      } catch (err) {
        console.error(err);
      } finally {
        loading = false;
      }
    }, 300);
  }

  function selectItem(item: AnimeMedia) {
    if (!recents.includes(item.title.userPreferred)) {
      recents = [item.title.userPreferred, ...recents.slice(0, 4)];
      if (typeof window !== 'undefined') {
        localStorage.setItem('anikage_recents', JSON.stringify(recents));
      }
    }
    uiStore.setSearchOpen(false);
  }
</script>

{#if uiStore.searchOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200"
    onclick={(e) => { if (e.target === e.currentTarget) uiStore.setSearchOpen(false); }}
  >
    <div class="bg-[#141414] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
      <!-- Header search bar -->
      <div class="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-[#0d0d0d]">
        <Search class="w-5 h-5 text-amber-500 shrink-0 mr-3 stroke-[2.5]" />
        <input
          type="text"
          placeholder="Search anime by title, genre, studio..."
          class="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base"
          value={query}
          oninput={(e) => handleInput((e.target as HTMLInputElement).value)}
          autofocus
        />
        {#if loading}
          <Loader2 class="w-5 h-5 text-amber-500 animate-spin shrink-0 ml-2" />
        {:else if query}
          <button onclick={() => handleInput('')} class="text-zinc-400 hover:text-white p-1">
            <X class="w-4 h-4" />
          </button>
        {/if}
        <kbd class="hidden sm:inline-block ml-3 px-2 py-0.5 text-2xs font-mono bg-white/10 text-zinc-400 rounded-md border border-white/10">
          ESC
        </kbd>
      </div>

      <!-- Results or recent searches -->
      <div class="p-4 overflow-y-auto space-y-4">
        {#if !query && recents.length > 0}
          <div>
            <span class="text-2xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Recent Searches</span>
            <div class="flex flex-wrap gap-2">
              {#each recents as item}
                <button
                  onclick={() => handleInput(item)}
                  class="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:border-amber-500/40 transition"
                >
                  {item}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#if loading && results.length === 0}
          <div class="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
            <Loader2 class="w-6 h-6 animate-spin text-amber-500" />
            <span class="text-xs">Searching AniList...</span>
          </div>
        {:else if query && results.length === 0 && !loading}
          <div class="py-12 text-center text-zinc-500">
            No anime found matching "<span class="text-white">{query}</span>"
          </div>
        {:else if results.length > 0}
          <div class="space-y-2">
            <span class="text-2xs font-bold uppercase tracking-wider text-zinc-500 block">Search Results</span>
            {#each results as anime}
              <a
                href="/anime/info/{anime.id}"
                onclick={() => selectItem(anime)}
                class="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10 group"
              >
                <img
                  src={anime.coverImage.large || anime.coverImage.extraLarge}
                  alt={anime.title.userPreferred}
                  class="w-12 h-16 object-cover rounded-lg shrink-0 shadow"
                />
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-white group-hover:text-amber-400 transition text-sm truncate">
                    {anime.title.userPreferred}
                  </h4>
                  <div class="flex items-center gap-2 text-2xs text-zinc-400 mt-1">
                    <span class="uppercase font-semibold text-amber-500/90">{anime.format || 'TV'}</span>
                    <span>•</span>
                    <span>{anime.seasonYear || 'N/A'}</span>
                    <span>•</span>
                    <span class="text-emerald-400 font-semibold">{anime.status || 'Finished'}</span>
                    {#if anime.averageScore}
                      <span>•</span>
                      <span class="text-amber-400 font-bold">★ {(anime.averageScore / 10).toFixed(1)}</span>
                    {/if}
                  </div>
                </div>
                <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-amber-500 group-hover:text-black transition shrink-0">
                  <Play class="w-4 h-4 fill-current ml-0.5" />
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
