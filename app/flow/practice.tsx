import { draftText } from '@/lib/localize';
import { AppText, FlowProgress, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { useTheme } from '@/components/useTheme';
import { space } from '@/constants/theme';
import { useFlow } from '@/lib/flowState';
import { formatClock } from '@/lib/timing';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function PracticeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const flow = useFlow();
  const limit = (flow.route?.body.time_limit_minutes ?? 3) * 60;
  const [remaining, setRemaining] = useState(limit);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const draft =
    draftText(flow.draft, flow.draftLanguage);
  const progress = remaining / limit;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space * 4 }}>
        <FlowProgress step={4} />
        <AppText variant="display">{formatClock(remaining)}</AppText>
        <View style={{ height: 2, backgroundColor: colors.hairline, marginTop: space, marginBottom: space * 2 }}>
          <View style={{ height: 2, width: `${Math.max(0, progress) * 100}%`, backgroundColor: colors.text }} />
        </View>
        <View style={{ flexDirection: 'row', gap: space * 2 }}>
          <TextButton
            label={running ? t('practice.pause') : t('practice.start')}
            onPress={() => setRunning((v) => !v)}
          />
          <TextButton
            label={t('practice.reset')}
            onPress={() => {
              setRunning(false);
              setRemaining(limit);
            }}
          />
        </View>
        <AppText variant="title" style={{ marginTop: space * 3 }}>
          {draft}
        </AppText>
        <AppText variant="label" uppercase style={{ marginTop: space * 3 }}>
          {t('practice.tip1')}
        </AppText>
        <AppText variant="label" uppercase>
          {t('practice.tip2')}
        </AppText>
        <AppText variant="label" uppercase>
          {t('practice.tip3')}
        </AppText>
        <View style={{ marginTop: space * 3 }}>
          <PrimaryButton label={t('practice.continue')} onPress={() => router.push('/flow/meeting')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
