import {
  AppleLogoIcon,
  EqualizerIcon,
  LastfmLogoIcon,
  ParallelogramIcon,
  SoundcloudLogoIcon,
  SpotifyLogoIcon,
  VinylRecordIcon,
  XIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import type { Translations } from '../i18n';

export function SupportArtistModal({
  artist,
  t,
  onClose,
}: {
  artist: string;
  t: Translations;
  onClose: () => void;
}) {
  const artists = artist.split(';').map((a) => a.trim()).filter(Boolean);
  const [activeTab, setActiveTab] = useState(artists[0] ?? artist);
  const q = encodeURIComponent(activeTab);

  const links = [
    { label: 'bandcamp', href: `https://bandcamp.com/search?q=${q}&item_type=b`, icon: ParallelogramIcon },
    { label: 'soundcloud', href: `https://soundcloud.com/search/people?q=${q}`, icon: SoundcloudLogoIcon },
    { label: 'spotify', href: `https://open.spotify.com/search/${q}/artists`, icon: SpotifyLogoIcon },
    { label: 'apple music', href: `https://music.apple.com/search?term=${q}`, icon: AppleLogoIcon },
    { label: 'yt music', href: `https://music.youtube.com/search?q=${q}`, icon: YoutubeLogoIcon },
    // Deezer answers 404 to an encoded slash in the path.
    { label: 'deezer', href: `https://www.deezer.com/search/${encodeURIComponent(activeTab.replaceAll('/', ' '))}/artist`, icon: EqualizerIcon },
    { label: 'discogs', href: `https://www.discogs.com/search/?q=${q}&type=artist`, icon: VinylRecordIcon },
    { label: 'last.fm', href: `https://www.last.fm/music/${q}`, icon: LastfmLogoIcon },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-sm mx-4 flex flex-col gap-5 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-[#f0f0f0]">
              {t.support_artist_title}
            </h2>
            {artists.length === 1 && (
              <p className="text-xs text-gray-400 dark:text-[#6e6e6e]">{artists[0]}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer"
            aria-label={t.close}
          >
            <XIcon />
          </button>
        </div>

        {artists.length > 1 && (
          <section className="flex gap-3 flex-wrap">
            {artists.map((a) => (
              <button
                key={a}
                onClick={() => setActiveTab(a)}
                aria-pressed={activeTab === a}
                className={`px-3 py-1 text-xs cursor-pointer transition-colors ${
                  activeTab === a
                    ? 'bg-gray-100 text-gray-700 ring ring-inset ring-gray-200 dark:bg-[#2a2a2a] dark:text-[#f0f0f0] dark:ring-[#3a3a3a]'
                    : 'bg-gray-200 text-gray-700 dark:bg-[#1a1a1a] dark:text-[#b0b0b0] dark:border dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                }`}
              >
                {a}
              </button>
            ))}
          </section>
        )}

        <ul className="grid grid-cols-2 gap-2">
          {links.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-2 w-full px-3 py-2 text-[11px] text-gray-800 dark:text-[#f0f0f0] border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors whitespace-nowrap overflow-hidden"
              >
                <span className="truncate">{label}</span>
                <Icon size={14} className="text-gray-300 dark:text-[#6e6e6e] shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
