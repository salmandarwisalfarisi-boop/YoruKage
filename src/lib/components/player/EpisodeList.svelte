<script lang="ts">
  interface Props {
    totalEpisodes: number;
    currentEpisode: number;
    onSelectEpisode: (ep: number) => void;
  }

  let { totalEpisodes = 12, currentEpisode = 1, onSelectEpisode }: Props = $props();

  const episodes = $derived(Array.from({ length: totalEpisodes }, (_, i) => i + 1));
</script>

<div class="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="font-bold text-white text-sm font-display">Episodes</h3>
    <span class="text-2xs text-zinc-400 font-mono">1 - {totalEpisodes}</span>
  </div>

  <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
    {#each episodes as ep}
      <button
        onclick={() => onSelectEpisode(ep)}
        class="h-10 rounded-xl font-bold text-xs transition border flex items-center justify-center {ep === currentEpisode
          ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20 scale-105'
          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'}"
      >
        {ep}
      </button>
    {/each}
  </div>
</div>
