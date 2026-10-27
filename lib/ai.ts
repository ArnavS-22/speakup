import { FUNCTION_URL } from '@/config';
import { mockDraft, mockShorten, mockSummarizeItem, mockUnderstand } from '@/lib/mockAi';
import {
  AgendaItem,
  AuthorityLevel,
  Body,
  DraftResult,
  FlowFields,
  Intent,
  Language,
  TopicTag,
  UnderstandResult,
  TOPIC_TAGS,
} from '@/lib/types';

export type AiSource = 'live' | 'demo';

let lastSource: AiSource = FUNCTION_URL ? 'live' : 'demo';

export function getAiSource(): AiSource {
  return lastSource;
}

async function callFunction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!FUNCTION_URL) {
    throw new Error('unconfigured');
  }
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    throw new Error(`function ${res.status}`);
  }
  return (await res.json()) as T;
}

function validUnderstand(value: UnderstandResult): boolean {
  const intents = ['problem', 'idea', 'agenda', 'question', 'thanks'];
  if (!intents.includes(value.intent)) return false;
  if (!Array.isArray(value.topics) || value.topics.some((t) => !TOPIC_TAGS.includes(t as TopicTag))) {
    return false;
  }
  return typeof value.unsafe === 'boolean';
}

export async function understand(input: {
  text: string;
  chosenIntent?: Intent;
  language: Language;
}): Promise<UnderstandResult> {
  try {
    const data = await callFunction<UnderstandResult>('understand', input);
    if (!validUnderstand(data)) throw new Error('invalid');
    lastSource = 'live';
    return data;
  } catch {
    lastSource = 'demo';
    return mockUnderstand(input);
  }
}

export async function draftComment(input: {
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
}): Promise<DraftResult> {
  try {
    const data = await callFunction<DraftResult>('draft', {
      intent: input.intent,
      fields: input.fields,
      body: { id: input.body.id, name_en: input.body.name_en, name_es: input.body.name_es },
      agendaItem: input.agendaItem
        ? {
            item_number: input.agendaItem.item_number,
            title: input.agendaItem.title,
          }
        : null,
      authorityLevel: input.authorityLevel,
      speaker: input.fields.speaker,
      timeLimitMinutes: input.timeLimitMinutes,
      language: input.language,
      sourceLanguage: input.sourceLanguage ?? input.language,
      originalText: input.originalText,
    });
    // Live function returns { drafts: { en, <lang> }, word_count }.
    if (!data.drafts || !data.drafts.en) throw new Error('invalid');
    lastSource = 'live';
    return data;
  } catch {
    lastSource = 'demo';
    return mockDraft(input);
  }
}

export async function shortenComment(input: {
  draft: string;
  language: Language;
  timeLimitMinutes: number;
}): Promise<string> {
  try {
    const data = await callFunction<{ draft: string }>('shorten', input);
    if (!data.draft) throw new Error('invalid');
    lastSource = 'live';
    return data.draft;
  } catch {
    lastSource = 'demo';
    return mockShorten(input.draft, input.timeLimitMinutes);
  }
}

export async function summarizeItem(input: {
  title: string;
  language: Language;
}): Promise<string> {
  try {
    const data = await callFunction<{ summary: string }>('summarize_item', input);
    if (!data.summary) throw new Error('invalid');
    lastSource = 'live';
    return data.summary;
  } catch {
    lastSource = 'demo';
    return mockSummarizeItem(input.title, input.language);
  }
}
