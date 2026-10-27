import { FlowFields, Intent, QuestionField } from '@/lib/types';

const BASE_ORDER: QuestionField[] = ['location', 'ask', 'impact', 'speaker'];
const AGENDA_ORDER: QuestionField[] = [
  'location',
  'ask',
  'impact',
  'position',
  'speaker',
];

export const MAX_FOLLOWUPS = 4;

export function isFilled(fields: FlowFields, field: QuestionField): boolean {
  switch (field) {
    case 'location':
      return Boolean(fields.location && fields.location.trim());
    case 'ask':
      return Boolean(fields.ask && fields.ask.trim());
    case 'impact':
      return Boolean(fields.impact && fields.impact.trim());
    case 'position':
      return fields.position != null;
    case 'speaker':
      return Boolean(
        fields.speaker.asResident ||
          (fields.speaker.name && fields.speaker.name.trim()) ||
          (fields.speaker.school && fields.speaker.school.trim()),
      );
  }
}

/**
 * Return the next missing field, or null when the machine is done.
 * Asks at most MAX_FOLLOWUPS questions. Speaker may remain the default
 * "Pleasanton resident" if we hit the cap.
 */
export function nextMissingField(
  intent: Intent,
  fields: FlowFields,
  askedCount: number,
  skipped: QuestionField[] = [],
): QuestionField | 'done' {
  if (askedCount >= MAX_FOLLOWUPS) return 'done';
  const order = intent === 'agenda' ? AGENDA_ORDER : BASE_ORDER;
  for (const field of order) {
    if (skipped.includes(field)) continue;
    if (!isFilled(fields, field)) return field;
  }
  return 'done';
}

export function defaultSpeaker(): FlowFields['speaker'] {
  return { asResident: true };
}

export function emptyFields(): FlowFields {
  return {
    location: null,
    ask: null,
    impact: null,
    position: null,
    speaker: { asResident: false },
  };
}

export function finalizeFields(fields: FlowFields): FlowFields {
  if (isFilled(fields, 'speaker')) return fields;
  return { ...fields, speaker: defaultSpeaker() };
}
