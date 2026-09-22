import type { PageServerLoad } from './$types';
import { getAiringSchedule } from '$lib/server/anilist';

export const load: PageServerLoad = async () => {
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - dayOfWeek);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const startTimestamp = Math.floor(startOfWeek.getTime() / 1000);
  const endTimestamp = Math.floor(endOfWeek.getTime() / 1000);

  const items = await getAiringSchedule(startTimestamp, endTimestamp);

  return {
    schedules: items,
    weekStart: startOfWeek.toISOString()
  };
};
