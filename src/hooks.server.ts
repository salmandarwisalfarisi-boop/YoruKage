import { initDohResolver } from '$lib/server/doh-resolver';
import type { Handle } from '@sveltejs/kit';

// Aktifkan in-app DNS-over-HTTPS resolver saat server SvelteKit startup
initDohResolver();

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};
