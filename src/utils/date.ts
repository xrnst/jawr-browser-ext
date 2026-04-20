import dayjs from 'dayjs';

export function timeAgo(playedAt: number): string {
  const playedAtDate = dayjs(playedAt * 1000);
  const diffInSeconds = dayjs().diff(playedAtDate, 'second');
  if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min atrás`;
  return `${Math.floor(diffInSeconds / 3600)}h atrás`;
}
