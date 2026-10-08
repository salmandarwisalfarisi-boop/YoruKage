<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import Navbar from '$lib/components/nav/Navbar.svelte';
  import BottomNav from '$lib/components/nav/BottomNav.svelte';
  import SearchModal from '$lib/components/search/SearchModal.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { userStore } from '$lib/stores/auth.svelte';

  let { children } = $props();

  onMount(() => {
    uiStore.init();
    userStore.init();
  });
</script>

<svelte:head>
  <title>YoruKage — Watch Anime Online Free & High Quality</title>
</svelte:head>

<div class="relative min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col antialiased">
  <!-- Desktop Navbar (Floating Dual Pill Top) -->
  <Navbar />

  <!-- Main View -->
  <main class="flex-1 w-full">
    {@render children()}
  </main>

  <!-- Mobile Bottom Nav (Floating Pill Bottom) -->
  <BottomNav />

  <!-- Cmd+K Live Search Modal Overlay -->
  <SearchModal />

  <!-- Global Toast Notifications -->
  <Toast />
</div>
