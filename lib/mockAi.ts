/**
 * Offline demo AI. Used when the Edge Function is not configured or fails.
 * It is intentionally simple: keyword rules for understanding (in 9 languages)
 * and fill-in templates for drafting. It never machine-translates the user's own words.
 */
import { PLEASANTON_PLACES } from '@/data/places';
import { LOCALES } from '@/i18n/locales';
import { targetWordCount, wordCount } from '@/lib/timing';
import {
  AgendaItem,
  AuthorityLevel,
  Body,
  DraftResult,
  FlowFields,
  Intent,
  Language,
  Scope,
  TopicTag,
  UnderstandResult,
} from '@/lib/types';

const INTENTS: Intent[] = ['problem', 'idea', 'agenda', 'question', 'thanks'];

function includesAny(hay: string, needles: string[]): boolean {
  return needles.some((n) => hay.includes(n));
}

function findPlace(text: string): string | null {
  const lower = text.toLowerCase();
  for (const place of PLEASANTON_PLACES) {
    const name = place.name.toLowerCase();
    const short = name.replace(/ (high school|middle school|elementary school|park)$/i, '');
    if (lower.includes(name) || (short.length > 3 && lower.includes(short))) {
      return place.name;
    }
  }
  if (/hart/i.test(text)) return 'Hart Middle School';
  return null;
}

/** Topic keywords across all supported languages (lowercased Latin; native scripts as-is). */
const TOPIC_KEYWORDS: [TopicTag, string[]][] = [
  ['pedestrian_safety', ['crosswalk', 'crossing', 'sidewalk', 'walk', 'cruce', 'peatón', 'peaton', 'banqueta',
    '人行横道', '斑马线', '过马路', '行人', '횡단보도', '보행', '건널목', 'क्रॉसवॉक', 'सड़क पार', 'पैदल', 'ਕ੍ਰਾਸਵਾਕ', 'ਸੜਕ ਪਾਰ', 'ਪੈਦਲ',
    'క్రాస్‌వాక్', 'రోడ్డు దాట', 'పాదచారు', 'qua đường', 'vạch kẻ', 'người đi bộ', 'tawiran', 'tumatawid', 'bangketa']],
  ['bike_infrastructure', ['bike', 'bicycle', 'bici', 'ciclovía', 'ciclovia', 'lane', '自行车', '单车', '자전거', 'साइकिल', 'ਸਾਈਕਲ', 'సైకిల్', 'xe đạp', 'bisikleta']],
  ['trails', ['trail', 'sendero', '步道', '산책로', 'ट्रेल', 'ਟ੍ਰੇਲ', 'ట్రయల్', 'đường mòn']],
  ['traffic', ['traffic', 'cars', 'speed', 'tráfico', 'trafico', 'carros', 'coches', '车', '交通', '자동차', '교통', '차들', 'गाड़ी', 'कार', 'ट्रैफ़िक', 'ਗੱਡੀ', 'ਕਾਰ', 'ਆਵਾਜਾਈ',
    'కార్లు', 'వాహన', 'ట్రాఫిక్', 'ô tô', 'giao thông', 'xe cộ', 'sasakyan', 'kotse', 'trapiko']],
  ['youth_spaces', ['teen', 'youth', 'jóvenes', 'jovenes', 'joven', 'estudiante', '青少年', '年轻人', '学生', '청소년', '학생', 'युवा', 'किशोर', 'छात्र', 'ਨੌਜਵਾਨ', 'ਵਿਦਿਆਰਥੀ',
    'యువత', 'విద్యార్థు', 'టీనేజ్', 'thanh thiếu niên', 'học sinh', 'giới trẻ', 'kabataan', 'estudyante']],
  ['youth_programs', ['program', 'programa', '项目', '프로그램', 'कार्यक्रम', 'ਪ੍ਰੋਗਰਾਮ', 'కార్యక్రమ', 'chương trình']],
  ['youth_events', ['event', 'evento', 'government day', '活动', '행사', 'आयोजन', 'ਸਮਾਗਮ', 'ఈవెంట్', 'sự kiện']],
  ['parks', ['park', 'parque', '公园', '공원', 'पार्क', 'ਪਾਰਕ', 'పార్క్', 'công viên', 'parke']],
  ['recreation_facilities', ['recreation', 'recreación', 'recreacion', 'gym', '娱乐', '여가', 'मनोरंजन', 'ਮਨੋਰੰਜਨ', 'వినోద', 'giải trí', 'libangan']],
  ['school_site', ['bathroom', 'baño', 'bano', 'locker', 'principal', 'campus', '厕所', '校长', '화장실', '교장', 'शौचालय', 'प्रिंसिपल', 'ਪ੍ਰਿੰਸੀਪਲ', 'ప్రిన్సిపాల్', 'nhà vệ sinh', 'hiệu trưởng', 'banyo']],
  ['school_policy', ['district', 'distrito', 'curriculum', 'start time', '学区', '교육구', 'डिस्ट्रिक्ट', 'ਡਿਸਟ੍ਰਿਕਟ', 'డిస్ట్రిక్ట్', 'học khu']],
  ['housing', ['housing', 'vivienda', 'rent', 'alquiler', '住房', '房租', '주거', '월세', 'आवास', 'किराया', 'ਰਿਹਾਇਸ਼', 'గృహ', 'nhà ở', 'pabahay', 'upa']],
  ['city_budget', ['budget', 'presupuesto', '预算', '예산', 'बजट', 'ਬਜਟ', 'బడ్జెట్', 'ngân sách', 'badyet']],
  ['library', ['library', 'biblioteca', '图书馆', '도서관', 'पुस्तकालय', 'लाइब्रेरी', 'ਲਾਇਬ੍ਰੇਰੀ', 'గ్రంథాలయ', 'లైబ్రరీ', 'thư viện', 'aklatan']],
  ['federal_issue', ['president', 'congress', 'immigration', 'federal', 'voting age', 'veterans affairs', 'livermore va', 'va hospital', 'va clinic', 'national lab', 'senate', 'congreso', 'inmigración', 'inmigracion', 'edad para votar',
    '国会', '联邦', '总统', '投票年龄', '국회', '연방', '대통령', '투표 연령', 'संसद', 'कांग्रेस', 'संघीय', 'राष्ट्रपति', 'ਕਾਂਗਰਸ', 'ਸੰਘੀ', 'కాంగ్రెస్', 'ఫెడరల్',
    'quốc hội', 'liên bang', 'tổng thống', 'kongreso', 'pederal', 'pangulo']],
  ['private_matter', ['landlord', 'neighbor dispute', 'private business', 'negocio privado']],
];

function collectTopics(text: string): TopicTag[] {
  const topics: TopicTag[] = [];
  for (const [tag, words] of TOPIC_KEYWORDS) {
    if (includesAny(text, words) && !topics.includes(tag)) topics.push(tag);
  }
  if (topics.length === 0) topics.push('other');
  return topics;
}

function inferScope(text: string, topics: TopicTag[]): Scope {
  if (topics.includes('federal_issue')) return 'federal';
  if (topics.includes('private_matter')) return 'private';
  if (topics.includes('school_site') && !topics.includes('school_district') && !topics.includes('school_policy')) {
    return 'single_school';
  }
  if (topics.includes('school_policy') || topics.includes('school_district')) return 'district';
  if (topics.includes('other') && topics.length === 1) return 'unclear';
  return 'city';
}

function inferIntent(text: string, chosen?: Intent): Intent {
  if (chosen) return chosen;
  if (includesAny(text, ['thank', 'gracias', 'worked', 'funcionó', 'funciono', '谢谢', '感谢', '감사', 'धन्यवाद', 'शुक्रिया', 'ਧੰਨਵਾਦ', 'ధన్యవాద', 'cảm ơn', 'salamat'])) return 'thanks';
  if (includesAny(text, ['?', '？', 'why', 'cómo', 'cuándo', 'pregunta', '为什么', '怎么', '왜', '어떻게', 'क्यों', 'कैसे', 'ਕਿਉਂ', 'ਕਿਵੇਂ', 'ఎందుకు', 'ఎలా', 'tại sao', 'làm sao', 'bakit', 'paano'])) return 'question';
  if (includesAny(text, ['should', 'idea', 'propose', 'proponer', 'what if', 'podríamos', 'podriamos', '建议', '应该', '제안', '했으면', 'सुझाव', 'चाहिए', 'ਸੁਝਾਅ', 'ਚਾਹੀਦਾ', 'సూచన', 'ఉండాలి', 'đề xuất', 'dapat', 'mungkahi'])) {
    return 'idea';
  }
  if (includesAny(text, ['agenda', 'item ', 'support', 'oppose', 'apoyo', 'opongo'])) return 'agenda';
  return 'problem';
}

function inferAsk(text: string): string | null {
  const m =
    text.match(/(?:please |por favor )(.{8,120})/i) ||
    text.match(/(?:should|deberían|deberian|quiero que)\s+(.{8,120})/i);
  return m ? m[1].replace(/[.?!].*$/, '').trim() : null;
}

function unsafeText(text: string): boolean {
  return includesAny(text, ['kill', 'bomb', 'i will hurt', 'te voy a matar', 'amenazo']);
}

/** Detect the language of the user's text from its script and a few common words. */
export function detectLanguage(text: string, uiLanguage: Language): Language {
  if (/[਀-੿]/.test(text)) return 'pa';
  if (/[ఀ-౿]/.test(text)) return 'te';
  if (/[ऀ-ॿ]/.test(text)) return 'hi';
  if (/[가-힯ᄀ-ᇿ]/.test(text)) return 'ko';
  if (/[一-鿿]/.test(text)) return 'zh';
  if (/[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(text)) return 'vi';
  const tlHits = (text.toLowerCase().match(/\b(ang|mga|ng|sa|ay|po|hindi|tawiran|kalsada|kabataan|sasakyan|paaralan|bakit|paano|dito)\b/g) ?? []).length;
  if (tlHits >= 2) return 'tl';
  if (/[áéíóúñ¿¡]/i.test(text) || /\b(cruce|peatón|carros|jóvenes|parque|el|los|las|que|por|para|una)\b/i.test(text)) return 'es';
  // Latin text with no other cues: keep a Latin-script UI language, otherwise English.
  return uiLanguage === 'es' || uiLanguage === 'vi' || uiLanguage === 'tl' ? uiLanguage : 'en';
}

/** Fill {{placeholders}} in a locale string. */
function fill(template: string, params: Record<string, string> = {}): string {
  return template.replace(/{{(\w+)}}/g, (_, k: string) => params[k] ?? '');
}

type TplKey = keyof (typeof LOCALES)['en']['draftTpl'];

function tpl(lang: Language, key: TplKey, params?: Record<string, string>): string {
  const own = (LOCALES[lang]?.draftTpl as Record<string, string> | undefined)?.[key];
  return fill(own ?? (LOCALES.en.draftTpl as Record<string, string>)[key], params);
}

/** Natural phrase for a topic in a language (falls back to the translated topic label). */
export function topicPhrase(tag: TopicTag | undefined, language: Language): string {
  const loc = LOCALES[language] ?? LOCALES.en;
  if (!tag || tag === 'other' || tag === 'private_matter') return tpl(language, 'topicFallback');
  const phrase = loc.topicPhrase?.[tag];
  if (phrase) return phrase;
  const label = (loc.topics as Record<string, string>)[tag];
  if (!label) return tpl(language, 'topicFallback');
  // Lowercase the first letter for Latin-script languages so it reads mid-sentence.
  return /^[A-Za-zÀ-ỹ]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

export function mockUnderstand(input: {
  text: string;
  chosenIntent?: Intent;
  language: Language;
}): UnderstandResult {
  const text = input.text.trim();
  const lower = text.toLowerCase();
  const topics = collectTopics(lower);
  const location = findPlace(text);
  const lang = detectLanguage(text, input.language);
  const topic = topicPhrase(topics[0], lang);

  return {
    intent: inferIntent(lower, input.chosenIntent),
    topics,
    scope: inferScope(lower, topics),
    location,
    ask: inferAsk(text),
    impact: null,
    summary: location ? tpl(lang, 'summaryNear', { topic, loc: location }) : tpl(lang, 'summary', { topic }),
    detected_language: lang,
    unsafe: unsafeText(lower),
  };
}

function intro(fields: FlowFields, lang: Language): string {
  const name = fields.speaker.name?.trim();
  const school = fields.speaker.school?.trim();
  if (name && school) return tpl(lang, 'introNameSchool', { name, school });
  if (name) return tpl(lang, 'introName', { name });
  if (school) return tpl(lang, 'introSchool', { school });
  return tpl(lang, 'introNone');
}

function sentence(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…。！？।]$/.test(cap) ? cap : `${cap}.`;
}

function bodyNameFor(body: Body, lang: Language): string {
  if (lang === 'en') return body.name_en;
  if (lang === 'es') return body.name_es;
  return body.i18n?.[lang]?.name ?? body.name_en;
}

/**
 * Build one draft. The user's own words (quote, ask, impact) only appear in the
 * draft written in the language they used; other languages get a clean structured version.
 */
function buildDraft(
  lang: Language,
  intent: Intent,
  fields: FlowFields,
  body: Body,
  agendaItem: AgendaItem | null,
  authority: AuthorityLevel,
  original: string,
  topics: TopicTag[],
  sourceLanguage: Language,
): string {
  const own = lang === sourceLanguage;
  const topic = topicPhrase(topics[0], lang);
  const loc = fields.location?.trim();
  const ask = own ? fields.ask?.trim() : '';
  const impact = own ? fields.impact?.trim() : '';
  const words = own ? original.trim().replace(/\s+/g, ' ').replace(/[.!?。！？।]+$/, '') : '';
  const stop = lang === 'zh' ? '。' : lang === 'hi' || lang === 'pa' ? '।' : '.';
  const endSentence = (t: string) => (t && !/[.!?…。！？।]$/.test(t) ? `${t}${stop}` : t);
  // Mid-sentence, a capitalized first word reads wrong ("because Kids walk…").
  const lowerFirst = (t: string) =>
    ['en', 'es', 'vi', 'tl'].includes(lang) && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;

  const quote = words ? endSentence(tpl(lang, 'quote', { words })) : '';
  const where = loc ? tpl(lang, 'where', { loc }) : '';
  const why = impact ? tpl(lang, 'whyImpact', { impact: lowerFirst(impact.replace(/[.!?。！？।]+$/, '')) }) : tpl(lang, 'whyDefault');
  const request = ask
    ? tpl(lang, 'request', { ask: sentence(ask) })
    : tpl(lang, 'requestDefault', { body: bodyNameFor(body, lang) });

  const parts: string[] = [intro(fields, lang)];

  if (intent === 'agenda' && agendaItem) {
    const stance =
      fields.position === 'oppose'
        ? tpl(lang, 'oppose')
        : fields.position === 'concerns'
          ? tpl(lang, 'concerns')
          : tpl(lang, 'support');
    parts.push(
      agendaItem.item_number
        ? tpl(lang, 'agendaLine', { number: agendaItem.item_number, title: agendaItem.title })
        : tpl(lang, 'agendaLineNoNum', { title: agendaItem.title }),
      stance,
      quote,
      why,
      ask ? request : '',
    );
  } else if (intent === 'idea') {
    parts.push(tpl(lang, 'ideaOpen', { topic }), quote, why, request);
  } else if (intent === 'question') {
    parts.push(tpl(lang, 'questionOpen', { topic }), quote, tpl(lang, 'questionClose'));
  } else if (intent === 'thanks') {
    parts.push(tpl(lang, 'thanksOpen', { topic }), quote, why, tpl(lang, 'keepDoing'));
  } else {
    parts.push(tpl(lang, 'problemOpen', { topic }), where, quote, why, request);
  }

  if (authority === 'can_listen') parts.push(tpl(lang, 'listen'));
  parts.push(tpl(lang, 'thanks'));
  // Chinese doesn't separate sentences with spaces.
  const joined = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return lang === 'zh' ? joined.replace(/([。！？：”])\s+/g, '$1') : joined;
}

function trimToLimit(text: string, limit: number): string {
  const words = text.split(/\s+/);
  if (words.length <= limit) return text;
  const cut = words.slice(0, Math.max(8, limit)).join(' ');
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('。'), cut.lastIndexOf('। '));
  return lastStop > cut.length * 0.5 ? cut.slice(0, lastStop + 1) : `${cut}…`;
}

export function mockDraft(input: {
  intent: Intent;
  fields: FlowFields;
  body: Body;
  agendaItem?: AgendaItem | null;
  authorityLevel: AuthorityLevel;
  timeLimitMinutes: number;
  language: Language;
  originalText: string;
  topics?: TopicTag[];
  sourceLanguage?: Language;
}): DraftResult {
  const cap = targetWordCount(input.timeLimitMinutes);
  const topics = input.topics ?? collectTopics(input.originalText.toLowerCase());
  const src: Language = input.sourceLanguage ?? input.language;
  const langs = Array.from(new Set<Language>(['en', src, input.language]));
  const drafts: DraftResult['drafts'] = {};
  for (const lang of langs) {
    drafts[lang] = trimToLimit(
      buildDraft(lang, input.intent, input.fields, input.body, input.agendaItem ?? null, input.authorityLevel, input.originalText, topics, src),
      cap,
    );
  }
  return { drafts, word_count: wordCount(drafts[input.language] ?? drafts.en ?? '') };
}

export function mockShorten(draft: string, timeLimitMinutes: number): string {
  return trimToLimit(draft, targetWordCount(timeLimitMinutes));
}

export function mockSummarizeItem(title: string, language: Language): string {
  return language === 'es'
    ? `Tema de demostración: ${title}. Resumen breve para lectura pública.`
    : `Demo item: ${title}. A short plain-language summary for public reading.`;
}

export { INTENTS };
