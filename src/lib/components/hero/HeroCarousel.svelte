<script lang="ts">
  import type { AnimeMedia } from '$lib/types/anime';
  import HeroSlide from './HeroSlide.svelte';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  let { items = [] }: { items: AnimeMedia[] } = $props();

  const slides = $derived(items.slice(0, 6));
  let currentIndex = $state(0);
  let isHovered = $state(false);

  let intervalTimer: any;

  $effect(() => {
    if (slides.length <= 1) return;
    if (!isHovered) {
      intervalTimer = setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
      }, 8000);
    }
    return () => clearInterval(intervalTimer);
  });

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Hero Carousel Wrapper -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="relative w-full h-[85vh] min-h-[550px] max-h-[750px] overflow-hidden bg-[#0a0a0a]"
  role="region"
  aria-label="Anime Highlights Carousel"
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
>
  {#if slides.length > 0}
    {#each slides as media, index (media.id)}
      <HeroSlide {media} active={index === currentIndex} />
    {/each}

    <!-- Bottom Controls Bar (Counter + Expanding Dots + Navigation Arrows) -->
    <div class="absolute bottom-6 right-6 z-30 flex items-center gap-4 bg-black/60 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl">
      <!-- Slide Counter -->
      <span class="text-xs font-mono font-bold text-zinc-400">
        <span class="text-amber-400">{currentIndex + 1}</span> / {slides.length}
      </span>

      <!-- Expanding Dots -->
      <div class="flex items-center gap-1.5">
        {#each slides as _, idx}
          <button
            onclick={() => (currentIndex = idx)}
            aria-label="Go to slide {idx + 1}"
            class="h-2 rounded-full transition-all duration-300 {idx === currentIndex
              ? 'w-8 bg-amber-500'
              : 'w-2 bg-white/30 hover:bg-white/60'}"
          ></button>
        {/each}
      </div>

      <!-- Arrow Controls -->
      <div class="flex items-center gap-1 border-l border-white/10 pl-2">
        <button
          onclick={prevSlide}
          aria-label="Previous slide"
          class="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <button
          onclick={nextSlide}
          aria-label="Next slide"
          class="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  {:else}
    <!-- Loading Hero Skeleton -->
    <div class="absolute inset-0 bg-[#0d0d0d] animate-pulse flex items-center justify-center">
      <div class="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
    </div>
  {/if}
</div>
