import { toLanguage } from '@/lib/languages';
import { AppText, Field, FlowProgress, OutlinedButton, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { space } from '@/constants/theme';
import { understand } from '@/lib/ai';
import { useFlow } from '@/lib/flowState';
import { emptyFields, finalizeFields, nextMissingField } from '@/lib/questions';
import { Intent, TopicTag, TOPIC_TAGS } from '@/lib/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const INTENTS: Intent[] = ['problem', 'idea', 'agenda', 'question', 'thanks'];

export default function ConfirmScreen() {
  const { t, i18n } = useTranslation();
  const flow = useFlow();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<'intent' | 'topic' | 'location' | null>(null);
  const lang = toLanguage(i18n.language);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    understand({
      text: flow.text,
      chosenIntent: flow.chosenIntent ?? undefined,
      language: lang,
    }).then((result) => {
      if (cancelled) return;
      flow.setUnderstand(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // Run once when the screen opens with the current text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.text, flow.chosenIntent]);

  const result = flow.understand;

  const continueFlow = () => {
    if (!result) return;
    // Don't default the speaker yet, so "How should we introduce you?" still gets asked.
    const fields = {
      ...emptyFields(),
      ...flow.fields,
      location: flow.fields.location ?? result.location,
      ask: flow.fields.ask ?? result.ask,
      impact: flow.fields.impact ?? result.impact,
    };
    const next = nextMissingField(result.intent, fields, 0);
    flow.setFields(next === 'done' ? finalizeFields(fields) : fields);
    if (next === 'done') router.push('/flow/route');
    else router.push('/flow/questions');
  };

  if (loading || !result) {
    return (
      <Screen>
        <FlowProgress step={0} />
        <AppText>{t('confirm.loading')}</AppText>
      </Screen>
    );
  }

  if (result.unsafe) {
    return (
      <Screen>
        <FlowProgress step={0} />
        <AppText variant="title">{t('confirm.unsafe')}</AppText>
        <View style={{ marginTop: space * 3 }}>
          <PrimaryButton
            label={t('confirm.rewrite')}
            onPress={() => {
              flow.reset();
              router.replace('/(tabs)');
            }}
          />
        </View>
      </Screen>
    );
  }

  const topic = result.topics[0];
  const location = result.location ?? t('confirm.unknownLocation');

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled">
        <FlowProgress step={0} />
        <AppText variant="title">
          {t('confirm.soundsLike', {
            intent: t(`intent.${result.intent}`),
            topic: t(`topics.${topic ?? 'other'}`),
            location,
          })}
        </AppText>
        <AppText variant="label" uppercase style={{ marginTop: space }}>
          {t('confirm.edit')}
        </AppText>

        <Pressable onPress={() => setEditing('intent')} accessibilityRole="button" style={{ marginTop: space * 2, minHeight: 44, justifyContent: 'center' }}>
          <AppText variant="label" uppercase>
            {t('confirm.intentLabel')}
          </AppText>
          <AppText>{t(`intent.${result.intent}`)}</AppText>
        </Pressable>
        {editing === 'intent' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space }}>
            {INTENTS.map((intent) => (
              <OutlinedButton
                key={intent}
                label={t(`intent.${intent}`)}
                selected={result.intent === intent}
                onPress={() => {
                  flow.setUnderstand({ ...result, intent });
                  flow.setChosenIntent(intent);
                  setEditing(null);
                }}
              />
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => setEditing('topic')} accessibilityRole="button" style={{ marginTop: space * 2, minHeight: 44, justifyContent: 'center' }}>
          <AppText variant="label" uppercase>
            {t('confirm.topicLabel')}
          </AppText>
          <AppText>{t(`topics.${topic ?? 'other'}`)}</AppText>
        </Pressable>
        {editing === 'topic' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space }}>
            {TOPIC_TAGS.map((tag: TopicTag) => (
              <OutlinedButton
                key={tag}
                label={t(`topics.${tag}`)}
                selected={result.topics.includes(tag)}
                onPress={() => {
                  flow.setUnderstand({ ...result, topics: [tag] });
                  setEditing(null);
                }}
              />
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => setEditing('location')} accessibilityRole="button" style={{ marginTop: space * 2, minHeight: 44, justifyContent: 'center' }}>
          <AppText variant="label" uppercase>
            {t('confirm.locationLabel')}
          </AppText>
          <AppText>{location}</AppText>
        </Pressable>
        {editing === 'location' ? (
          <View style={{ marginTop: space }}>
            <Field
              value={result.location ?? ''}
              onChangeText={(text) => flow.setUnderstand({ ...result, location: text || null })}
              placeholder={t('questions.location')}
              accessibilityLabel={t('confirm.locationLabel')}
            />
          </View>
        ) : null}

        <View style={{ marginTop: space * 3 }}>
          <PrimaryButton label={t('confirm.yes')} onPress={continueFlow} />
          <TextButton label={t('common.back')} onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}
