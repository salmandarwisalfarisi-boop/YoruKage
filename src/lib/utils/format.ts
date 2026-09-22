export function formatScore(score?: number): string {
  if (!score) return 'N/A';
  return (score / 10).toFixed(1);
}

export function formatFormat(format?: string): string {
  if (!format) return 'TV';
  switch (format.toUpperCase()) {
    case 'TV_SHORT': return 'TV Short';
    case 'MOVIE': return 'Movie';
    case 'SPECIAL': return 'Special';
    case 'MUSIC': return 'Music';
    default: return format;
  }
}

export function formatStatus(status?: string): string {
  if (!status) return 'Finished';
  switch (status.toUpperCase()) {
    case 'RELEASING': return 'Airing';
    case 'FINISHED': return 'Finished';
    case 'NOT_YET_RELEASED': return 'Upcoming';
    case 'CANCELLED': return 'Cancelled';
    case 'HIATUS': return 'On Hiatus';
    default: return status;
  }
}

export function formatTimeUntil(seconds: number): string {
  if (seconds <= 0) return 'Airing now';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function cleanDescription(desc?: string): string {
  if (!desc) return 'No description available.';
  return desc.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').trim();
}
