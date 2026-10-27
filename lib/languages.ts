import { LANGUAGE_CODES, Language } from '@/lib/types';

/** Native names, shown in the language picker so anyone can find their own. */
export const LANGUAGES: { code: Language; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'zh', native: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'ko', native: '한국어', english: 'Korean' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'tl', native: 'Tagalog', english: 'Tagalog' },
];

export function isLanguage(code: string | null | undefined): code is Language {
  return !!code && (LANGUAGE_CODES as readonly string[]).includes(code);
}

/** Map a device/locale code (e.g. "zh-Hant", "fil") onto a supported language. */
export function toLanguage(code: string | null | undefined): Language {
  const c = (code ?? 'en').toLowerCase();
  if (c.startsWith('fil')) return 'tl';
  const base = c.split(/[-_]/)[0];
  return isLanguage(base) ? base : 'en';
}

export function nativeName(code: Language): string {
  return LANGUAGES.find((l) => l.code === code)?.native ?? code;
}
