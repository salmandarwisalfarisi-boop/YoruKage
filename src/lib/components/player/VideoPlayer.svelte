<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Hls from 'hls.js';
  import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    RotateCcw, RotateCw, Settings, SkipForward
  } from 'lucide-svelte';
  import { userStore } from '$lib/stores/auth.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';

  interface Props {
    src: string;
    title: string;
    animeId: number;
    episodeNumber: number;
    coverImage?: string;
    onNextEpisode?: () => void;
  }

  let {
    src,
    title,
    animeId,
    episodeNumber,
    coverImage = '',
    onNextEpisode
  }: Props = $props();

  let videoElement = $state<HTMLVideoElement | null>(null);
  let playerContainer = $state<HTMLElement | null>(null);

  let isPlaying = $state(false);
  let isMuted = $state(false);
  let volume = $state(1);
  let currentTime = $state(0);
  let duration = $state(0);
  let buffered = $state(0);
  let isFullscreen = $state(false);
  let showControls = $state(true);
  let isLoading = $state(true);
  let levels = $state<{ height: number; index: number }[]>([]);
  let currentLevelIndex = $state(-1);
  let showSettings = $state(false);

  let hlsInstance: Hls | null = null;
  let hideControlsTimeout: any;

  onMount(() => {
    initPlayer();
  });

  onDestroy(() => {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });

  $effect(() => {
    if (src && videoElement) {
      initPlayer();
    }
  });

  function initPlayer() {
    if (!videoElement) return;

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    if (Hls.isSupported() && src.includes('.m3u8')) {
      hlsInstance = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true
      });
      hlsInstance.loadSource(src);
      hlsInstance.attachMedia(videoElement);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        isLoading = false;
        levels = data.levels.map((lvl, idx) => ({ height: lvl.height, index: idx }));
      });

      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          isLoading = false;
          uiStore.showToast('HLS playback fallback demo source loaded', 'info');
        }
      });
    } else {
      videoElement.src = src;
      isLoading = false;
    }
  }

  function togglePlay() {
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play();
      isPlaying = true;
    } else {
      videoElement.pause();
      isPlaying = false;
    }
  }

  function toggleMute() {
    if (!videoElement) return;
    videoElement.muted = !videoElement.muted;
    isMuted = videoElement.muted;
  }

  function handleVolumeChange(val: number) {
    if (!videoElement) return;
    volume = val;
    videoElement.volume = val;
    videoElement.muted = val === 0;
    isMuted = videoElement.muted;
  }

  function handleSeek(e: Event) {
    if (!videoElement) return;
    const target = e.target as HTMLInputElement;
    const time = parseFloat(target.value);
    videoElement.currentTime = time;
    currentTime = time;
  }

  function toggleFullscreen() {
    if (!playerContainer) return;
    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen();
      isFullscreen = true;
    } else {
      document.exitFullscreen();
      isFullscreen = false;
    }
  }

  function skip(seconds: number) {
    if (!videoElement) return;
    videoElement.currentTime = Math.max(0, Math.min(duration, videoElement.currentTime + seconds));
  }

  function changeQuality(index: number) {
    if (hlsInstance) {
      hlsInstance.currentLevel = index;
      currentLevelIndex = index;
    }
    showSettings = false;
  }

  function handleMouseMove() {
    showControls = true;
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => {
      if (isPlaying) showControls = false;
    }, 3000);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowRight') {
      skip(5);
    } else if (e.code === 'ArrowLeft') {
      skip(-5);
    } else if (e.code === 'KeyF') {
      toggleFullscreen();
    } else if (e.code === 'KeyM') {
      toggleMute();
    }
  }

  function formatTime(sec: number): string {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={playerContainer}
  class="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl border border-white/10 group/player select-none"
  onmousemove={handleMouseMove}
  onmouseleave={() => isPlaying && (showControls = false)}
>
  <!-- Video element -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <video
    bind:this={videoElement}
    class="h-full w-full object-contain cursor-pointer"
    onclick={togglePlay}
    onplay={() => (isPlaying = true)}
    onpause={() => (isPlaying = false)}
    ontimeupdate={() => {
      if (!videoElement) return;
      currentTime = videoElement.currentTime;
      duration = videoElement.duration || 0;
      if (videoElement.buffered.length > 0) {
        buffered = (videoElement.buffered.end(videoElement.buffered.length - 1) / duration) * 100;
      }
      // Save progress to store periodically
      if (Math.floor(currentTime) % 5 === 0 && duration > 0) {
        userStore.saveProgress({
          id: animeId,
          title,
          coverImage,
          episode: episodeNumber,
          progressSeconds: Math.floor(currentTime),
          durationSeconds: Math.floor(duration)
        });
      }
    }}
    onended={() => {
      isPlaying = false;
      if (onNextEpisode) onNextEpisode();
    }}
  >
    <track kind="captions" />
  </video>

  <!-- Loading Overlay -->
  {#if isLoading}
    <div class="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none z-20">
      <div class="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
    </div>
  {/if}

  <!-- Controls Overlay -->
  <div
    class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-300 z-10 {showControls
      ? 'opacity-100 pointer-events-auto'
      : 'opacity-0 pointer-events-none'}"
  >
    <!-- Top Header -->
    <div class="flex items-center justify-between text-white">
      <div class="flex items-center gap-3">
        <span class="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-2xs uppercase">
          Episode {episodeNumber}
        </span>
        <h3 class="font-bold text-sm sm:text-base text-zinc-200 line-clamp-1 font-display">{title}</h3>
      </div>
    </div>

    <!-- Center Play/Pause Indicator -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="self-center" onclick={togglePlay}>
      <button
        aria-label={isPlaying ? 'Pause' : 'Play'}
        class="w-16 h-16 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
      >
        {#if isPlaying}
          <Pause class="w-8 h-8 fill-current" />
        {:else}
          <Play class="w-8 h-8 fill-current ml-1" />
        {/if}
      </button>
    </div>

    <!-- Bottom Controls Bar -->
    <div class="space-y-2">
      <!-- Seekbar with Buffer Indicator -->
      <div class="relative flex items-center group/seekbar">
        <!-- Buffer bar -->
        <div class="absolute inset-x-0 h-1.5 rounded-full bg-white/20 overflow-hidden pointer-events-none">
          <div class="h-full bg-white/40 transition-all duration-300" style="width: {buffered}%"></div>
        </div>
        <!-- Seek Slider -->
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          oninput={handleSeek}
          class="w-full h-1.5 accent-amber-500 bg-transparent rounded-full appearance-none cursor-pointer relative z-10"
        />
      </div>

      <!-- Action Buttons Row -->
      <div class="flex items-center justify-between text-white text-xs font-medium">
        <div class="flex items-center gap-3">
          <button onclick={togglePlay} aria-label="Play/Pause" class="p-1.5 text-zinc-300 hover:text-white transition">
            {#if isPlaying}
              <Pause class="w-5 h-5 fill-current" />
            {:else}
              <Play class="w-5 h-5 fill-current" />
            {/if}
          </button>

          <button onclick={() => skip(-10)} aria-label="Rewind 10s" class="p-1.5 text-zinc-300 hover:text-white transition">
            <RotateCcw class="w-4 h-4" />
          </button>
          <button onclick={() => skip(10)} aria-label="Forward 10s" class="p-1.5 text-zinc-300 hover:text-white transition">
            <RotateCw class="w-4 h-4" />
          </button>

          <!-- Volume Controls -->
          <div class="flex items-center gap-1.5 group/vol">
            <button onclick={toggleMute} aria-label="Mute" class="p-1.5 text-zinc-300 hover:text-white transition">
              {#if isMuted || volume === 0}
                <VolumeX class="w-5 h-5 text-rose-400" />
              {:else}
                <Volume2 class="w-5 h-5" />
              {/if}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              oninput={(e) => handleVolumeChange(parseFloat((e.target as HTMLInputElement).value))}
              class="w-16 h-1 accent-amber-500 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>

          <!-- Time Display -->
          <span class="text-zinc-400 font-mono text-2xs pl-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div class="flex items-center gap-3 relative">
          {#if onNextEpisode}
            <button
              onclick={onNextEpisode}
              aria-label="Next Episode"
              class="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-amber-500 hover:text-black transition text-2xs font-bold"
            >
              Next Ep <SkipForward class="w-3.5 h-3.5" />
            </button>
          {/if}

          <!-- Quality Selector Menu -->
          {#if levels.length > 0}
            <div class="relative">
              <button
                onclick={() => (showSettings = !showSettings)}
                aria-label="Quality Settings"
                class="p-1.5 text-zinc-300 hover:text-white transition"
              >
                <Settings class="w-5 h-5" />
              </button>

              {#if showSettings}
                <div class="absolute right-0 bottom-8 bg-[#141414] border border-white/10 rounded-xl p-2 shadow-xl space-y-1 z-30 min-w-[120px]">
                  <span class="text-2xs font-bold uppercase text-zinc-500 px-2 block">Quality</span>
                  <button
                    onclick={() => changeQuality(-1)}
                    class="w-full text-left px-2 py-1 text-2xs rounded hover:bg-white/10 transition {currentLevelIndex === -1 ? 'text-amber-400 font-bold' : 'text-zinc-300'}"
                  >
                    Auto
                  </button>
                  {#each levels as lvl}
                    <button
                      onclick={() => changeQuality(lvl.index)}
                      class="w-full text-left px-2 py-1 text-2xs rounded hover:bg-white/10 transition {currentLevelIndex === lvl.index ? 'text-amber-400 font-bold' : 'text-zinc-300'}"
                    >
                      {lvl.height}p
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}

          <button onclick={toggleFullscreen} aria-label="Fullscreen" class="p-1.5 text-zinc-300 hover:text-white transition">
            {#if isFullscreen}
              <Minimize class="w-5 h-5" />
            {:else}
              <Maximize class="w-5 h-5" />
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
