import { AppSettings, Language, SavedComment, TopicTag } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COMMENTS_KEY = 'speakup.comments';
const SETTINGS_KEY = 'speakup.settings';

export const DEFAULT_FOLLOWED_BODIES = [
  'pleasanton_youth_commission',
  'pleasanton_bpt_committee',
  'pleasanton_parks_rec',
  'pleasanton_library_commission',
  'pleasanton_city_council',
  'pusd_board',
];

export function defaultSettings(language: Language): AppSettings {
  return {
    language,
    cityId: 'pleasanton',
    followedBodyIds: DEFAULT_FOLLOWED_BODIES,
    followedTopics: [],
  };
}

export async function loadComments(): Promise<SavedComment[]> {
  const raw = await AsyncStorage.getItem(COMMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedComment[];
    // Migrate comments saved before multi-language drafts.
    return parsed.map((c) =>
      c.drafts ? c : { ...c, drafts: { en: c.draft_en ?? '', ...(c.draft_es ? { es: c.draft_es } : {}) } },
    );
  } catch {
    return [];
  }
}

export async function saveComment(comment: SavedComment): Promise<void> {
  const existing = await loadComments();
  const next = [comment, ...existing.filter((c) => c.id !== comment.id)];
  await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(next));
}

export async function updateComment(id: string, patch: Partial<SavedComment>): Promise<void> {
  const existing = await loadComments();
  const next = existing.map((c) => (c.id === id ? { ...c, ...patch } : c));
  await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(next));
}

export async function loadSettings(fallbackLang: Language): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings(fallbackLang);
  try {
    const parsed = JSON.parse(raw) as AppSettings;
    return {
      ...defaultSettings(fallbackLang),
      ...parsed,
      followedBodyIds: parsed.followedBodyIds ?? DEFAULT_FOLLOWED_BODIES,
      followedTopics: (parsed.followedTopics ?? []) as TopicTag[],
    };
  } catch {
    return defaultSettings(fallbackLang);
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
