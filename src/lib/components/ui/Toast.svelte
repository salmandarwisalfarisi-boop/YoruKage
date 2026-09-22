<script lang="ts">
  import { uiStore } from '$lib/stores/ui.svelte';
  import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
</script>

{#if uiStore.toasts.length > 0}
  <div class="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    {#each uiStore.toasts as toast (toast.id)}
      <div
        class="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-[#141414]/90 backdrop-blur-md shadow-xl text-sm transition-all animate-in fade-in slide-in-from-bottom-3"
      >
        <div class="flex items-center gap-2.5">
          {#if toast.type === 'success'}
            <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
          {:else if toast.type === 'error'}
            <AlertCircle class="w-5 h-5 text-rose-400 shrink-0" />
          {:else if toast.type === 'warning'}
            <AlertCircle class="w-5 h-5 text-amber-400 shrink-0" />
          {:else}
            <Info class="w-5 h-5 text-amber-400 shrink-0" />
          {/if}
          <span class="text-zinc-200 font-medium">{toast.message}</span>
        </div>
        <button
          onclick={() => uiStore.removeToast(toast.id)}
          class="text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    {/each}
  </div>
{/if}
