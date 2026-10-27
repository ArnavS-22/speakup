export const TOPIC_TAGS = [
  'youth_programs',
  'youth_spaces',
  'youth_events',
  'teen_services',
  'pedestrian_safety',
  'bike_infrastructure',
  'trails',
  'traffic',
  'parks',
  'recreation_facilities',
  'school_site',
  'school_policy',
  'school_district',
  'city_budget',
  'housing',
  'public_safety',
  'environment',
  'library',
  'arts',
  'federal_issue',
  'private_matter',
  'other',
] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

export type Intent = 'problem' | 'idea' | 'agenda' | 'question' | 'thanks';

export type Scope =
  | 'single_school'
  | 'district'
  | 'city'
  | 'federal'
  | 'private'
  | 'unclear';

export type AuthorityLevel = 'can_act' | 'can_listen' | 'better_contact';

/** Supported languages. English is the fallback for any missing text. */
export const LANGUAGE_CODES = ['en', 'es', 'zh', 'hi', 'pa', 'ko', 'te', 'vi', 'tl'] as const;
export type Language = (typeof LANGUAGE_CODES)[number];

/** Text in several languages; missing languages fall back to English. */
export type LocalizedText = Partial<Record<Language, string>>;

export type BodyLevel = 'city' | 'school_district' | 'federal';

export type CommentStatus = 'drafted' | 'delivered';

export type QuestionField = 'location' | 'ask' | 'impact' | 'position' | 'speaker';

export type Position = 'support' | 'oppose' | 'concerns';

export type NextMeeting = {
  /** YYYY-MM-DD, local */
  date: string;
  /** e.g. 6:30 PM */
  time: string;
  location: string | null;
  name: string;
  agendaPosted: boolean;
  source_url: string;
};

export type Body = {
  id: string;
  city: string;
  level: BodyLevel;
  name_en: string;
  name_es: string;
  topics: TopicTag[];
  meeting_pattern: string | null;
  location: string | null;
  time_limit_minutes: number;
  how_to_speak_en: string | null;
  how_to_speak_es: string | null;
  accepts_written: boolean;
  written_instructions: string | null;
  contact_url: string | null;
  verified: boolean;
  /** Real next meeting from the city's calendar, when one is posted. */
  next_meeting?: NextMeeting | null;
  /** Names / instructions in languages beyond en/es. */
  i18n?: Partial<Record<Language, { name?: string; how_to_speak?: string }>>;
};

export type AgendaItem = {
  id: string;
  body_id: string;
  meeting_date: string;
  meeting_time: string | null;
  item_number: string | null;
  title: string;
  summary_en: string | null;
  summary_es: string | null;
  topics: TopicTag[];
  source_url: string | null;
  is_demo: boolean;
  /** Plain-language summaries in languages beyond en/es. */
  summary_i18n?: LocalizedText;
};

export type UnderstandResult = {
  intent: Intent;
  topics: TopicTag[];
  scope: Scope;
  location: string | null;
  ask: string | null;
  impact: string | null;
  summary: string;
  detected_language: Language;
  unsafe: boolean;
};

export type Speaker = {
  name?: string;
  school?: string;
  asResident: boolean;
};

export type FlowFields = {
  location: string | null;
  ask: string | null;
  impact: string | null;
  position: Position | null;
  speaker: Speaker;
};

export type ContactInfo = {
  kind: 'federal' | 'principal' | 'private' | 'other';
  /** Place name for the principal contact (shown in any language). */
  school?: string | null;
  name_en: string;
  name_es: string;
  detail_en: string;
  detail_es: string;
  url: string | null;
};

export type RouteResult = {
  body: Body;
  authority: AuthorityLevel;
  reason_en: string;
  reason_es: string;
  /** Language-neutral reason, rendered with i18n keys under `reasons.*`. */
  reasonParts: ReasonPart[];
  agendaItem: AgendaItem | null;
  generalComment: boolean;
  contact: ContactInfo | null;
  keepBody: Body | null;
};

export type ReasonPart = { key: string; params?: Record<string, string> };

export type DraftResult = {
  /** Drafts keyed by language. Always includes English plus the speaker's language. */
  drafts: LocalizedText;
  word_count: number;
};

export type SavedComment = {
  id: string;
  createdAt: string;
  bodyId: string;
  bodyNameEn: string;
  bodyNameEs: string;
  meetingDate: string | null;
  meetingTime: string | null;
  meetingLocation: string | null;
  agendaLabel: string;
  itemNumber: string | null;
  drafts: LocalizedText;
  /** Legacy fields from saved comments before multi-language support. */
  draft_en?: string;
  draft_es?: string;
  language: Language;
  status: CommentStatus;
  intent: Intent;
  authority: AuthorityLevel;
  timeLimitMinutes: number;
  howToSpeakEn: string | null;
  howToSpeakEs: string | null;
  acceptsWritten: boolean;
  writtenInstructions: string | null;
};

export type AppSettings = {
  language: Language;
  cityId: string;
  followedBodyIds: string[];
  followedTopics: TopicTag[];
};
