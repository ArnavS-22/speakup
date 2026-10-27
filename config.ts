import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  functionUrl?: string;
};

export const APP_NAME = 'Speak Up';

export const SUPABASE_URL =
  extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY =
  extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const FUNCTION_URL =
  extra.functionUrl || process.env.EXPO_PUBLIC_FUNCTION_URL || '';

export const WORDS_PER_MINUTE = 130;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const isAiConfigured = Boolean(FUNCTION_URL);
