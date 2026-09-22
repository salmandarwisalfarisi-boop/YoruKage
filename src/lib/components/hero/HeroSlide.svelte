<script lang="ts">
  import type { AnimeMedia } from '$lib/types/anime';
  import { formatScore, formatFormat, cleanDescription } from '$lib/utils/format';
  import { Play, Info, Star, Calendar, Clock, Tv } from 'lucide-svelte';

  let { media, active }: { media: AnimeMedia; active: boolean } = $props();
</script>

<div
  class="absolute inset-0 transition-opacity duration-700 ease-in-out {active ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}"
>
  <!-- Background Image / Banner -->
  <div class="absolute inset-0">
    <img
      src={media.bannerImage || media.coverImage.extraLarge}
      alt={media.title.userPreferred}
      class="h-full w-full object-cover object-center"
      fetchpriority={active ? 'high' : 'low'}
    />
  </div>

  <!-- 3-Layer Gradient Overlay per Spec -->
  <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
  <div class="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent w-full md:w-3/4"></div>
  <div class="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-transparent h-32"></div>

  <!-- Slide Content -->
  <div class="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-16 sm:pb-20 z-20">
    <div class="max-w-2xl space-y-4">
      <!-- Format & Status badge -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="px-3 py-1 rounded-full bg-amber-500 text-black text-2xs font-extrabold uppercase tracking-wider shadow">
          #1 Trending
        </span>
        {#if media.averageScore}
          <span class="flex items-center gap-1 text-amber-400 font-extrabold text-xs bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30">
            <Star class="w-3.5 h-3.5 fill-current" />
            {formatScore(media.averageScore)}
          </span>
        {/if}
      </div>

      <!-- Title -->
      <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-lg font-display">
        {media.title.userPreferred}
      </h1>

      <!-- Meta Pills -->
      <div class="flex items-center gap-3 text-xs font-semibold text-zinc-300 flex-wrap">
        <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
          <Tv class="w-3.5 h-3.5 text-amber-400" />
          {formatFormat(media.format)}
        </span>
        {#if media.seasonYear}
          <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
            <Calendar class="w-3.5 h-3.5 text-amber-400" />
            {media.seasonYear}
          </span>
        {/if}
        {#if media.episodes}
          <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
            {media.episodes} Episodes
          </span>
        {/if}
        {#if media.duration}
          <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
            <Clock class="w-3.5 h-3.5 text-amber-400" />
            {media.duration}m / ep
          </span>
        {/if}
      </div>

      <!-- Genre Pills -->
      {#if media.genres && media.genres.length > 0}
        <div class="flex items-center gap-2 flex-wrap">
          {#each media.genres.slice(0, 4) as genre}
            <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {genre}
            </span>
          {/each}
        </div>
      {/if}

      <!-- 2-Line Description -->
      <p class="text-sm sm:text-base text-zinc-300 line-clamp-2 max-w-xl leading-relaxed drop-shadow">
        {cleanDescription(media.description)}
      </p>

      <!-- CTA Buttons -->
      <div class="pt-2 flex items-center gap-4">
        <a
          href="/anime/watch/{media.id}"
          class="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-amber-500 text-black font-extrabold text-sm sm:text-base hover:bg-amber-400 transition-transform active:scale-95 shadow-xl shadow-amber-500/20"
        >
          <Play class="w-5 h-5 fill-current" />
          Watch Now
        </a>
        <a
          href="/anime/info/{media.id}"
          class="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 text-white font-bold text-sm sm:text-base hover:bg-white/20 backdrop-blur-md transition border border-white/15"
        >
          <Info class="w-5 h-5" />
          More Info
        </a>
      </div>
    </div>
  </div>
</div>
