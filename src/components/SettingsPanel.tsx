import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { THEMES, type Theme } from '../utils/storage';
import type { Locale, Translations } from '../i18n';

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'english' },
  { value: 'pt', label: 'português' },
];

type Props = {
  t: Translations;
  theme: Theme;
  locale: Locale;
  notifications: boolean;
  compactMode: boolean;
  onSetTheme: (t: Theme) => void;
  onSetLocale: (l: Locale) => void;
  onToggleNotifications: () => void;
  onToggleCompactMode: () => void;
};

export function SettingsPanel({ t, theme, locale, notifications, compactMode, onSetTheme, onSetLocale, onToggleNotifications, onToggleCompactMode }: Props) {
  return (
    <div className="flex flex-col gap-5 flex-1 px-5 py-5">
      {/* appearance */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_appearance}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {THEMES.map((value) => (
            <button
              key={value}
              onClick={() => theme !== value && onSetTheme(value)}
              className={`px-1 py-1.5 text-[10px] border transition-all cursor-pointer flex justify-center whitespace-nowrap ${
                theme === value
                  ? 'border-gray-900 dark:border-[#f0f0f0] text-gray-900 dark:text-[#f0f0f0]'
                  : 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:border-gray-400 dark:hover:border-[#6e6e6e]'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* language */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_language}</p>
        <div className="flex gap-1.5">
          {LOCALE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => locale !== value && onSetLocale(value)}
              className={`flex items-center px-3 py-1.5 text-xs border transition-all cursor-pointer flex-1 justify-center ${
                locale === value
                  ? 'border-gray-900 dark:border-[#f0f0f0] text-gray-900 dark:text-[#f0f0f0]'
                  : 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:border-gray-400 dark:hover:border-[#6e6e6e]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* notifications */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_notifications}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-[#b0b0b0]">{t.settings_notifications_song_change}</span>
          <button
            onClick={onToggleNotifications}
            className={`relative w-8 h-[18px] border transition-all cursor-pointer overflow-hidden ${
              notifications
                ? 'border-gray-900 dark:border-[#f0f0f0] bg-gray-900 dark:bg-[#f0f0f0]'
                : 'border-gray-200 dark:border-[#2a2a2a] bg-transparent'
            }`}
            role="switch"
            aria-checked={notifications}
            aria-label={t.settings_notifications_song_change}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[12px] h-[12px] transition-all ${
                notifications
                  ? 'translate-x-[14px] bg-gray-50 dark:bg-gray-900'
                  : 'translate-x-0 bg-gray-200 dark:bg-[#2a2a2a]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* display */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_display}</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-[#b0b0b0]">{t.settings_compact_mode}</span>
            <button
              onClick={onToggleCompactMode}
              className={`relative w-8 h-[18px] border transition-all cursor-pointer overflow-hidden ${
                compactMode
                  ? 'border-gray-900 dark:border-[#f0f0f0] bg-gray-900 dark:bg-[#f0f0f0]'
                  : 'border-gray-200 dark:border-[#2a2a2a] bg-transparent'
              }`}
              role="switch"
              aria-checked={compactMode}
              aria-label={t.settings_compact_mode}
            >
              <span
                className={`absolute top-[2px] left-[2px] w-[12px] h-[12px] transition-all ${
                  compactMode
                    ? 'translate-x-[14px] bg-gray-50 dark:bg-gray-900'
                    : 'translate-x-0 bg-gray-200 dark:bg-[#2a2a2a]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {typeof browser !== 'undefined' && !navigator.userAgent.includes('Firefox') && (
        <button
          className="self-start inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#6e6e6e] hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors cursor-pointer"
          onClick={() => browser.tabs.create({ url: 'chrome://extensions/shortcuts' })}
        >
          <ArrowSquareOutIcon size={12} />
          {t.settings_shortcuts}
        </button>
      )}
    </div>
  );
}
