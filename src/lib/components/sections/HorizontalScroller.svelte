<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  let scrollContainer = $state<HTMLElement | null>(null);

  function scroll(direction: 'left' | 'right') {
    if (!scrollContainer) return;
    const amount = scrollContainer.clientWidth * 0.75;
    scrollContainer.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  }
</script>

<div class="relative group/scroller">
  <!-- Left Scroll Button -->
  <button
    onclick={() => scroll('left')}
    aria-label="Scroll Left"
    class="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/70 border border-white/10 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-200 shadow-xl hover:bg-amber-500 hover:text-black hover:border-amber-500"
  >
    <ChevronLeft class="w-6 h-6" />
  </button>

  <!-- Scroll Container -->
  <div
    bind:this={scrollContainer}
    class="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 -mx-1"
  >
    {@render children()}
  </div>

  <!-- Right Scroll Button -->
  <button
    onclick={() => scroll('right')}
    aria-label="Scroll Right"
    class="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/70 border border-white/10 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-200 shadow-xl hover:bg-amber-500 hover:text-black hover:border-amber-500"
  >
    <ChevronRight class="w-6 h-6" />
  </button>
</div>
