import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LOCALES } from './locales';
import { toLanguage } from '@/lib/languages';
import { Language } from '@/lib/types';

export { LOCALES };

export function deviceLanguage(): Language {
  const loc = Localization.getLocales()[0];
  return toLanguage(loc?.languageTag ?? loc?.languageCode ?? 'en');
}

void i18n.use(initReactI18next).init({
  resources: Object.fromEntries(Object.entries(LOCALES).map(([k, v]) => [k, { translation: v }])),
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

/** Current UI language as a supported Language code. */
export function currentLanguage(): Language {
  return toLanguage(i18n.language);
}

export default i18n;
