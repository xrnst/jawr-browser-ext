import en from './locales/en';
import pt from './locales/pt';

export type Locale = 'pt' | 'en';
export type Translations = typeof pt;

const locales: Record<Locale, Translations> = { pt, en };

export function getTranslations(locale: Locale): Translations {
  return locales[locale];
}

export function loadLocale(): Locale {
  try {
    const raw = localStorage.getItem('jawr_locale');
    if (raw === 'pt' || raw === 'en') return raw;
  } catch {}
  const lang = navigator.language?.toLowerCase() ?? '';
  if (lang.startsWith('pt')) return 'pt';
  return 'en';
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem('jawr_locale', locale);
  } catch {}
}
