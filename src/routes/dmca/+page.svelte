<script lang="ts">
  import Footer from '$lib/components/nav/Footer.svelte';
  import { Shield } from 'lucide-svelte';
</script>

<div class="pt-24 pb-12 max-w-4xl mx-auto px-6 space-y-6 min-h-screen text-zinc-300">
  <div class="flex items-center gap-3">
    <Shield class="w-8 h-8 text-amber-500" />
    <h1 class="text-3xl font-extrabold text-white font-display">DMCA Disclaimer</h1>
  </div>

  <div class="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4 text-sm leading-relaxed shadow-xl">
    <p>
      YoruKage does not host or store any media files on its servers. All content and streams provided on this platform are hosted on non-affiliated third-party websites.
    </p>
    <p>
      YoruKage operates as an index and database of media available publicly on the internet. If you believe your copyrighted material is listed on our site without authorization, please submit a formal DMCA takedown notice to our contact team at <span class="text-amber-400 font-mono font-bold">dmca@yorukage.cc</span>.
    </p>
    <p class="text-xs text-zinc-500 pt-2">
      Please allow up to 48 business hours for takedown request processing.
    </p>
  </div>
</div>

<Footer />
