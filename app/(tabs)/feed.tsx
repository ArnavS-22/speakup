import { toLanguage } from '@/lib/languages';
import { bodyName } from '@/lib/localize';
import { AppText, Hairline, Row, Screen } from '@/components/ui';
import { space } from '@/constants/theme';
import { useCivic } from '@/lib/civicContext';
import { formatMeetingDate } from '@/lib/data';
import { useFlow } from '@/lib/flowState';
import { useSettings } from '@/lib/settingsContext';
import { AgendaItem, Body } from '@/lib/types';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function FeedScreen() {
  const { t, i18n } = useTranslation();
  const { bodies, agendaItems, recent, fetchedAt } = useCivic();
  const { settings } = useSettings();
  const flow = useFlow();
  const lang = toLanguage(i18n.language);

  const followed = useMemo(() => new Set(settings.followedBodyIds), [settings.followedBodyIds]);
  const matchesTopics = (item: AgendaItem) =>
    settings.followedTopics.length === 0 || item.topics.some((tag) => settings.followedTopics.includes(tag));

  const meetings = useMemo(
    () =>
      bodies
        .filter((b): b is Body & { next_meeting: NonNullable<Body['next_meeting']> } =>
          Boolean(followed.has(b.id) && b.next_meeting),
        )
        .sort((a, b) => a.next_meeting.date.localeCompare(b.next_meeting.date)),
    [bodies, followed],
  );

  const recentItems = useMemo(
    () => recent.filter((item) => followed.has(item.body_id) && matchesTopics(item)).slice(0, 12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recent, followed, settings.followedTopics],
  );

  const nameOf = (id: string) => {
    const body = bodies.find((b) => b.id === id);
    return body ? bodyName(body, lang) : '';
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space * 4 }}>
        <AppText variant="title">{t('feed.title')}</AppText>
        <AppText variant="label" style={{ marginTop: space, marginBottom: space * 2 }}>
          {t('feed.source', { date: formatMeetingDate(fetchedAt.slice(0, 10)) })}
        </AppText>

        {meetings.length === 0 && recentItems.length === 0 ? (
          <AppText>{t('feed.empty')}</AppText>
        ) : null}

        {meetings.length > 0 ? (
          <AppText variant="label" uppercase style={{ marginTop: space, marginBottom: space }}>
            {t('feed.upcoming')}
          </AppText>
        ) : null}
        {meetings.map((body, index) => {
          const m = body.next_meeting;
          const items = agendaItems.filter((i) => i.body_id === body.id && i.meeting_date === m.date);
          return (
            <View key={body.id}>
              {index > 0 ? <Hairline /> : null}
              <Row>
                <AppText variant="label">{formatMeetingDate(m.date, m.time)}</AppText>
                <AppText style={{ marginTop: 4 }}>{bodyName(body, lang)}</AppText>
                {m.location ? (
                  <AppText variant="label" style={{ marginTop: 4 }}>
                    {m.location}
                  </AppText>
                ) : null}
                {items.length === 0 ? (
                  <AppText variant="label" style={{ marginTop: space }}>
                    {t('feed.agendaPending')}
                  </AppText>
                ) : null}
              </Row>
              {items.map((item) => (
                <Row
                  key={item.id}
                  accessibilityLabel={`${item.title}. ${t('feed.weighIn')}`}
                  onPress={() => {
                    flow.startAgendaItem(item);
                    router.push('/flow/confirm');
                  }}
                >
                  <AppText variant="label">{t('route.item', { number: item.item_number ?? '—' })}</AppText>
                  <AppText style={{ marginTop: 4 }}>{item.title}</AppText>
                  <AppText style={{ marginTop: space }}>{t('feed.weighIn')}</AppText>
                </Row>
              ))}
            </View>
          );
        })}

        {recentItems.length > 0 ? (
          <AppText variant="label" uppercase style={{ marginTop: space * 3, marginBottom: space }}>
            {t('feed.recent')}
          </AppText>
        ) : null}
        {recentItems.map((item, index) => {
          const name = nameOf(item.body_id);
          const date = formatMeetingDate(item.meeting_date);
          return (
            <View key={item.id}>
              {index > 0 ? <Hairline /> : null}
              <Row
                accessibilityLabel={`${item.title}. ${t('feed.followUp')}`}
                onPress={() => {
                  flow.reset();
                  flow.setText(t('home.followUpPrefix', { title: item.title, body: name, date }));
                  router.push('/');
                }}
              >
                <AppText variant="label">
                  {date}
                  {item.item_number ? `  ·  ${t('route.item', { number: item.item_number })}` : ''}
                </AppText>
                <AppText style={{ marginTop: 4 }}>{item.title}</AppText>
                <AppText variant="label" style={{ marginTop: 4 }}>
                  {name}
                </AppText>
                <AppText style={{ marginTop: space }}>{t('feed.followUp')}</AppText>
              </Row>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
