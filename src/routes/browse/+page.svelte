<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import AnimeCard from '$lib/components/cards/AnimeCard.svelte';
  import CardSkeleton from '$lib/components/cards/CardSkeleton.svelte';
  import Footer from '$lib/components/nav/Footer.svelte';
  import { Search, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();

  const genresList = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller'
  ];

  const formatsList = [
    { label: 'All Formats', value: '' },
    { label: 'TV Series', value: 'TV' },
    { label: 'Movie', value: 'MOVIE' },
    { label: 'OVA', value: 'OVA' },
    { label: 'ONA', value: 'ONA' }
  ];

  const statusList = [
    { label: 'All Status', value: '' },
    { label: 'Airing', value: 'RELEASING' },
    { label: 'Finished', value: 'FINISHED' },
    { label: 'Upcoming', value: 'NOT_YET_RELEASED' }
  ];

  const sortOptions = [
    { label: 'Most Popular', value: 'POPULARITY_DESC' },
    { label: 'Top Rated', value: 'SCORE_DESC' },
    { label: 'Trending', value: 'TRENDING_DESC' },
    { label: 'Newest', value: 'START_DATE_DESC' }
  ];

  let searchInput = $state('');
  let selectedGenre = $state('');
  let selectedFormat = $state('');
  let selectedStatus = $state('');
  let selectedSort = $state('POPULARITY_DESC');

  $effect(() => {
    searchInput = data.filters.search || '';
    selectedGenre = data.filters.genre || '';
    selectedFormat = data.filters.format || '';
    selectedStatus = data.filters.status || '';
    selectedSort = data.filters.sort || 'POPULARITY_DESC';
  });

  function applyFilters() {
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (selectedFormat) params.set('format', selectedFormat);
    if (selectedStatus) params.set('status', selectedStatus);
    if (selectedSort) params.set('sort', selectedSort);
    params.set('page', '1');
    goto(`/browse?${params.toString()}`);
  }

  function resetFilters() {
    searchInput = '';
    selectedGenre = '';
    selectedFormat = '';
    selectedStatus = '';
    selectedSort = 'POPULARITY_DESC';
    goto('/browse');
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', p.toString());
    goto(`/browse?${params.toString()}`);
  }
</script>

<div class="pt-24 pb-12 max-w-7xl mx-auto px-6 space-y-8 min-h-screen">
  <!-- Title Header -->
  <div class="space-y-2">
    <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
      Browse Anime Catalog
    </h1>
    <p class="text-sm text-zinc-400">
      Filter through thousands of anime series, movies, and ONAs powered by AniList.
    </p>
  </div>

  <!-- Filter Controls Card -->
  <div class="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-5 shadow-xl">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Search Input -->
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by title..."
          bind:value={searchInput}
          onkeydown={(e) => e.key === 'Enter' && applyFilters()}
          class="w-full bg-[#0d0d0d] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <!-- Format Filter -->
      <select
        bind:value={selectedFormat}
        onchange={applyFilters}
        class="bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
      >
        {#each formatsList as fmt}
          <option value={fmt.value}>{fmt.label}</option>
        {/each}
      </select>

      <!-- Status Filter -->
      <select
        bind:value={selectedStatus}
        onchange={applyFilters}
        class="bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
      >
        {#each statusList as st}
          <option value={st.value}>{st.label}</option>
        {/each}
      </select>

      <!-- Sort Filter -->
      <select
        bind:value={selectedSort}
        onchange={applyFilters}
        class="bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
      >
        {#each sortOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

    <!-- Multi-select Genre Pills -->
    <div class="space-y-2">
      <span class="text-2xs font-bold uppercase text-zinc-400 tracking-wider">Genres</span>
      <div class="flex flex-wrap gap-2">
        <button
          onclick={() => { selectedGenre = ''; applyFilters(); }}
          class="px-3 py-1 rounded-full text-xs font-semibold transition border {selectedGenre === ''
            ? 'bg-amber-500 text-black border-amber-500 shadow'
            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}"
        >
          All Genres
        </button>
        {#each genresList as genre}
          <button
            onclick={() => { selectedGenre = genre; applyFilters(); }}
            class="px-3 py-1 rounded-full text-xs font-medium transition border {selectedGenre === genre
              ? 'bg-amber-500 text-black border-amber-500 shadow font-bold'
              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}"
          >
            {genre}
          </button>
        {/each}
      </div>
    </div>

    <!-- Filter Actions -->
    <div class="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
      <span class="text-zinc-400 font-mono">
        Found {data.pageInfo.total || data.items.length} anime
      </span>
      <button
        onclick={resetFilters}
        class="flex items-center gap-1.5 text-zinc-400 hover:text-rose-400 transition"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        Reset Filters
      </button>
    </div>
  </div>

  <!-- Grid Display (grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4) -->
  {#if data.items.length > 0}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {#each data.items as media (media.id)}
        <AnimeCard {media} />
      {/each}
    </div>

    <!-- Pagination controls -->
    <div class="flex items-center justify-center gap-3 pt-8">
      <button
        disabled={data.pageInfo.currentPage <= 1}
        onclick={() => goToPage(data.pageInfo.currentPage - 1)}
        class="p-2.5 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      <span class="text-sm font-mono font-bold text-zinc-400">
        Page <span class="text-amber-400">{data.pageInfo.currentPage}</span> of {data.pageInfo.lastPage || 1}
      </span>
      <button
        disabled={!data.pageInfo.hasNextPage}
        onclick={() => goToPage(data.pageInfo.currentPage + 1)}
        class="p-2.5 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>
  {:else}
    <div class="py-20 text-center space-y-3 bg-[#141414] rounded-2xl border border-white/10">
      <p class="text-zinc-400 text-base">No anime found matching your filter criteria.</p>
      <button
        onclick={resetFilters}
        class="px-6 py-2.5 rounded-full bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition"
      >
        Clear Filters
      </button>
    </div>
  {/if}
</div>

<Footer />
