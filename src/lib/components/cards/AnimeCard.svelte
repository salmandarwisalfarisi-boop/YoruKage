<script lang="ts">
  import type { AnimeMedia } from '$lib/types/anime';
  import { formatFormat, formatStatus, formatScore } from '$lib/utils/format';

  let { media }: { media: AnimeMedia } = $props();
</script>

<a
  href="/anime/info/{media.id}"
  class="group relative block w-40 sm:w-48 lg:w-56 shrink-0 transition-transform duration-300 hover:-translate-y-1.5 focus:outline-none"
>
  <!-- Top Right Status/Episode Pill -->
  {#if media.nextAiringEpisode}
    <div class="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/80 px-2.5 py-0.5 backdrop-blur-md shadow-md">
      <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-2xs font-bold text-emerald-300">Ep {media.nextAiringEpisode.episode}</span>
    </div>
  {:else if media.averageScore}
    <div class="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full border border-amber-500/30 bg-black/80 px-2 py-0.5 backdrop-blur-md shadow-md">
      <span class="text-2xs font-extrabold text-amber-400">★ {formatScore(media.averageScore)}</span>
    </div>
  {/if}

  <!-- Card Cover -->
  <div class="relative aspect-[2/3] w-full overflow-hidden rounded-[0.75rem] border border-white/10 bg-[#141414] shadow-lg shadow-black/60">
    <img
      src={media.coverImage.extraLarge || media.coverImage.large}
      alt={media.title.userPreferred}
      loading="lazy"
      width="230"
      height="345"
      class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    
    <!-- Hover Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
      <div class="text-2xs font-medium text-zinc-300 flex items-center gap-1.5 flex-wrap">
        <span class="uppercase font-bold text-amber-400">{formatFormat(media.format)}</span>
        <span>•</span>
        <span class="font-semibold text-emerald-400">{formatStatus(media.status)}</span>
        {#if media.episodes}
          <span>•</span>
          <span>{media.episodes} Ep</span>
        {/if}
      </div>
      {#if media.genres && media.genres.length > 0}
        <div class="flex items-center gap-1 flex-wrap mt-1.5">
          {#each media.genres.slice(0, 2) as genre}
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-medium">{genre}</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Title -->
  <span class="mt-2 block font-medium text-sm text-zinc-200 group-hover:text-amber-400 transition-colors line-clamp-1 font-display">
    {media.title.userPreferred}
  </span>
</a>
