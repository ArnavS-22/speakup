// Locale files only (no runtime setup), so pure modules and tests can import them.
import en from './en.json';
import es from './es.json';
import hi from './hi.json';
import ko from './ko.json';
import pa from './pa.json';
import te from './te.json';
import tl from './tl.json';
import vi from './vi.json';
import zh from './zh.json';
import type { Language } from '@/lib/types';

export type LocaleFile = typeof en & { topicPhrase?: Record<string, string> };

export const LOCALES: Record<Language, LocaleFile> = { en, es, zh, hi, pa, ko, te, vi, tl } as Record<Language, LocaleFile>;
