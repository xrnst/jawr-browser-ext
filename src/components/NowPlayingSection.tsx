import type { Translations } from '../i18n';
import type { Song } from '../types';
import { useCopiedFlash } from '../utils/copied-flash';
import { formatShareText } from '../utils/share';
import { formatSongTitle } from '../utils/song';

type Props = {
  t: Translations;
  song: Song | null;
  nextSong: Song | null;
  compactMode: boolean;
  onSupportArtist: () => void;
};

const LINK_CLASS = 'text-xs text-gray-400 dark:text-[#6e6e6e] underline hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors text-left cursor-pointer w-fit';

export function NowPlayingSection({ t, song, nextSong, compactMode, onSupportArtist }: Props) {
  const [copied, flashCopied] = useCopiedFlash();
  const nextText = nextSong ? formatSongTitle(nextSong) : '';

  function handleShare() {
    if (!song?.artist || !song.title) return;
    navigator.clipboard.writeText(formatShareText(song, t.share_now_playing)).then(flashCopied).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-3 px-5 pt-5 pb-4 text-xs">
      <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.now_label}</p>
      {song ? (
        <p className="text-sm text-gray-900 dark:text-[#f0f0f0]">
          {song.artist && <span className="font-bold">{song.artist}</span>}
          {song.artist && song.title && ' - '}
          {song.title}
        </p>
      ) : (
        <p className="text-gray-300 dark:text-[#3a3a3a]">—</p>
      )}
      {song?.artist && !compactMode && (
        <div className="flex items-center gap-4">
          <button type="button" onClick={onSupportArtist} className={LINK_CLASS}>
            {t.support_artist_button}
          </button>
          {song.title && (
            <button type="button" onClick={handleShare} className={LINK_CLASS}>
              {copied ? t.share_song_copied : t.share_song_button}
            </button>
          )}
          <span role="status" className="sr-only">
            {copied ? t.share_song_copied : ''}
          </span>
        </div>
      )}
      {nextText && (
        <div className="flex flex-col gap-3 mt-2">
          <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.next_label}</p>
          <p className="text-[11px] text-gray-600 dark:text-[#b0b0b0] truncate" title={nextText}>
            {nextText}
          </p>
        </div>
      )}
    </div>
  );
}
