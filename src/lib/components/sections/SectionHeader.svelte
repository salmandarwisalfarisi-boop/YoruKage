<script lang="ts">
  interface Props {
    title: string;
    badge?: string;
    badgeColorClass?: string;
    href?: string;
  }

  let {
    title,
    badge,
    badgeColorClass = 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    href
  }: Props = $props();
</script>

<div class="mb-4 flex items-center justify-between">
  <div class="flex items-center gap-2">
    <span class="h-6 w-[0.30rem] rounded-full bg-amber-500"></span>
    <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">{title}</h2>
    {#if badge}
      <span class="rounded-full border px-2 py-0.5 text-2xs font-semibold tracking-widest uppercase {badgeColorClass}">
        {badge}
      </span>
    {/if}
  </div>
  {#if href}
    <a
      href={href}
      class="group/va flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
    >
      View All <span class="transition-transform group-hover/va:translate-x-0.5">→</span>
    </a>
  {/if}
</div>
