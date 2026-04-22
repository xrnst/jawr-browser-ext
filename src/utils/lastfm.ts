import md5 from 'blueimp-md5';

const API_URL = 'https://ws.audioscrobbler.com/2.0/';
const API_KEY = import.meta.env.VITE_LASTFM_API_KEY as string;
const SECRET = import.meta.env.VITE_LASTFM_SHARED_SECRET as string;

export type LastfmSession = { key: string; name: string };

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== 'format')
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('');
  return md5(sorted + SECRET);
}

export async function getToken(): Promise<string> {
  const params = new URLSearchParams({
    method: 'auth.getToken',
    api_key: API_KEY,
    format: 'json',
  });
  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) throw new Error(`getToken failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`getToken error ${data.error}: ${data.message}`);
  return data.token as string;
}

export function buildAuthUrl(token: string): string {
  return `https://www.last.fm/api/auth/?api_key=${API_KEY}&token=${token}`;
}

export async function getSession(token: string): Promise<LastfmSession> {
  const params: Record<string, string> = {
    method: 'auth.getSession',
    api_key: API_KEY,
    token,
  };
  const sig = sign(params);
  const query = new URLSearchParams({ ...params, api_sig: sig, format: 'json' });
  const res = await fetch(`${API_URL}?${query}`);
  if (!res.ok) throw new Error(`getSession failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`getSession error ${data.error}: ${data.message}`);
  return { key: data.session.key as string, name: data.session.name as string };
}

export async function scrobble(
  sessionKey: string,
  artist: string,
  track: string,
  timestamp: number,
): Promise<void> {
  const params: Record<string, string> = {
    method: 'track.scrobble',
    api_key: API_KEY,
    sk: sessionKey,
    artist,
    track,
    timestamp: String(timestamp),
  };
  const sig = sign(params);
  const body = new URLSearchParams({ ...params, api_sig: sig, format: 'json' });
  const res = await fetch(API_URL, { method: 'POST', body });
  if (!res.ok) throw new Error(`scrobble failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`scrobble error ${data.error}: ${data.message}`);
}
