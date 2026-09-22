<script lang="ts">
  import { uiStore } from '$lib/stores/ui.svelte';
  import { Disc as Discord, Shield, Globe } from 'lucide-svelte';
</script>

<footer class="mt-20 border-t border-white/10 bg-[#0d0d0d] pt-12 pb-24 md:pb-12 text-zinc-400">
  <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
    <!-- Brand Info -->
    <div class="space-y-3 md:col-span-2">
      <a href="/" class="flex items-center gap-2">
        <div class="h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black text-sm">
          AK
        </div>
        <span class="font-extrabold text-xl tracking-tight text-white">
          Ani<span class="text-amber-500">Kage</span>
        </span>
      </a>
      <p class="text-xs text-zinc-500 max-w-sm leading-relaxed">
        AniKage does not store any files on our server. All contents are provided by non-affiliated third parties. Experience high-speed ad-free anime streaming.
      </p>
      <div class="pt-2 flex items-center gap-3">
        <a
          href="https://discord.gg"
          target="_blank"
          rel="noreferrer"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-amber-500/40 transition"
        >
          <Discord class="w-4 h-4 text-indigo-400" />
          Join Discord
        </a>
      </div>
    </div>

    <!-- Links -->
    <div class="space-y-2">
      <h4 class="font-bold text-sm text-white font-display">Navigation</h4>
      <ul class="space-y-1.5 text-xs">
        <li><a href="/" class="hover:text-amber-400 transition">Home</a></li>
        <li><a href="/browse" class="hover:text-amber-400 transition">Browse Anime</a></li>
        <li><a href="/schedule" class="hover:text-amber-400 transition">Airing Schedule</a></li>
        <li><a href="/browse?format=MOVIE" class="hover:text-amber-400 transition">Anime Movies</a></li>
      </ul>
    </div>

    <!-- Legal & Settings -->
    <div class="space-y-2">
      <h4 class="font-bold text-sm text-white font-display">Preferences & Legal</h4>
      <ul class="space-y-1.5 text-xs">
        <li class="flex items-center gap-1.5">
          <Shield class="w-3.5 h-3.5 text-zinc-500" />
          <a href="/dmca" class="hover:text-amber-400 transition">DMCA Notice</a>
        </li>
        <li class="flex items-center gap-1.5">
          <Globe class="w-3.5 h-3.5 text-zinc-500" />
          <span class="text-zinc-500">Title Lang:</span>
          <button
            onclick={() => uiStore.setTitleLanguage(uiStore.titleLanguage === 'userPreferred' ? 'english' : 'userPreferred')}
            class="text-amber-400 font-bold hover:underline"
          >
            {uiStore.titleLanguage === 'userPreferred' ? 'Romaji/JP' : 'English'}
          </button>
        </li>
      </ul>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-2xs text-zinc-500">
    <span>© 2026 AniKage. Built with SvelteKit & AniList API.</span>
    <span class="mt-2 sm:mt-0">Made by discord.gg/nullstate</span>
  </div>
</footer>
