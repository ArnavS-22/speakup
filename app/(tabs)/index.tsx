import { toLanguage } from '@/lib/languages';
import { bodyName } from '@/lib/localize';
import { AppText, DemoPill, Field, Hairline, OutlinedButton, PrimaryButton, Row, Screen } from '@/components/ui';
import { space } from '@/constants/theme';
import { useCivic } from '@/lib/civicContext';
import { useFlow } from '@/lib/flowState';
import { useSettings } from '@/lib/settingsContext';
import { Intent } from '@/lib/types';
import { formatMeetingDate } from '@/lib/data';
import { APP_NAME } from '@/config';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const INTENTS: Intent[] = ['problem', 'idea', 'agenda', 'question', 'thanks'];

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const flow = useFlow();
  const { bodies } = useCivic();
  const { settings } = useSettings();
  const [focused, setFocused] = useState(false);
  const lang = toLanguage(i18n.language);

  const upcoming = useMemo(() => {
    const followed = new Set(settings.followedBodyIds);
    return bodies
      .filter((b) => followed.has(b.id) && b.next_meeting)
      .sort((a, b) => a.next_meeting!.date.localeCompare(b.next_meeting!.date))
      .slice(0, 2);
  }, [bodies, settings.followedBodyIds]);

  const go = () => {
    if (!flow.text.trim()) return;
    router.push('/flow/confirm');
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space * 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="label" uppercase>
            {APP_NAME}
          </AppText>
          <DemoPill />
        </View>
        <AppText variant="title" style={{ marginTop: space * 2, marginBottom: space * 2 }}>
          {t('home.headline')}
        </AppText>
        <Field
          value={flow.text}
          onChangeText={flow.setText}
          placeholder={t('home.placeholder')}
          multiline
          focused={focused}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={t('home.headline')}
        />
        <AppText variant="label" style={{ marginTop: space }} uppercase>
          {t('home.micHint')}
        </AppText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space * 2 }}>
          {INTENTS.map((intent) => (
            <OutlinedButton
              key={intent}
              label={t(`intent.${intent}`)}
              selected={flow.chosenIntent === intent}
              onPress={() => flow.setChosenIntent(flow.chosenIntent === intent ? null : intent)}
            />
          ))}
        </View>
        <AppText variant="label" uppercase>
          {t('home.intentsHint')}
        </AppText>

        <View style={{ marginTop: space * 2 }}>
          <PrimaryButton label={t('home.continue')} onPress={go} disabled={!flow.text.trim()} />
        </View>

        <AppText variant="label" uppercase style={{ marginTop: space * 4, marginBottom: space }}>
          {t('home.comingUp')}
        </AppText>
        {upcoming.map((body, index) => {
          const m = body.next_meeting!;
          return (
            <View key={body.id}>
              {index > 0 ? <Hairline /> : null}
              <Row accessibilityLabel={bodyName(body, lang)} onPress={() => router.push('/feed')}>
                <AppText variant="label">{formatMeetingDate(m.date, m.time)}</AppText>
                <AppText style={{ marginTop: 4 }}>{bodyName(body, lang)}</AppText>
                <AppText variant="label" style={{ marginTop: 4 }}>
                  {m.agendaPosted ? t('feed.agendaPosted') : t('feed.agendaPending')}
                </AppText>
              </Row>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
