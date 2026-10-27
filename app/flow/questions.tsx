import { AppText, Field, FlowProgress, OutlinedButton, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { space } from '@/constants/theme';
import { PLEASANTON_PLACES } from '@/data/places';
import { useFlow } from '@/lib/flowState';
import { finalizeFields, nextMissingField } from '@/lib/questions';
import { FlowFields, Position, QuestionField } from '@/lib/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Asks only the fields still missing, one per screen (max 4).
 * The current question is fixed while the person types; answers are committed on Next,
 * so typing the first letter of an answer never skips ahead.
 */
export default function QuestionsScreen() {
  const { t } = useTranslation();
  const flow = useFlow();
  const intent = flow.understand?.intent ?? flow.chosenIntent ?? 'problem';

  // Pinned question for this step, plus a local draft of the answer.
  const [field, setField] = useState<QuestionField | 'done'>(() =>
    nextMissingField(intent, flow.fields, flow.askedCount),
  );
  const [text, setText] = useState('');
  const [name, setName] = useState(flow.fields.speaker.name ?? '');
  const [school, setSchool] = useState(flow.fields.speaker.school ?? '');
  const [asResident, setAsResident] = useState(flow.fields.speaker.asResident);
  const [focused, setFocused] = useState(false);

  // Nothing left to ask (e.g. everything came from the first message): go straight to routing.
  useEffect(() => {
    if (field === 'done') {
      flow.setFields(finalizeFields(flow.fields));
      router.replace('/flow/route');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  if (field === 'done') return null;

  /** Commit this step's answer (or skip it) and move to the next missing field. */
  const advance = (patch: Partial<FlowFields>) => {
    const merged: FlowFields = { ...flow.fields, ...patch };
    const asked = flow.askedCount + 1;
    const following = nextMissingField(intent, merged, asked);
    const committed = following === 'done' || field === 'speaker' ? finalizeFields(merged) : merged;
    flow.setFields(committed);
    flow.bumpAsked();
    if (following === 'done') {
      router.push('/flow/route');
      return;
    }
    setText('');
    setField(following);
  };

  const answer = (): Partial<FlowFields> => {
    const value = text.trim() || null;
    if (field === 'location') return { location: value };
    if (field === 'ask') return { ask: value };
    if (field === 'impact') return { impact: value };
    if (field === 'speaker') {
      return { speaker: { name: name.trim() || undefined, school: school.trim() || undefined, asResident } };
    }
    return {};
  };

  // Skipping marks the field as asked but leaves it empty; the draft uses a neutral default.
  const skip = () => {
    if (field === 'speaker') return advance({ speaker: { asResident: true } });
    return advance({});
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled">
        <FlowProgress step={1} />
        <AppText variant="title">{t(`questions.${field}`)}</AppText>

        {field === 'position' ? (
          <View style={{ marginTop: space * 2 }}>
            {(['support', 'oppose', 'concerns'] as Position[]).map((pos) => (
              <OutlinedButton key={pos} label={t(`questions.${pos}`)} onPress={() => advance({ position: pos })} />
            ))}
          </View>
        ) : field === 'speaker' ? (
          <View style={{ marginTop: space * 2 }}>
            <Field
              value={name}
              onChangeText={setName}
              placeholder={t('questions.name')}
              focused={focused}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              accessibilityLabel={t('questions.name')}
            />
            <View style={{ height: space }} />
            <Field
              value={school}
              onChangeText={setSchool}
              placeholder={t('questions.school')}
              accessibilityLabel={t('questions.school')}
            />
            <View style={{ marginTop: space }}>
              <OutlinedButton
                label={t('questions.resident')}
                selected={asResident}
                onPress={() => setAsResident((v) => !v)}
              />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: space * 2 }}>
            <Field
              value={text}
              onChangeText={setText}
              placeholder={t(`questions.${field}`)}
              multiline={field !== 'location'}
              focused={focused}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              accessibilityLabel={t(`questions.${field}`)}
            />
            {field === 'location' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space }}>
                <AppText variant="label" uppercase style={{ width: '100%', marginBottom: space }}>
                  {t('questions.quickPicks')}
                </AppText>
                {PLEASANTON_PLACES.map((place) => (
                  <OutlinedButton
                    key={place.id}
                    label={place.name}
                    selected={text === place.name}
                    onPress={() => setText(place.name)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        )}

        <View style={{ marginTop: space * 3 }}>
          {field !== 'position' ? <PrimaryButton label={t('questions.next')} onPress={() => advance(answer())} /> : null}
          <TextButton label={t('questions.skip')} onPress={skip} />
        </View>
      </ScrollView>
    </Screen>
  );
}
