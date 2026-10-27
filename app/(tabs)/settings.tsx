import { AppText, Hairline, OutlinedButton, Screen } from '@/components/ui';
import { space } from '@/constants/theme';
import { CA14_COMMUNITIES } from '@/data/ca14';
import { useCivic } from '@/lib/civicContext';
import { useSettings } from '@/lib/settingsContext';
import { LANGUAGES, toLanguage } from '@/lib/languages';
import { bodyName, howToSpeak } from '@/lib/localize';
import { TOPIC_TAGS } from '@/lib/types';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { settings, setLanguage, setCity, toggleBody, toggleTopic } = useSettings();
  const { bodies } = useCivic();
  const lang = toLanguage(i18n.language);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space * 6 }}>
        <AppText variant="title" style={{ marginBottom: space * 3 }}>
          {t('settings.title')}
        </AppText>

        <AppText variant="label" uppercase>
          {t('settings.language')}
        </AppText>
        <AppText style={{ marginTop: space }}>{t('settings.languageHint')}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space, marginBottom: space * 2 }}>
          {LANGUAGES.map((l) => (
            <OutlinedButton
              key={l.code}
              label={l.native}
              accessibilityLabel={l.english}
              selected={settings.language === l.code}
              onPress={() => setLanguage(l.code)}
            />
          ))}
        </View>
        <Hairline />

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('settings.city')}
        </AppText>
        {CA14_COMMUNITIES.map((city) => (
          <View key={city.id} style={{ paddingVertical: space, opacity: city.active ? 1 : 0.5 }}>
            <AppText>
              {city.name}
              {city.active ? '' : `  ·  ${t('settings.comingSoon')}`}
            </AppText>
            {city.active ? (
              <OutlinedButton
                label={city.name}
                selected={settings.cityId === city.id}
                onPress={() => setCity(city.id)}
              />
            ) : null}
          </View>
        ))}
        <Hairline />

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('settings.followBodies')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space }}>
          {bodies
            .filter((b) => b.level !== 'federal')
            .map((body) => (
              <OutlinedButton
                key={body.id}
                label={bodyName(body, lang)}
                selected={settings.followedBodyIds.includes(body.id)}
                onPress={() => toggleBody(body.id)}
              />
            ))}
        </View>
        <Hairline />

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('settings.followTopics')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space }}>
          {TOPIC_TAGS.map((tag) => (
            <OutlinedButton
              key={tag}
              label={t(`topics.${tag}`)}
              selected={settings.followedTopics.includes(tag)}
              onPress={() => toggleTopic(tag)}
            />
          ))}
        </View>
        <Hairline />

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('settings.commissions')}
        </AppText>
        <AppText style={{ marginTop: space, marginBottom: space * 2 }}>{t('settings.commissionsNote')}</AppText>
        {bodies.map((body) => (
          <View key={body.id} style={{ paddingVertical: space * 2, borderBottomWidth: 1, borderBottomColor: 'transparent' }}>
            <Hairline />
            <AppText style={{ marginTop: space * 2 }}>{bodyName(body, lang)}</AppText>
            <AppText variant="label" uppercase style={{ marginTop: space }}>
              {t('settings.topics')}
            </AppText>
            <AppText>{body.topics.map((tag) => t(`topics.${tag}`)).join(', ')}</AppText>
            <AppText variant="label" uppercase style={{ marginTop: space }}>
              {t('settings.schedule')}
            </AppText>
            <AppText>{body.meeting_pattern ?? '—'}</AppText>
            <AppText variant="label" uppercase style={{ marginTop: space }}>
              {t('settings.rules')}
            </AppText>
            <AppText>
              {howToSpeak(body, lang) ?? '—'}
            </AppText>
            <AppText variant="label" uppercase style={{ marginTop: space }}>
              {t('settings.timeLimit')}
            </AppText>
            <AppText>{t('common.minutes', { count: body.time_limit_minutes })}</AppText>
            <AppText variant="label" uppercase style={{ marginTop: space }}>
              {body.verified ? t('settings.verified') : t('settings.notVerified')}
            </AppText>
          </View>
        ))}

        <Hairline />
        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('settings.about')}
        </AppText>
        <AppText style={{ marginTop: space }}>{t('settings.aboutBody')}</AppText>
        <AppText style={{ marginTop: space }}>{t('settings.aiDisclosure')}</AppText>
      </ScrollView>
    </Screen>
  );
}
