import { BODIES } from '@/data/seed';
import { AGENDA_ITEMS } from './fixtures/agenda';
import { LOCALES } from '@/i18n/locales';
import { mockDraft, mockUnderstand } from '@/lib/mockAi';
import { routeIssue } from '@/lib/routing';
import { emptyFields } from '@/lib/questions';
import { LANGUAGE_CODES, Language } from '@/lib/types';

// The same complaint ("the crosswalk near Hart is dangerous, cars don't stop"), written natively.
const CROSSWALK: Record<Language, string> = {
  en: "the crosswalk by Hart is sketchy, cars don't stop",
  es: 'el cruce cerca de Hart es peligroso, los carros no paran',
  zh: 'Hart 中学附近的人行横道很危险，车都不停',
  hi: 'Hart स्कूल के पास क्रॉसवॉक खतरनाक है, गाड़ियाँ नहीं रुकतीं',
  pa: 'Hart ਸਕੂਲ ਕੋਲ ਕ੍ਰਾਸਵਾਕ ਖ਼ਤਰਨਾਕ ਹੈ, ਗੱਡੀਆਂ ਨਹੀਂ ਰੁਕਦੀਆਂ',
  ko: 'Hart 근처 횡단보도가 위험해요, 차들이 안 멈춰요',
  te: 'Hart దగ్గర క్రాస్‌వాక్ ప్రమాదకరంగా ఉంది, కార్లు ఆగడం లేదు',
  vi: 'vạch qua đường gần trường Hart rất nguy hiểm, xe không dừng lại',
  tl: 'delikado ang tawiran malapit sa Hart, hindi humihinto ang mga sasakyan',
};

/** Minimal t() over the raw locale files, like i18next with English fallback. */
function tFor(lang: Language) {
  return (key: string, params: Record<string, string> = {}) => {
    const get = (l: Language) => key.split('.').reduce<any>((o, k) => (o ? o[k] : undefined), LOCALES[l]);
    const raw = (get(lang) ?? get('en') ?? key) as string;
    return raw.replace(/{{(\w+)}}/g, (_, k) => params[k] ?? '');
  };
}

describe.each(LANGUAGE_CODES.map((l) => [l]))('language %s', (lang) => {
  const text = CROSSWALK[lang as Language];

  test('detects the language and routes the crosswalk to Bike, Pedestrian & Trails', () => {
    const u = mockUnderstand({ text, language: 'en' });
    expect(u.detected_language).toBe(lang);
    expect(u.topics).toContain('pedestrian_safety');
    const r = routeIssue({ tags: u.topics, scope: u.scope, location: u.location, bodies: BODIES, agendaItems: AGENDA_ITEMS });
    expect(r.body.id).toBe('pleasanton_bpt_committee');
    expect(r.authority).toBe('can_act');
    // Every reason part has a translation in this language.
    for (const part of r.reasonParts) {
      expect((LOCALES[lang as Language] as any).reasons[part.key]).toBeTruthy();
    }
    expect(tFor(lang as Language)('reasons.ownsBpt')).not.toMatch(/{{/);
  });

  test('drafts in the speaker’s language and in English, with no leftover placeholders', () => {
    const u = mockUnderstand({ text, language: 'en' });
    const r = routeIssue({ tags: u.topics, scope: u.scope, location: u.location, bodies: BODIES, agendaItems: AGENDA_ITEMS });
    const d = mockDraft({
      intent: u.intent,
      fields: { ...emptyFields(), location: u.location, speaker: { name: 'Arnav', asResident: true } },
      body: r.body,
      agendaItem: r.agendaItem,
      authorityLevel: r.authority,
      timeLimitMinutes: 3,
      language: u.detected_language,
      originalText: text,
      topics: u.topics,
      sourceLanguage: u.detected_language,
    });
    expect(d.drafts.en).toBeTruthy();
    expect(d.drafts[lang as Language]).toBeTruthy();
    for (const draft of Object.values(d.drafts)) expect(draft).not.toMatch(/{{|}}/);
    // The speaker's own words appear only in their own language's draft.
    expect(d.drafts[lang as Language]).toContain(text);
    if (lang !== 'en') expect(d.drafts.en).not.toContain(text);
  });
});

test('a federal issue in Chinese routes to Rep. Wahab', () => {
  const u = mockUnderstand({ text: '国会应该降低投票年龄', language: 'zh' });
  expect(u.detected_language).toBe('zh');
  const r = routeIssue({ tags: u.topics, scope: u.scope, location: u.location, bodies: BODIES, agendaItems: AGENDA_ITEMS });
  expect(r.body.id).toBe('rep_wahab_office');
  expect(r.authority).toBe('better_contact');
});
