import dayjs from 'dayjs';

export function timeAgo(playedAt: number): string {
  const playedAtDate = dayjs(playedAt * 1000);
  const diffInSeconds = dayjs().diff(playedAtDate, 'second');
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  return `${Math.floor(diffInSeconds / 3600)}h`;
}
