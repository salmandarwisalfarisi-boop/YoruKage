<script lang="ts">
  import type { PageData } from './$types';
  import VideoPlayer from '$lib/components/player/VideoPlayer.svelte';
  import EpisodeList from '$lib/components/player/EpisodeList.svelte';
  import Footer from '$lib/components/nav/Footer.svelte';
  import { goto } from '$app/navigation';
  import {
    Server,
    ChevronLeft,
    ChevronRight,
    Heart,
    RotateCcw,
    ExternalLink,
    Maximize2,
    Minimize2,
    Tv,
    Layers,
    Sparkles,
    AlertCircle,
    Check,
    Link as LinkIcon
  } from 'lucide-svelte';
  import { userStore } from '$lib/stores/auth.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { cleanDescription } from '$lib/utils/format';

  interface AnimePaheServer {
    id: string;
    label: string;
    quality: string | null;
    audio: string | null;
    url: string;
  }

  interface EmbedProvider {
    id: string;
    name: string;
    tag: string;
    description: string;
    getUrl: (animeId: number, ep: number) => string;
  }

  let { data }: { data: PageData } = $props();
  const media = $derived(data.media);
  const pahe = $derived(data.pahe);
  const mappings = $derived(data.mappings);
  const totalEpisodes = $derived(data.totalEpisodes || media?.episodes || 12);

  // svelte-ignore state_referenced_locally
  let currentEpisode = $state(data.currentEpisode);
  let isTheaterMode = $state(false);
  let isFullscreen = $state(false);
  let playerContainer = $state<HTMLDivElement | null>(null);
  let customUrlInput = $state('');
  let showCustomUrlModal = $state(false);

  function toggleFullscreen() {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      if (playerContainer?.requestFullscreen) {
        playerContainer.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  $effect(() => {
    if (typeof document === 'undefined') return;
    function onFsChange() {
      isFullscreen = Boolean(document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  });

  $effect(() => {
    currentEpisode = data.currentEpisode;
  });

  const tmdbId = $derived(mappings?.tmdbId || String(media?.id || ''));
  const isMovie = $derived(mappings?.type?.toUpperCase() === 'MOVIE');

  // ─── Provider Embed Eksternal Universal (Menggunakan TMDB ID Resmi) ────
  const EMBED_PROVIDERS = $derived<EmbedProvider[]>([
    {
      id: 'vidsrc-alpha',
      name: 'VidSrc Alpha',
      tag: 'HD · Cepat',
      description: 'Server utama streaming anime multi-resolusi',
      getUrl: (_id, ep) =>
        isMovie
          ? `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`
          : `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=1&episode=${ep}`
    },
    {
      id: 'vidsrc-prime',
      name: 'VidSrc Prime',
      tag: 'HD · Mirror',
      description: 'Mirror cadangan berkecepatan tinggi',
      getUrl: (_id, ep) =>
        isMovie
          ? `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}`
          : `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=1&episode=${ep}`
    },
    {
      id: 'multiembed',
      name: 'MultiEmbed VIP',
      tag: 'Rekomendasi',
      description: 'Server multi-sumber dengan kontrol minim iklan',
      getUrl: (_id, ep) =>
        isMovie
          ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
          : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=1&e=${ep}`
    },
    {
      id: 'vidsrc-to',
      name: 'VidSrc Cloud',
      tag: 'Multi-Server',
      description: 'Server cloud alternatif tanpa batasan',
      getUrl: (_id, ep) =>
        isMovie
          ? `https://vidsrc.to/embed/movie/${tmdbId}`
          : `https://vidsrc.to/embed/tv/${tmdbId}/1/${ep}`
    },
    {
      id: '2embed',
      name: '2Embed Multi',
      tag: 'Multi-Sub',
      description: 'Dukungan berbagai bahasa teks terjemahan',
      getUrl: (_id, ep) =>
        isMovie
          ? `https://2embed.cc/embed/movie/${tmdbId}`
          : `https://2embed.cc/embed/tv/${tmdbId}/1/${ep}`
    }
  ]);

  let selectedServerType = $state<'embed' | 'pahe' | 'custom'>('embed');
  let selectedEmbedProviderId = $state<string>('multiembed');
  let customStreamUrl = $state<string | null>(null);

  // ─── Pelindung Anti-Redirect Halaman Utama ────────────────────────
  $effect(() => {
    if (typeof window === 'undefined') return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      // Cegah iframe pihak ketiga membajak URL halaman utama secara sepihak
      e.preventDefault();
      return '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  // ─── AnimePahe state (jika berhasil terhubung) ───────────────────
  let paheServers = $state<AnimePaheServer[]>([]);
  let selectedPaheServerIdx = $state(0);
  let paheStreamUrl = $state<string | null>(null);
  let paheIframeSrc = $state<string | null>(null);
  let paheLoading = $state(false);
  let paheError = $state<string | null>(null);

  // ─── Iframe Refresh Key ──────────────────────────────────────────
  let iframeKey = $state(0);

  function reloadIframe() {
    iframeKey += 1;
    uiStore.showToast('Memuat ulang player...', 'info');
  }

  // ─── URL Iframe Aktif ─────────────────────────────────────────────
  const currentIframeUrl = $derived.by(() => {
    if (selectedServerType === 'custom' && customStreamUrl) {
      return customStreamUrl;
    }
    if (selectedServerType === 'pahe') {
      return paheIframeSrc;
    }
    const provider = EMBED_PROVIDERS.find((p) => p.id === selectedEmbedProviderId) || EMBED_PROVIDERS[0];
    return media?.id ? provider.getUrl(media.id, currentEpisode) : null;
  });

  // ─── Penanganan Pergantian Episode ──────────────────────────────
  function handleSelectEpisode(epNum: number, paheEpId?: string) {
    currentEpisode = epNum;
    goto(`?ep=${epNum}`, { replaceState: true, noScroll: true });
    iframeKey += 1;

    // Jika mode AnimePahe aktif, coba load server baru
    if (pahe.animeSession && paheEpId) {
      loadPaheServers(paheEpId);
    }
  }

  function handleNextEpisode() {
    if (currentEpisode < totalEpisodes) {
      handleSelectEpisode(currentEpisode + 1);
    }
  }

  function handlePrevEpisode() {
    if (currentEpisode > 1) {
      handleSelectEpisode(currentEpisode - 1);
    }
  }

  // ─── Fetch AnimePahe (opsional/ekstra) ─────────────────────────────
  async function loadPaheServers(epId: string) {
    if (!pahe.animeSession) return;
    paheLoading = true;
    paheError = null;
    paheServers = [];
    paheStreamUrl = null;
    paheIframeSrc = null;

    try {
      const res = await fetch(
        `/api/anime/pahe/servers?animeSession=${pahe.animeSession}&epSession=${epId}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat server AnimePahe');
      paheServers = json.data ?? [];
      selectedPaheServerIdx = 0;
      if (paheServers.length > 0) {
        await extractPaheKwik(paheServers[0].url);
      }
    } catch (err: any) {
      paheError = err.message || 'Gagal memuat AnimePahe';
    } finally {
      paheLoading = false;
    }
  }

  async function extractPaheKwik(kwikUrl: string) {
    paheLoading = true;
    try {
      const res = await fetch(`/api/anime/pahe/extract?url=${encodeURIComponent(kwikUrl)}`);
      const json = await res.json();
      if (res.ok && json.streamUrl) {
        paheStreamUrl = json.streamUrl;
      } else {
        paheIframeSrc = kwikUrl;
      }
    } catch {
      paheIframeSrc = kwikUrl;
    } finally {
      paheLoading = false;
    }
  }

  function applyCustomUrl() {
    if (!customUrlInput.trim()) return;
    customStreamUrl = customUrlInput.trim();
    selectedServerType = 'custom';
    showCustomUrlModal = false;
    iframeKey += 1;
    uiStore.showToast('Memutar custom link', 'success');
  }

  // Cek apakah anime di-favoritkan
  const isFavorite = $derived(
    media ? userStore.isFavorite(media.id) : false
  );

  function handleToggleFavorite() {
    if (!media) return;
    userStore.toggleFavorite({
      id: media.id,
      title: media.title.userPreferred || media.title.romaji || '',
      coverImage: media.coverImage.large || media.coverImage.extraLarge || '',
      format: media.format || 'TV'
    });
    uiStore.showToast(
      isFavorite ? 'Dihapus dari favorit' : 'Disimpan ke favorit',
      isFavorite ? 'info' : 'success'
    );
  }
</script>

{#if media}
  <div class="pt-20 pb-16 min-h-screen bg-[#0a0a0a] text-zinc-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

      <!-- Breadcrumbs & Episode Indicator -->
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <div class="flex items-center gap-2">
          <a
            href="/anime/info/{media.id}"
            class="hover:text-amber-400 transition font-semibold flex items-center gap-1.5"
          >
            <ChevronLeft class="w-4 h-4" /> Info Anime
          </a>
          <span class="text-zinc-600">/</span>
          <span class="text-white font-medium truncate max-w-[200px] sm:max-w-md">
            {media.title.userPreferred || media.title.romaji}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs">
            Episode {currentEpisode} / {totalEpisodes}
          </span>
          <button
            onclick={() => isTheaterMode = !isTheaterMode}
            class="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition text-2xs"
            title="Toggle Theater Mode"
          >
            {#if isTheaterMode}
              <Minimize2 class="w-3.5 h-3.5" /> Normal
            {:else}
              <Maximize2 class="w-3.5 h-3.5" /> Teater
            {/if}
          </button>
        </div>
      </div>

      <!-- ── SERVER SELECTOR BAR ────────────────────────────────────── -->
      <div class="bg-[#141414] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Server class="w-4 h-4 text-amber-400" />
            <span class="text-xs font-bold text-white tracking-wide uppercase">Pilih Server Embed:</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Universal Embed Servers -->
            {#each EMBED_PROVIDERS as provider}
              <button
                onclick={() => {
                  selectedServerType = 'embed';
                  selectedEmbedProviderId = provider.id;
                  iframeKey += 1;
                }}
                class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition
                  {selectedServerType === 'embed' && selectedEmbedProviderId === provider.id
                    ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'}"
              >
                <span>{provider.name}</span>
                <span class="text-3xs px-1.5 py-0.2 rounded font-mono uppercase {selectedServerType === 'embed' && selectedEmbedProviderId === provider.id ? 'bg-black/20 text-black font-black' : 'bg-white/10 text-zinc-400'}">
                  {provider.tag}
                </span>
              </button>
            {/each}

            <!-- AnimePahe Option jika session tersedia -->
            {#if pahe.animeSession}
              <button
                onclick={() => {
                  selectedServerType = 'pahe';
                  iframeKey += 1;
                }}
                class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition
                  {selectedServerType === 'pahe'
                    ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'}"
              >
                <span>AnimePahe</span>
                <span class="text-3xs px-1.5 py-0.2 rounded font-mono uppercase bg-amber-500/20 text-amber-300 font-black">
                  Kwik
                </span>
              </button>
            {/if}

            <!-- Custom URL Button -->
            <button
              onclick={() => showCustomUrlModal = !showCustomUrlModal}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
              title="Gunakan Link Streaming Sendiri"
            >
              <LinkIcon class="w-3.5 h-3.5" />
              <span>{selectedServerType === 'custom' ? 'Custom Link (Aktif)' : 'Custom Link'}</span>
            </button>
          </div>
        </div>

        <!-- Custom URL Input (jika dibuka) -->
        {#if showCustomUrlModal}
          <div class="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2 animate-in fade-in duration-200">
            <input
              type="text"
              bind:value={customUrlInput}
              placeholder="Tempel URL embed atau direct stream (https://...)"
              class="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onclick={applyCustomUrl}
              class="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition"
            >
              Putar Link Ini
            </button>
          </div>
        {/if}
      </div>

      <!-- ── MAIN VIDEO & EPISODE GRID ──────────────────────────────── -->
      <div class="grid grid-cols-1 {isTheaterMode ? 'gap-6' : 'lg:grid-cols-3 gap-6'}">

        <!-- ── Left Column: Video Player ── -->
        <div class="{isTheaterMode ? 'w-full' : 'lg:col-span-2'} space-y-4">

          <!-- Player Container -->
          <div bind:this={playerContainer} class="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/15 shadow-2xl">

            {#if selectedServerType === 'pahe' && paheStreamUrl}
              <!-- Native HLS VideoPlayer untuk direct Kwik stream -->
              <VideoPlayer
                src={paheStreamUrl}
                title="{media.title.userPreferred || media.title.romaji} - Episode {currentEpisode}"
                animeId={media.id}
                episodeNumber={currentEpisode}
                coverImage={media.coverImage.extraLarge || media.coverImage.large}
                onNextEpisode={handleNextEpisode}
              />
            {:else if currentIframeUrl}
              <!-- Iframe Embed Player dengan Sandbox Anti-Popup & Izin Fullscreen Penuh -->
              {#key iframeKey}
                <iframe
                  src={currentIframeUrl}
                  title="{media.title.userPreferred || media.title.romaji} - Episode {currentEpisode}"
                  class="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *"
                  allowfullscreen
                ></iframe>
              {/key}
            {:else}
              <!-- Fallback no stream -->
              <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-3">
                <AlertCircle class="w-10 h-10 text-amber-500/70" />
                <p class="text-sm font-medium text-zinc-300">Pilih salah satu server di atas untuk mulai menonton</p>
              </div>
            {/if}

            <!-- Server Overlay Badge -->
            <div class="absolute top-3 right-3 pointer-events-none flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-2xs font-mono font-bold text-amber-400 shadow-lg">
                {#if selectedServerType === 'embed'}
                  {EMBED_PROVIDERS.find((p) => p.id === selectedEmbedProviderId)?.name}
                {:else if selectedServerType === 'pahe'}
                  AnimePahe (Kwik)
                {:else}
                  Custom Embed
                {/if}
              </span>
            </div>
          </div>

          <!-- Player Controls Bar -->
          <div class="bg-[#141414] border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <!-- Episode Prev/Next Navigation -->
            <div class="flex items-center gap-2">
              <button
                onclick={handlePrevEpisode}
                disabled={currentEpisode <= 1}
                class="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition font-medium"
              >
                <ChevronLeft class="w-4 h-4" /> Prev Ep
              </button>

              <button
                onclick={handleNextEpisode}
                disabled={currentEpisode >= totalEpisodes}
                class="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-40 disabled:pointer-events-none transition shadow-sm"
              >
                Next Ep <ChevronRight class="w-4 h-4" />
              </button>
            </div>

            <!-- Quick Player Actions -->
            <div class="flex items-center gap-2">
              <button
                onclick={toggleFullscreen}
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition font-medium"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
              >
                {#if isFullscreen}
                  <Minimize2 class="w-3.5 h-3.5 text-amber-400" />
                  <span>Keluar Full</span>
                {:else}
                  <Maximize2 class="w-3.5 h-3.5 text-amber-400" />
                  <span>Layar Penuh</span>
                {/if}
              </button>

              <button
                onclick={reloadIframe}
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
                title="Muat ulang pemutar jika buffering atau macet"
              >
                <RotateCcw class="w-3.5 h-3.5 text-amber-400" />
                <span>Reload</span>
              </button>

              <button
                onclick={handleToggleFavorite}
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition
                  {isFavorite
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 font-semibold'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'}"
              >
                <Heart class="w-3.5 h-3.5 {isFavorite ? 'fill-rose-500 text-rose-500' : ''}" />
                <span>{isFavorite ? 'Tersimpan' : 'Simpan'}</span>
              </button>
            </div>
          </div>

          <!-- Tips & Notice -->
          <div class="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-zinc-400">
            <Sparkles class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <p class="font-semibold text-zinc-200">Mode Embed Aktif (Bebas Blokir)</p>
              <p class="text-zinc-400 text-2xs leading-relaxed">
                Video diputar langsung melalui koneksi browser Anda tanpa melalui server perantara. Jika salah satu server mengalami buffering atau iklan berlebih, cukup klik tombol <span class="text-amber-400 font-semibold">VidSrc Alpha / VidSrc Prime / 2Embed</span> di atas untuk beralih instan.
              </p>
            </div>
          </div>

          <!-- Anime Details Card -->
          <div class="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={media.coverImage.large || media.coverImage.extraLarge}
                alt={media.title.userPreferred}
                class="w-20 h-28 object-cover rounded-xl shrink-0 bg-zinc-800 shadow-md"
              />
              <div class="space-y-1.5 flex-1 min-w-0">
                <h1 class="text-lg sm:text-xl font-bold text-white font-display tracking-tight">
                  {media.title.userPreferred || media.title.romaji}
                </h1>
                {#if media.title.native}
                  <p class="text-xs text-zinc-500 font-mono">{media.title.native}</p>
                {/if}
                <div class="flex flex-wrap items-center gap-2 pt-1">
                  {#if media.seasonYear}
                    <span class="text-2xs px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 font-mono font-medium">{media.seasonYear}</span>
                  {/if}
                  {#if media.averageScore}
                    <span class="text-2xs px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-bold">★ {media.averageScore}%</span>
                  {/if}
                  {#if media.status}
                    <span class="text-2xs px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 font-mono">{media.status}</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- External Watch Links -->
            <div class="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
              <span class="text-2xs text-zinc-500 font-bold uppercase tracking-wider">Tonton di Web Asli:</span>
              <a
                href="https://animepahe.ru/search?q={encodeURIComponent(media.title.romaji || media.title.english || '')}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-2xs text-amber-400 hover:text-amber-300 hover:underline"
              >
                AnimePahe <ExternalLink class="w-3 h-3" />
              </a>
              <a
                href="https://www.bilibili.tv/id/search-result?q={encodeURIComponent(media.title.userPreferred || media.title.romaji || '')}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-2xs text-sky-400 hover:text-sky-300 hover:underline"
              >
                Bstation <ExternalLink class="w-3 h-3" />
              </a>
              <a
                href="https://anilist.co/anime/{media.id}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-2xs text-zinc-400 hover:text-white hover:underline"
              >
                AniList <ExternalLink class="w-3 h-3" />
              </a>
            </div>

            {#if media.description}
              <div class="pt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                {cleanDescription(media.description)}
              </div>
            {/if}
          </div>
        </div>

        <!-- ── Right Column: Episode List ── -->
        <div class="{isTheaterMode ? 'w-full' : 'lg:col-span-1'} space-y-4">
          <EpisodeList
            paheEpisodes={pahe.episodes}
            totalEpisodes={totalEpisodes}
            currentEpisode={currentEpisode}
            onSelectEpisode={handleSelectEpisode}
          />
        </div>

      </div>

    </div>
  </div>

  <Footer />
{/if}
