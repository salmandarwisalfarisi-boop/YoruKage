<script lang="ts">
  import type { AnimeMedia } from '$lib/types/anime';
  import { formatScore, cleanDescription } from '$lib/utils/format';
  import { Play, Sparkles, Star } from 'lucide-svelte';

  let { media }: { media: AnimeMedia } = $props();
</script>

<div class="relative overflow-hidden rounded-[1.75rem] bg-white/[0.04] border border-white/10 p-1.5 shadow-2xl shadow-black/80">
  <!-- Hairline top border -->
  <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
  
  <!-- Orb glow effect -->
  <div class="absolute -top-1/3 -left-1/4 h-[120%] w-2/3 rounded-full bg-amber-500/15 opacity-60 blur-[80px] pointer-events-none"></div>

  <!-- Inner container with nested radius -->
  <div class="relative overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-[#0d0d0d]/90 p-5 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col md:flex-row items-center gap-6 sm:gap-8">
    <!-- Cover Portrait Left -->
    <a href="/anime/info/{media.id}" class="relative shrink-0 group aspect-[2/3] w-48 sm:w-56 rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
      <img
        src={media.coverImage.extraLarge || media.coverImage.large}
        alt={media.title.userPreferred}
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div class="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
          <Play class="w-6 h-6 fill-current ml-0.5" />
        </div>
      </div>
    </a>

    <!-- Info Right -->
    <div class="flex-1 space-y-4 text-center md:text-left min-w-0">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-2xs font-bold uppercase tracking-widest">
        <Sparkles class="w-3.5 h-3.5" />
        Editor's Spotlight
      </div>

      <h3 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight font-display">
        {media.title.userPreferred}
      </h3>

      <!-- Metadata pills -->
      <div class="flex items-center justify-center md:justify-start gap-2 flex-wrap text-xs font-semibold text-zinc-300">
        {#if media.averageScore}
          <span class="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Star class="w-3.5 h-3.5 fill-current" />
            {formatScore(media.averageScore)}
          </span>
        {/if}
        <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 uppercase text-zinc-300">{media.format || 'TV'}</span>
        {#if media.seasonYear}
          <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">{media.seasonYear}</span>
        {/if}
        {#if media.episodes}
          <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">{media.episodes} Episodes</span>
        {/if}
        <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{media.status || 'Finished'}</span>
      </div>

      <!-- Genres -->
      {#if media.genres && media.genres.length > 0}
        <div class="flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
          {#each media.genres as genre}
            <span class="text-2xs font-medium px-2.5 py-1 rounded-md bg-white/5 text-zinc-400 border border-white/5">
              {genre}
            </span>
          {/each}
        </div>
      {/if}

      <!-- Description -->
      <p class="text-sm text-zinc-400 line-clamp-3 leading-relaxed max-w-2xl">
        {cleanDescription(media.description)}
      </p>

      <!-- CTA Buttons -->
      <div class="pt-2 flex items-center justify-center md:justify-start gap-3">
        <a
          href="/anime/watch/{media.id}"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition shadow-lg shadow-amber-500/25 active:scale-95"
        >
          <Play class="w-4 h-4 fill-current" />
          Watch Now
        </a>
        <a
          href="/anime/info/{media.id}"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition border border-white/10"
        >
          More Details
        </a>
      </div>
    </div>
  </div>
</div>
