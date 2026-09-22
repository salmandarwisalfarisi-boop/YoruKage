<script lang="ts">
  import { page } from '$app/state';
  import { Home, Compass, Calendar, Film, User } from 'lucide-svelte';

  const items = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Browse', href: '/browse', icon: Compass },
    { label: 'Schedule', href: '/schedule', icon: Calendar },
    { label: 'Movies', href: '/browse?format=MOVIE', icon: Film },
    { label: 'Profile', href: '/profile', icon: User }
  ];

  function isActive(href: string): boolean {
    const currentPath = page.url.pathname + page.url.search;
    if (href === '/') return page.url.pathname === '/';
    return currentPath === href || page.url.pathname.startsWith(href);
  }
</script>

<!-- Mobile Floating Bottom Pill Nav (fixed bottom-4, z-50) -->
<div class="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 md:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]">
  <nav class="pointer-events-auto flex items-center justify-around gap-2 rounded-full border border-white/10 bg-[#0d0d0d]/85 p-2 backdrop-blur-xl shadow-2xl shadow-black/90 w-full max-w-sm">
    {#each items as item}
      {@const Icon = item.icon}
      {@const active = isActive(item.href)}
      <a
        href={item.href}
        aria-label={item.label}
        class="h-10 w-10 rounded-full flex flex-col items-center justify-center transition-all duration-200 {active
          ? 'bg-amber-500/20 text-amber-400 scale-105 font-bold'
          : 'text-zinc-400 hover:text-white hover:bg-white/5'}"
      >
        <Icon class="w-5 h-5 stroke-[2]" />
      </a>
    {/each}
  </nav>
</div>
