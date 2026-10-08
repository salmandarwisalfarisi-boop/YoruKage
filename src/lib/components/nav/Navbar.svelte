<script lang="ts">
  import { page } from '$app/state';
  import { Search, Bell, Disc as Discord, User } from 'lucide-svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { userStore } from '$lib/stores/auth.svelte';

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Browse', href: '/browse' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Movies', href: '/browse?format=MOVIE' }
  ];

  function isActive(href: string): boolean {
    const currentPath = page.url.pathname + page.url.search;
    if (href === '/') return page.url.pathname === '/';
    return currentPath === href || page.url.pathname.startsWith(href);
  }
</script>

<!-- Desktop Floating Pill Nav (fixed top-4, z-30) -->
<header class="fixed top-4 inset-x-0 z-30 hidden md:flex items-center justify-between px-6 max-w-7xl mx-auto pointer-events-none">
  <!-- Left Pill (Logo + Main Navigation) -->
  <div class="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0d0d0d]/75 p-1.5 backdrop-blur-xl shadow-2xl shadow-black/80">
    <a href="/" class="flex items-center gap-2 pl-3 pr-4 group">
      <div class="h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black text-sm tracking-tighter group-hover:scale-105 transition-transform">
        YK
      </div>
      <span class="font-extrabold text-lg tracking-tight text-white flex items-center gap-0.5">
        Yoru<span class="text-amber-500">Kage</span>
      </span>
    </a>

    <nav class="flex items-center gap-1">
      {#each navLinks as link}
        <a
          href={link.href}
          class="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 {isActive(link.href)
            ? 'bg-white/10 text-white font-semibold shadow-inner'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'}"
        >
          {link.label}
        </a>
      {/each}
    </nav>
  </div>

  <!-- Right Pill (Actions & Profile) -->
  <div class="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0d0d0d]/75 p-1.5 backdrop-blur-xl shadow-2xl shadow-black/80">
    <!-- Discord Button -->
    <a
      href="https://discord.gg"
      target="_blank"
      rel="noreferrer"
      aria-label="Discord Community"
      class="h-10 w-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
      title="Join Community Discord"
    >
      <Discord class="w-5 h-5" />
    </a>

    <!-- Search Button -->
    <button
      onclick={() => uiStore.toggleSearch()}
      aria-label="Open Search (Cmd+K)"
      class="h-10 w-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition relative group"
      title="Search Anime (Ctrl+K)"
    >
      <Search class="w-5 h-5" />
    </button>

    <!-- Notification Bell -->
    <div class="relative">
      <button
        aria-label="Notifications"
        class="h-10 w-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
        title="Notifications"
        onclick={() => uiStore.showToast('No new notifications', 'info')}
      >
        <Bell class="w-5 h-5" />
        <span class="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-[#0d0d0d] animate-pulse"></span>
      </button>
    </div>

    <!-- Avatar / Profile -->
    <a
      href="/profile"
      class="h-10 w-10 rounded-full overflow-hidden border border-white/15 hover:border-amber-500/50 transition flex items-center justify-center bg-zinc-800"
      title="Profile Settings"
    >
      {#if userStore.user.avatar}
        <img src={userStore.user.avatar} alt="User Avatar" class="h-full w-full object-cover" />
      {:else}
        <User class="w-5 h-5 text-zinc-300" />
      {/if}
    </a>
  </div>
</header>
