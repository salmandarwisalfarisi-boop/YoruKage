<script lang="ts">
  import type { PageData } from './$types';
  import HeroCarousel from '$lib/components/hero/HeroCarousel.svelte';
  import SectionHeader from '$lib/components/sections/SectionHeader.svelte';
  import HorizontalScroller from '$lib/components/sections/HorizontalScroller.svelte';
  import AnimeCard from '$lib/components/cards/AnimeCard.svelte';
  import FeaturedCard from '$lib/components/cards/FeaturedCard.svelte';
  import RankedListItem from '$lib/components/cards/RankedListItem.svelte';
  import Footer from '$lib/components/nav/Footer.svelte';
  import { userStore } from '$lib/stores/auth.svelte';
  import { Play } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-12">
  <!-- 1. Hero Carousel (Fixed 6 slides from AniList Trending) -->
  <HeroCarousel items={data.trending} />

  <div class="max-w-7xl mx-auto px-6 space-y-16">
    <!-- 2. Continue Watching (Only if user has history) -->
    {#if userStore.continueWatching.length > 0}
      <section>
        <SectionHeader title="Continue Watching" badge="RESUME" badgeColorClass="text-amber-400 bg-amber-500/10 border-amber-500/20" />
        <HorizontalScroller>
          {#each userStore.continueWatching as item}
            <a
              href="/anime/watch/{item.id}"
              class="group relative block w-60 sm:w-72 shrink-0 transition-transform duration-300 hover:-translate-y-1"
            >
              <div class="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-lg">
                <img src={item.coverImage} alt={item.title} class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                    <Play class="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
                <!-- Progress bar overlay -->
                <div class="absolute bottom-0 inset-x-0 h-1.5 bg-black/60">
                  <div
                    class="h-full bg-amber-500"
                    style="width: {Math.min(100, (item.progressSeconds / (item.durationSeconds || 1)) * 100)}%"
                  ></div>
                </div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <span class="font-bold text-sm text-white line-clamp-1 group-hover:text-amber-400 transition font-display">{item.title}</span>
                <span class="text-2xs font-extrabold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                  Ep {item.episode}
                </span>
              </div>
            </a>
          {/each}
        </HorizontalScroller>
      </section>
    {/if}

    <!-- 3. Featured Anime / Editor's Pick Spotlight Card -->
    {#if data.featured}
      <section>
        <FeaturedCard media={data.featured} />
      </section>
    {/if}

    <!-- 4. Trending Now -->
    <section>
      <SectionHeader
        title="Trending Now"
        badge="HOT"
        badgeColorClass="text-orange-400 bg-orange-500/10 border-orange-500/20"
        href="/browse?sort=TRENDING_DESC"
      />
      <HorizontalScroller>
        {#each data.trending as media (media.id)}
          <AnimeCard {media} />
        {/each}
      </HorizontalScroller>
    </section>

    <!-- 5. Popular This Season -->
    <section>
      <SectionHeader
        title="Popular This Season"
        badge="SEASONAL"
        badgeColorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        href="/browse?sort=POPULARITY_DESC"
      />
      <HorizontalScroller>
        {#each data.seasonal as media (media.id)}
          <AnimeCard {media} />
        {/each}
      </HorizontalScroller>
    </section>

    <!-- 6. Most Favorite -->
    <section>
      <SectionHeader
        title="Most Favorite"
        badge="TOP"
        badgeColorClass="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
        href="/browse?sort=FAVOURITES_DESC"
      />
      <HorizontalScroller>
        {#each data.popular as media (media.id)}
          <AnimeCard {media} />
        {/each}
      </HorizontalScroller>
    </section>

    <!-- 7. Top 10 Anime | Popular Movies (2-column on lg+) -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left Column: Top 10 Ranked -->
      <div class="space-y-4">
        <SectionHeader title="Top 10 Anime" badge="RANKED" badgeColorClass="text-amber-400 bg-amber-500/10 border-amber-500/20" />
        <div class="space-y-2.5">
          {#each data.top10 as media, index (media.id)}
            <RankedListItem {media} rank={index + 1} />
          {/each}
        </div>
      </div>

      <!-- Right Column: Popular Movies -->
      <div class="space-y-4">
        <SectionHeader title="Popular Movies" badge="MOVIES" badgeColorClass="text-sky-400 bg-sky-500/10 border-sky-500/20" href="/browse?format=MOVIE" />
        <div class="space-y-2.5">
          {#each data.movies as media, index (media.id)}
            <RankedListItem {media} rank={index + 1} />
          {/each}
        </div>
      </div>
    </section>

    <!-- 8. Coming Soon -->
    <section>
      <SectionHeader
        title="Coming Soon"
        badge="UPCOMING"
        badgeColorClass="text-violet-400 bg-violet-500/10 border-violet-500/20"
        href="/browse?status=NOT_YET_RELEASED"
      />
      <HorizontalScroller>
        {#each data.upcoming as media (media.id)}
          <AnimeCard {media} />
        {/each}
      </HorizontalScroller>
    </section>
  </div>

  <!-- Footer -->
  <Footer />
</div>
