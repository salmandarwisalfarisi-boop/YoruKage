<script lang="ts">
  import { Search } from 'lucide-svelte';

  /** Definisi lokal agar tidak import dari $lib/server (server-only) */
  interface AnimePaheEpisode {
    id: string;
    episode: number;
    title: string | null;
    snapshot: string | null;
    duration: number | null;
    filler: boolean;
  }

  interface Props {
    /** Data episode asli dari AnimePahe (jika tersedia) */
    paheEpisodes?: AnimePaheEpisode[] | null;
    /** Fallback: total episode dari AniList */
    totalEpisodes?: number;
    currentEpisode: number;
    onSelectEpisode: (ep: number, paheEpId?: string) => void;
  }

  let {
    paheEpisodes = null,
    totalEpisodes = 12,
    currentEpisode = 1,
    onSelectEpisode
  }: Props = $props();

  let searchQuery = $state('');
  let selectedChunkIndex = $state(0);

  /** Mode: pakai data AnimePahe asli atau fallback dummy */
  const hasPaheData = $derived(Boolean(paheEpisodes && paheEpisodes.length > 0));

  /** Fallback: array angka sederhana */
  const allFallbackEpisodes = $derived(
    Array.from({ length: Math.max(1, totalEpisodes) }, (_, i) => i + 1)
  );

  /** Chunking untuk pagination episode (50 per tab) */
  const CHUNK_SIZE = 50;

  const chunks = $derived.by(() => {
    const count = hasPaheData ? paheEpisodes!.length : allFallbackEpisodes.length;
    if (count <= 36) return [];
    const list: { start: number; end: number; label: string }[] = [];
    for (let i = 0; i < count; i += CHUNK_SIZE) {
      const start = i + 1;
      const end = Math.min(i + CHUNK_SIZE, count);
      list.push({ start, end, label: `${start}-${end}` });
    }
    return list;
  });

  // Otomatis arahkan chunk tab ke episode aktif
  $effect(() => {
    if (chunks.length > 0) {
      const idx = chunks.findIndex(c => currentEpisode >= c.start && currentEpisode <= c.end);
      if (idx !== -1) selectedChunkIndex = idx;
    }
  });

  /** Filter episode berdasarkan search atau chunk */
  const displayedPaheEpisodes = $derived.by(() => {
    if (!paheEpisodes) return [];
    let list = paheEpisodes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(
        e => String(e.episode).includes(q) || (e.title && e.title.toLowerCase().includes(q))
      );
    }
    if (chunks.length > 0 && chunks[selectedChunkIndex]) {
      const { start, end } = chunks[selectedChunkIndex];
      return list.filter(e => e.episode >= start && e.episode <= end);
    }
    return list;
  });

  const displayedFallbackEpisodes = $derived.by(() => {
    let list = allFallbackEpisodes;
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      return list.filter(e => String(e).includes(q));
    }
    if (chunks.length > 0 && chunks[selectedChunkIndex]) {
      const { start, end } = chunks[selectedChunkIndex];
      return list.filter(e => e >= start && e <= end);
    }
    return list;
  });
</script>

<div class="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur-sm">
  <div class="flex items-center justify-between">
    <h3 class="font-bold text-white text-sm font-display tracking-wide">Daftar Episode</h3>
    <span class="text-2xs text-amber-400 font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
      {#if hasPaheData}
        {paheEpisodes!.length} eps
      {:else}
        Total {totalEpisodes} eps
      {/if}
    </span>
  </div>

  <!-- Search / Quick Jump Filter -->
  {#if (hasPaheData ? paheEpisodes!.length : totalEpisodes) > 12}
    <div class="relative">
      <Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cari episode..."
        class="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition"
      />
    </div>
  {/if}

  <!-- Range Chunks (jika episode > 36) -->
  {#if chunks.length > 1 && !searchQuery.trim()}
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
      {#each chunks as chunk, idx}
        <button
          onclick={() => selectedChunkIndex = idx}
          class="text-2xs font-mono font-semibold px-2.5 py-1 rounded-lg border transition shrink-0
            {selectedChunkIndex === idx
              ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-sm'
              : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}"
        >
          {chunk.label}
        </button>
      {/each}
    </div>
  {/if}

  <div class="max-h-[460px] overflow-y-auto no-scrollbar pr-1 space-y-1.5">
    {#if hasPaheData}
      <!-- Mode AnimePahe: Snapshot + Judul Episode -->
      {#if displayedPaheEpisodes.length === 0}
        <p class="text-xs text-zinc-500 text-center py-6">Episode tidak ditemukan</p>
      {:else}
        {#each displayedPaheEpisodes as ep}
          <button
            onclick={() => onSelectEpisode(ep.episode, ep.id)}
            class="w-full flex items-center gap-3 p-2 rounded-xl border transition text-left
              {ep.episode === currentEpisode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20 hover:text-white'}"
          >
            <!-- Snapshot thumbnail -->
            {#if ep.snapshot}
              <img
                src={ep.snapshot}
                alt="Ep {ep.episode}"
                class="w-16 h-9 rounded-lg object-cover shrink-0 bg-zinc-800"
                loading="lazy"
              />
            {:else}
              <div class="w-16 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <span class="text-xs font-bold text-zinc-500">{ep.episode}</span>
              </div>
            {/if}

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-2xs font-bold text-amber-500/90 font-mono">Ep {ep.episode}</span>
                {#if ep.filler}
                  <span class="text-3xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 font-bold">Filler</span>
                {/if}
              </div>
              {#if ep.title}
                <p class="text-xs font-medium truncate mt-0.5">{ep.title}</p>
              {/if}
              {#if ep.duration}
                <p class="text-2xs text-zinc-500 mt-0.5">{Math.floor(ep.duration / 60)}m {ep.duration % 60}s</p>
              {/if}
            </div>

            <!-- Indicator aktif -->
            {#if ep.episode === currentEpisode}
              <div class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse"></div>
            {/if}
          </button>
        {/each}
      {/if}

    {:else}
      <!-- Mode fallback: Grid angka responsif -->
      {#if displayedFallbackEpisodes.length === 0}
        <p class="text-xs text-zinc-500 text-center py-6">Episode tidak ditemukan</p>
      {:else}
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {#each displayedFallbackEpisodes as ep}
            <button
              onclick={() => onSelectEpisode(ep)}
              class="h-10 rounded-xl font-bold font-mono text-xs transition border flex items-center justify-center
                {ep === currentEpisode
                  ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20 scale-105 font-black'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20 hover:text-white'}"
            >
              {ep}
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
