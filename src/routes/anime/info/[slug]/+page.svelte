<script lang="ts">
  import type { PageData } from './$types';
  import Footer from '$lib/components/nav/Footer.svelte';
  import EpisodeList from '$lib/components/player/EpisodeList.svelte';
  import AnimeCard from '$lib/components/cards/AnimeCard.svelte';
  import HorizontalScroller from '$lib/components/sections/HorizontalScroller.svelte';
  import { userStore } from '$lib/stores/auth.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { formatScore, formatFormat, formatStatus, cleanDescription } from '$lib/utils/format';
  import { Play, Heart, Star, Calendar, Clock, Tv, Film, Video, X } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();
  const media = $derived(data.media);

  let isExpanded = $state(false);
  let showTrailer = $state(false);

  function toggleFav() {
    if (!media) return;
    userStore.toggleFavorite({
      id: media.id,
      title: media.title.userPreferred,
      coverImage: media.coverImage.extraLarge || media.coverImage.large || '',
      format: media.format
    });
    const isFav = userStore.isFavorite(media.id);
    uiStore.showToast(isFav ? 'Added to Favorites' : 'Removed from Favorites', isFav ? 'success' : 'info');
  }

  function handleSelectEpisode(ep: number) {
    if (!media) return;
    goto(`/anime/watch/${media.id}?ep=${ep}`);
  }
</script>

{#if media}
  <div class="space-y-12">
    <!-- Banner Header with Gradient Overlay -->
    <div class="relative w-full h-[45vh] min-h-[380px] overflow-hidden bg-[#0d0d0d]">
      <img
        src={media.bannerImage || media.coverImage.extraLarge}
        alt={media.title.userPreferred}
        class="h-full w-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent"></div>
    </div>

    <!-- Main Content Container (Negative margin top to overlap banner) -->
    <div class="max-w-7xl mx-auto px-6 -mt-32 relative z-10 space-y-12">
      <!-- Media Header Row -->
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <!-- Cover Image -->
        <div class="shrink-0 aspect-[2/3] w-48 sm:w-60 rounded-2xl overflow-hidden border-2 border-white/15 bg-[#141414] shadow-2xl mx-auto md:mx-0">
          <img src={media.coverImage.extraLarge || media.coverImage.large} alt={media.title.userPreferred} class="h-full w-full object-cover" />
        </div>

        <!-- Info Details -->
        <div class="flex-1 space-y-4 text-center md:text-left">
          <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
            {media.title.userPreferred}
          </h1>
          {#if media.title.native || media.title.english}
            <p class="text-sm text-zinc-400 font-mono">
              {media.title.english || media.title.native}
            </p>
          {/if}

          <!-- Metadata Badges -->
          <div class="flex items-center justify-center md:justify-start gap-2.5 flex-wrap text-xs font-semibold">
            {#if media.averageScore}
              <span class="flex items-center gap-1 text-amber-400 font-extrabold bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                <Star class="w-4 h-4 fill-current" />
                ★ {formatScore(media.averageScore)} / 10
              </span>
            {/if}
            <span class="px-3 py-1.5 rounded-full bg-white/10 text-white uppercase">{formatFormat(media.format)}</span>
            <span class="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{formatStatus(media.status)}</span>
            {#if media.seasonYear}
              <span class="px-3 py-1.5 rounded-full bg-white/10 text-zinc-300">{media.season} {media.seasonYear}</span>
            {/if}
            {#if media.episodes}
              <span class="px-3 py-1.5 rounded-full bg-white/10 text-zinc-300">{media.episodes} Episodes</span>
            {/if}
            {#if media.duration}
              <span class="px-3 py-1.5 rounded-full bg-white/10 text-zinc-300">{media.duration} mins/ep</span>
            {/if}
          </div>

          <!-- Genre Pills -->
          {#if media.genres && media.genres.length > 0}
            <div class="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              {#each media.genres as genre}
                <span class="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {genre}
                </span>
              {/each}
            </div>
          {/if}

          <!-- Action CTA Buttons -->
          <div class="pt-2 flex items-center justify-center md:justify-start gap-4">
            <a
              href="/anime/watch/{media.id}"
              class="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-amber-500 text-black font-extrabold text-base hover:bg-amber-400 transition shadow-xl shadow-amber-500/20 active:scale-95"
            >
              <Play class="w-5 h-5 fill-current" /> Watch Now
            </a>

            <button
              onclick={toggleFav}
              class="p-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition text-white"
              title="Bookmark / Favorite"
            >
              <Heart class="w-5 h-5 {userStore.isFavorite(media.id) ? 'fill-rose-500 text-rose-500' : ''}" />
            </button>

            {#if media.trailer?.id && media.trailer.site === 'youtube'}
              <button
                onclick={() => (showTrailer = true)}
                class="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition text-sm font-semibold"
              >
                <Video class="w-5 h-5" /> Trailer
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Synopsis Section -->
      <section class="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl">
        <h3 class="font-bold text-lg text-white font-display">Synopsis</h3>
        <p class="text-sm text-zinc-300 leading-relaxed font-sans {isExpanded ? '' : 'line-clamp-4'}">
          {cleanDescription(media.description)}
        </p>
        {#if media.description && media.description.length > 200}
          <button
            onclick={() => (isExpanded = !isExpanded)}
            class="text-xs font-bold text-amber-400 hover:underline pt-1"
          >
            {isExpanded ? 'Show Less ▲' : 'Read More ▼'}
          </button>
        {/if}
      </section>

      <!-- Episode Selector Grid -->
      <section>
        <EpisodeList totalEpisodes={media.episodes || 12} currentEpisode={1} onSelectEpisode={handleSelectEpisode} />
      </section>

      <!-- Characters Scroller -->
      {#if media.characters?.edges && media.characters.edges.length > 0}
        <section class="space-y-4">
          <h3 class="font-bold text-xl text-white font-display">Characters & Voice Actors</h3>
          <HorizontalScroller>
            {#each media.characters.edges as char}
              <div class="shrink-0 w-32 bg-[#141414] border border-white/10 rounded-2xl overflow-hidden text-center p-2 space-y-1.5">
                <img src={char.node.image.large} alt={char.node.name.full} class="w-full aspect-square object-cover rounded-xl" />
                <span class="block font-semibold text-xs text-white truncate px-1">{char.node.name.full}</span>
                <span class="block text-2xs text-amber-400 uppercase font-medium">{char.role}</span>
              </div>
            {/each}
          </HorizontalScroller>
        </section>
      {/if}

      <!-- Recommendations Grid -->
      {#if media.recommendations?.nodes && media.recommendations.nodes.length > 0}
        <section class="space-y-4">
          <h3 class="font-bold text-xl text-white font-display">You Might Also Like</h3>
          <HorizontalScroller>
            {#each media.recommendations.nodes as rec}
              {#if rec.mediaRecommendation}
                <AnimeCard media={rec.mediaRecommendation} />
              {/if}
            {/each}
          </HorizontalScroller>
        </section>
      {/if}
    </div>

    <!-- YouTube Trailer Modal -->
    {#if showTrailer && media.trailer?.id}
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <button
            onclick={() => (showTrailer = false)}
            class="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
          >
            <X class="w-6 h-6" />
          </button>
          <iframe
            src="https://www.youtube.com/embed/{media.trailer.id}?autoplay=1"
            title="Anime Trailer"
            class="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    {/if}

    <Footer />
  </div>
{:else}
  <div class="py-32 text-center text-zinc-400">
    Anime details not found.
  </div>
{/if}
