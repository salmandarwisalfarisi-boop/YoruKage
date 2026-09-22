<script lang="ts">
  import type { AnimeMedia } from '$lib/types/anime';
  import { formatScore, formatFormat } from '$lib/utils/format';
  import { Star } from 'lucide-svelte';

  let { media, rank }: { media: AnimeMedia; rank: number } = $props();

  const rankColors: Record<number, string> = {
    1: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    2: 'text-zinc-300 bg-zinc-400/10 border-zinc-400/30',
    3: 'text-amber-600 bg-amber-700/10 border-amber-700/30'
  };
  const defaultRankColor = 'text-zinc-500 bg-white/5 border-white/10';
</script>

<a
  href="/anime/info/{media.id}"
  class="group flex items-center gap-4 p-2.5 rounded-2xl bg-[#141414]/60 border border-white/5 hover:border-white/15 hover:bg-white/5 transition duration-200"
>
  <!-- Rank badge -->
  <div class="h-10 w-10 shrink-0 rounded-xl border font-extrabold text-base flex items-center justify-center font-display shadow-inner {rankColors[rank] || defaultRankColor}">
    #{rank}
  </div>

  <!-- Cover Image -->
  <img
    src={media.coverImage.large || media.coverImage.extraLarge}
    alt={media.title.userPreferred}
    class="h-16 w-12 object-cover rounded-xl shrink-0 shadow border border-white/10 group-hover:scale-105 transition-transform"
  />

  <!-- Info -->
  <div class="flex-1 min-w-0">
    <h4 class="font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate font-display">
      {media.title.userPreferred}
    </h4>
    <div class="flex items-center gap-2 text-2xs text-zinc-400 mt-1">
      <span class="uppercase font-semibold text-amber-500">{formatFormat(media.format)}</span>
      <span>•</span>
      <span>{media.episodes ? `${media.episodes} Ep` : 'N/A'}</span>
      {#if media.averageScore}
        <span>•</span>
        <span class="flex items-center gap-0.5 font-bold text-amber-400">
          <Star class="w-3 h-3 fill-current" />
          {formatScore(media.averageScore)}
        </span>
      {/if}
    </div>
  </div>
</a>
