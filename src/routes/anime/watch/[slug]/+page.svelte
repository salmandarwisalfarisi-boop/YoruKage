<script lang="ts">
  import type { PageData } from './$types';
  import VideoPlayer from '$lib/components/player/VideoPlayer.svelte';
  import EpisodeList from '$lib/components/player/EpisodeList.svelte';
  import Footer from '$lib/components/nav/Footer.svelte';
  import { goto } from '$app/navigation';
  import { Server, ChevronLeft, ChevronRight, Info, Heart } from 'lucide-svelte';
  import { userStore } from '$lib/stores/auth.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { cleanDescription } from '$lib/utils/format';

  let { data }: { data: PageData } = $props();
  const media = $derived(data.media);
  let currentEpisode = $state(data.currentEpisode);

  $effect(() => {
    currentEpisode = data.currentEpisode;
  });

  const servers = [
    { name: 'Server 1 (Sub)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'Server 2 (Dub)', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
    { name: 'Server 3 (Backup)', url: 'https://cdn.jwplayer.com/manifests/p13zPq7y.m3u8' }
  ];

  let selectedServerIndex = $state(0);
  const streamUrl = $derived(servers[selectedServerIndex].url);

  function handleSelectEpisode(ep: number) {
    currentEpisode = ep;
    if (media) {
      goto(`/anime/watch/${media.id}?ep=${ep}`);
    }
  }

  function handleNextEpisode() {
    if (media && currentEpisode < (media.episodes || 12)) {
      handleSelectEpisode(currentEpisode + 1);
    }
  }

  function handlePrevEpisode() {
    if (media && currentEpisode > 1) {
      handleSelectEpisode(currentEpisode - 1);
    }
  }
</script>

{#if media}
  <div class="pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 space-y-8 min-h-screen">
    <!-- Breadcrumb Header -->
    <div class="flex items-center justify-between text-xs text-zinc-400">
      <a href="/anime/info/{media.id}" class="hover:text-amber-400 transition flex items-center gap-1 font-semibold">
        ← Back to Info Page
      </a>
      <span class="font-mono text-zinc-500">Currently Streaming Ep {currentEpisode}</span>
    </div>

    <!-- Main Player Grid (Player Left, Sidebar Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Player Section Left (Span 2 cols on lg) -->
      <div class="lg:col-span-2 space-y-4">
        <VideoPlayer
          src={streamUrl}
          title="{media.title.userPreferred} - Episode {currentEpisode}"
          animeId={media.id}
          episodeNumber={currentEpisode}
          coverImage={media.coverImage.extraLarge || media.coverImage.large}
          onNextEpisode={handleNextEpisode}
        />

        <!-- Controls Bar Under Player -->
        <div class="bg-[#141414] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <!-- Prev / Next Episode Nav -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              disabled={currentEpisode <= 1}
              onclick={handlePrevEpisode}
              class="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
            >
              <ChevronLeft class="w-4 h-4" /> Prev Ep
            </button>
            <button
              disabled={currentEpisode >= (media.episodes || 12)}
              onclick={handleNextEpisode}
              class="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 disabled:opacity-30 transition shadow-md shadow-amber-500/20"
            >
              Next Ep <ChevronRight class="w-4 h-4" />
            </button>
          </div>

          <!-- Server Switcher -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <Server class="w-4 h-4 text-amber-500 shrink-0" />
            <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {#each servers as server, idx}
                <button
                  onclick={() => (selectedServerIndex = idx)}
                  class="px-3 py-1 rounded-full text-2xs font-bold transition border {idx === selectedServerIndex
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}"
                >
                  {server.name}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Episode Selector Sidebar Right -->
      <div class="space-y-4">
        <EpisodeList
          totalEpisodes={media.episodes || 12}
          currentEpisode={currentEpisode}
          onSelectEpisode={handleSelectEpisode}
        />
      </div>
    </div>

    <!-- Info Panel Below Player -->
    <div class="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-white font-display">
            {media.title.userPreferred}
          </h1>
          <p class="text-xs text-amber-400 font-bold mt-0.5">
            Streaming Episode {currentEpisode} of {media.episodes || 12}
          </p>
        </div>

        <button
          onclick={() => {
            if (!media) return;
            userStore.toggleFavorite({
              id: media.id,
              title: media.title.userPreferred,
              coverImage: media.coverImage.extraLarge || media.coverImage.large || '',
              format: media.format
            });
            uiStore.showToast(userStore.isFavorite(media.id) ? 'Added to Favorites' : 'Removed', 'info');
          }}
          class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition"
        >
          <Heart class="w-4 h-4 {userStore.isFavorite(media.id) ? 'fill-rose-500 text-rose-500' : ''}" />
          Favorite
        </button>
      </div>

      <p class="text-sm text-zinc-400 leading-relaxed max-w-4xl">
        {cleanDescription(media.description)}
      </p>
    </div>

    <Footer />
  </div>
{:else}
  <div class="py-32 text-center text-zinc-400">
    Anime stream not found.
  </div>
{/if}
