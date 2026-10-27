import { AgendaItem, Body, ContactInfo, DraftResult, Language, LocalizedText, RouteResult } from '@/lib/types';
import type { TFunction } from 'i18next';

/** Pick a language from a LocalizedText, falling back to English. */
export function pick(text: LocalizedText | undefined, lang: Language): string {
  if (!text) return '';
  return text[lang] ?? text.en ?? '';
}

export function bodyName(body: Body, lang: Language): string {
  if (lang === 'en') return body.name_en;
  if (lang === 'es') return body.name_es;
  return body.i18n?.[lang]?.name ?? body.name_en;
}

export function howToSpeak(body: Body, lang: Language): string | null {
  if (lang === 'es') return body.how_to_speak_es ?? body.how_to_speak_en;
  if (lang === 'en') return body.how_to_speak_en;
  return body.i18n?.[lang]?.how_to_speak ?? body.how_to_speak_en;
}

export function itemSummary(item: AgendaItem | null | undefined, lang: Language): string | null {
  if (!item) return null;
  if (lang === 'en') return item.summary_en;
  if (lang === 'es') return item.summary_es ?? item.summary_en;
  return item.summary_i18n?.[lang] ?? item.summary_en;
}

/** Render a routing reason in the current UI language. */
export function reasonText(route: RouteResult, t: TFunction, lang: Language): string {
  if (!route.reasonParts?.length) return lang === 'es' ? route.reason_es : route.reason_en;
  return route.reasonParts
    .map((p) => {
      const params = { ...(p.params ?? {}) };
      if (params.bodyId) params.body = bodyName(route.body, lang);
      if (params.keepId && route.keepBody) params.body = bodyName(route.keepBody, lang);
      return t(`reasons.${p.key}`, params) as string;
    })
    .join(' ');
}

export function contactName(contact: ContactInfo, t: TFunction, lang: Language, fallbackBody?: Body | null): string {
  if (contact.kind === 'federal') return fallbackBody ? bodyName(fallbackBody, lang) : contact.name_en;
  if (contact.kind === 'principal')
    return contact.school ? (t('contact.principalNamed', { school: contact.school }) as string) : (t('contact.principal') as string);
  if (contact.kind === 'private') return t('contact.privateName') as string;
  return lang === 'es' ? contact.name_es : contact.name_en;
}

export function contactDetail(contact: ContactInfo, t: TFunction, lang: Language): string {
  if (contact.kind === 'federal') return t('contact.federalDetail') as string;
  if (contact.kind === 'principal') return t('contact.principalDetail') as string;
  if (contact.kind === 'private') return t('contact.privateDetail') as string;
  return lang === 'es' ? contact.detail_es : contact.detail_en;
}

/** Draft text for a language, falling back to English. */
export function draftText(draft: DraftResult | null | undefined, lang: Language): string {
  if (!draft) return '';
  return draft.drafts[lang] ?? draft.drafts.en ?? '';
}

export function withDraftText(draft: DraftResult, lang: Language, text: string, words: number): DraftResult {
  return { ...draft, drafts: { ...draft.drafts, [lang]: text }, word_count: words };
}
