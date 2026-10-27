import { AppText, Field, FlowProgress, OutlinedButton, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { space } from '@/constants/theme';
import { draftComment, shortenComment } from '@/lib/ai';
import { useFlow } from '@/lib/flowState';
import { updateComment } from '@/lib/storage';
import { formatEstimatedTime, isOverLimit, wordCount } from '@/lib/timing';
import { nativeName } from '@/lib/languages';
import { draftText, withDraftText } from '@/lib/localize';
import { Language } from '@/lib/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function DraftScreen() {
  const { t } = useTranslation();
  const flow = useFlow();
  const [loading, setLoading] = useState(!flow.draft);
  const [focused, setFocused] = useState(false);
  const route = flow.route;
  const lang = flow.draftLanguage;

  useEffect(() => {
    if (flow.draft || !route || !flow.understand) return;
    let cancelled = false;
    setLoading(true);
    draftComment({
      intent: flow.understand.intent,
      fields: flow.fields,
      body: route.body,
      agendaItem: route.agendaItem,
      authorityLevel: route.authority,
      timeLimitMinutes: route.body.time_limit_minutes,
      language: lang,
      originalText: flow.text,
      topics: flow.understand.topics,
      sourceLanguage: flow.understand.detected_language,
    }).then((result) => {
      if (cancelled) return;
      flow.setDraft(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.body.id, flow.understand?.intent]);

  if (loading || !flow.draft || !route) {
    return (
      <Screen>
        <FlowProgress step={3} />
        <AppText>{t('draft.loading')}</AppText>
      </Screen>
    );
  }

  const current = draftText(flow.draft, lang);
  // Toggle between the speaker's own language and English (the language of the meeting).
  const source = flow.understand?.detected_language ?? lang;
  const options = Array.from(new Set<Language>([source, 'en'])).filter((l) => !!flow.draft?.drafts[l]);
  const limit = route.body.time_limit_minutes;
  const over = isOverLimit(current, limit);

  const setCurrent = (text: string) => {
    const next = withDraftText(flow.draft!, lang, text, wordCount(text));
    flow.setDraft(next);
    if (flow.savedId) {
      void updateComment(flow.savedId, { drafts: next.drafts });
    }
  };

  const switchLang = (next: Language) => flow.setDraftLanguage(next);

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space * 4 }}>
        <FlowProgress step={3} />
        <AppText variant="title">{t('draft.title')}</AppText>
        {options.length > 1 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space, marginBottom: space }}>
            {options.map((l) => (
              <OutlinedButton key={l} label={nativeName(l)} selected={lang === l} onPress={() => switchLang(l)} />
            ))}
          </View>
        ) : null}
        <Field
          value={current}
          onChangeText={setCurrent}
          multiline
          focused={focused}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={t('draft.title')}
        />
        <AppText variant="label" uppercase style={{ marginTop: space }}>
          {t('draft.words', { count: wordCount(current) })}
        </AppText>
        <AppText variant="label" uppercase>
          {t('draft.time', { time: formatEstimatedTime(current) })}
        </AppText>
        {over ? (
          <AppText style={{ marginTop: space }}>{t('draft.over', { minutes: limit })}</AppText>
        ) : null}
        <TextButton
          label={t('draft.shorten')}
          onPress={async () => {
            const shortened = await shortenComment({
              draft: current,
              language: lang,
              timeLimitMinutes: limit,
            });
            setCurrent(shortened);
          }}
        />
        <AppText style={{ marginTop: space * 2 }}>{t('draft.privacy')}</AppText>
        <View style={{ marginTop: space * 3 }}>
          <PrimaryButton label={t('draft.continue')} onPress={() => router.push('/flow/practice')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
