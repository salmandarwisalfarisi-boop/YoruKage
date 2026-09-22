<script lang="ts">
  import type { PageData } from './$types';
  import Footer from '$lib/components/nav/Footer.svelte';
  import { formatTimeUntil, formatScore } from '$lib/utils/format';
  import { Calendar, Clock, Star, Play } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Determine current active day tab (0 = Mon, 6 = Sun)
  const todayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  let activeDayIndex = $state(todayIndex);

  // Group schedules by day of week (0..6)
  const groupedByDay = $derived.by(() => {
    const map: Record<number, typeof data.schedules> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    data.schedules.forEach(item => {
      const date = new Date(item.airingAt * 1000);
      const day = date.getDay() === 0 ? 6 : date.getDay() - 1;
      if (map[day]) map[day].push(item);
    });
    return map;
  });

  const activeDayItems = $derived(groupedByDay[activeDayIndex] || []);
</script>

<div class="pt-24 pb-12 max-w-7xl mx-auto px-6 space-y-8 min-h-screen">
  <div class="space-y-2">
    <div class="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
      <Calendar class="w-4 h-4" />
      Weekly Release Radar
    </div>
    <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
      Anime Airing Schedule
    </h1>
    <p class="text-sm text-zinc-400">
      Track episode release dates and broadcast countdowns across the week.
    </p>
  </div>

  <!-- Day Tabs (Horizontal scroll on mobile, full grid on desktop) -->
  <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/10">
    {#each daysOfWeek as dayName, idx}
      <button
        onclick={() => (activeDayIndex = idx)}
        class="flex-1 min-w-[120px] py-3.5 px-4 rounded-2xl font-bold text-sm transition border flex flex-col items-center gap-1 {idx === activeDayIndex
          ? 'bg-amber-500 text-black border-amber-500 shadow-xl scale-105'
          : 'bg-[#141414] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}"
      >
        <span>{dayName}</span>
        <span class="text-2xs font-mono font-medium opacity-80">
          {groupedByDay[idx]?.length || 0} Releases
        </span>
      </button>
    {/each}
  </div>

  <!-- Active Day Schedule List -->
  {#if activeDayItems.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each activeDayItems as item (item.id)}
        {@const media = item.media}
        {@const date = new Date(item.airingAt * 1000)}
        {@const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

        <div class="group relative flex items-center gap-4 p-3.5 rounded-2xl bg-[#141414] border border-white/10 hover:border-amber-500/40 transition duration-200 shadow-lg">
          <!-- Cover -->
          <a href="/anime/info/{media.id}" class="shrink-0 aspect-[2/3] w-20 rounded-xl overflow-hidden shadow">
            <img src={media.coverImage.large || media.coverImage.extraLarge} alt={media.title.userPreferred} class="h-full w-full object-cover group-hover:scale-105 transition-transform" />
          </a>

          <!-- Details -->
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-2xs uppercase">
                Episode {item.episode}
              </span>
              <span class="text-2xs font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Clock class="w-3 h-3" />
                {formatTimeUntil(item.timeUntilAiring)}
              </span>
            </div>

            <a href="/anime/info/{media.id}" class="block font-bold text-sm text-white group-hover:text-amber-400 transition truncate font-display">
              {media.title.userPreferred}
            </a>

            <div class="flex items-center gap-2 text-2xs text-zinc-400 font-mono">
              <span class="text-zinc-300 font-semibold">{timeString}</span>
              <span>•</span>
              {#if media.averageScore}
                <span class="text-amber-400 font-bold">★ {formatScore(media.averageScore)}</span>
              {/if}
            </div>

            <a
              href="/anime/watch/{media.id}"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-amber-500 hover:text-black transition text-xs font-semibold mt-1"
            >
              <Play class="w-3.5 h-3.5 fill-current" /> Watch Ep {item.episode}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="py-20 text-center space-y-2 bg-[#141414] rounded-2xl border border-white/10">
      <p class="text-zinc-400 text-sm">No scheduled anime releases found for {daysOfWeek[activeDayIndex]}.</p>
    </div>
  {/if}
</div>

<Footer />
