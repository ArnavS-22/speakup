import { AppText, FlowProgress, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { space } from '@/constants/theme';
import { addMeetingToCalendar } from '@/lib/calendar';
import { formatMeetingDate } from '@/lib/data';
import { useCivic } from '@/lib/civicContext';
import { useFlow } from '@/lib/flowState';
import { saveComment, updateComment } from '@/lib/storage';
import { toLanguage } from '@/lib/languages';
import { bodyName, draftText, howToSpeak } from '@/lib/localize';
import { SavedComment } from '@/lib/types';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function MeetingScreen() {
  const { t, i18n } = useTranslation();
  const flow = useFlow();
  const [message, setMessage] = useState<string | null>(null);
  const route = flow.route;
  const lang = toLanguage(i18n.language);
  const { fetchedAt } = useCivic();

  if (!route || !flow.draft) {
    return (
      <Screen>
        <FlowProgress step={5} />
      </Screen>
    );
  }

  const name = bodyName(route.body, lang);
  const how = howToSpeak(route.body, lang);
  const next = route.body.next_meeting ?? null;
  const when = route.agendaItem
    ? formatMeetingDate(route.agendaItem.meeting_date, route.agendaItem.meeting_time)
    : next
      ? formatMeetingDate(next.date, next.time)
      : t('meeting.notScheduled');
  const where = next?.location ?? route.body.location ?? t('meeting.todo');
  const agendaLabel = route.agendaItem
    ? route.agendaItem.title
    : t('route.general');

  const persist = async () => {
    const comment: SavedComment = {
      id: flow.savedId ?? `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      bodyId: route.body.id,
      bodyNameEn: route.body.name_en,
      bodyNameEs: route.body.name_es,
      meetingDate: route.agendaItem?.meeting_date ?? next?.date ?? null,
      meetingTime: route.agendaItem?.meeting_time ?? next?.time ?? null,
      meetingLocation: next?.location ?? route.body.location,
      agendaLabel,
      itemNumber: route.agendaItem?.item_number ?? null,
      drafts: flow.draft!.drafts,
      language: flow.draftLanguage,
      status: 'drafted',
      intent: flow.understand?.intent ?? 'problem',
      authority: route.authority,
      timeLimitMinutes: route.body.time_limit_minutes,
      howToSpeakEn: route.body.how_to_speak_en,
      howToSpeakEs: route.body.how_to_speak_es,
      acceptsWritten: route.body.accepts_written,
      writtenInstructions: route.body.written_instructions,
    };
    await saveComment(comment);
    flow.setSavedId(comment.id);
    setMessage(t('meeting.saved'));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space * 4 }}>
        <FlowProgress step={5} />
        <AppText variant="title">{t('meeting.title')}</AppText>
        <AppText style={{ marginTop: space * 2 }}>{name}</AppText>
        {next ? (
          <AppText variant="label" style={{ marginTop: space }}>
            {next.name}
          </AppText>
        ) : null}

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('meeting.when')}
        </AppText>
        <AppText>{when}</AppText>

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('meeting.where')}
        </AppText>
        <AppText>{where}</AppText>

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {route.agendaItem ? t('route.item', { number: route.agendaItem.item_number ?? '—' }) : t('meeting.what')}
        </AppText>
        <AppText>{agendaLabel}</AppText>

        <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
          {t('meeting.how')}
        </AppText>
        <AppText>{how ?? t('meeting.todo')}</AppText>

        {route.body.accepts_written && route.body.written_instructions ? (
          <>
            <AppText variant="label" uppercase style={{ marginTop: space * 2 }}>
              {t('meeting.written')}
            </AppText>
            <AppText>{route.body.written_instructions}</AppText>
          </>
        ) : null}

        {route.body.level === 'city' ? (
          <AppText variant="label" style={{ marginTop: space * 2 }}>
            {t('feed.source', { date: formatMeetingDate(fetchedAt.slice(0, 10)) })}
          </AppText>
        ) : null}

        {message ? <AppText style={{ marginTop: space * 2 }}>{message}</AppText> : null}

        <View style={{ marginTop: space * 3 }}>
          <PrimaryButton
            label={t('meeting.calendar')}
            onPress={async () => {
              const result = await addMeetingToCalendar({
                body: route.body,
                item: route.agendaItem,
                title: `${name} — ${agendaLabel}`,
                notes: draftText(flow.draft, flow.draftLanguage),
              });
              if (result === 'added') setMessage(t('meeting.calendarAdded'));
              else if (result === 'denied') setMessage(t('meeting.calendarDenied'));
              else setMessage(t('meeting.notScheduled'));
            }}
          />
          <TextButton label={t('meeting.save')} onPress={persist} />
          {flow.savedId ? (
            <TextButton
              label={t('comments.markDelivered')}
              onPress={async () => {
                await persist();
                await updateComment(flow.savedId!, { status: 'delivered' });
                setMessage(t('comments.delivered'));
              }}
            />
          ) : null}
        </View>
        <AppText style={{ marginTop: space * 4 }}>{t('meeting.closing')}</AppText>
      </ScrollView>
    </Screen>
  );
}
