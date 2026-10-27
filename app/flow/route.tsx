import { AppText, AuthorityBadge, FlowProgress, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { radius, space } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';
import { useCivic } from '@/lib/civicContext';
import { useFlow } from '@/lib/flowState';
import { toLanguage } from '@/lib/languages';
import { bodyName, contactDetail as contactDetailText, contactName as contactNameText, itemSummary, reasonText } from '@/lib/localize';
import { keepAsGeneralComment, routeIssue } from '@/lib/routing';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function RouteScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const flow = useFlow();
  const { bodies, agendaItems } = useCivic();
  const [showContact, setShowContact] = useState(false);
  const lang = toLanguage(i18n.language);

  useEffect(() => {
    const result = routeIssue({
      tags: flow.understand?.topics ?? [],
      scope: flow.understand?.scope ?? 'unclear',
      location: flow.fields.location ?? flow.understand?.location ?? null,
      preselectedItem: flow.preselectedItem,
      bodies,
      agendaItems,
    });
    flow.setRoute(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.understand, flow.fields.location, flow.preselectedItem, bodies, agendaItems]);

  const route = flow.route;
  if (!route) {
    return (
      <Screen>
        <FlowProgress step={2} />
      </Screen>
    );
  }

  const name = bodyName(route.body, lang);
  const reason = reasonText(route, t, lang);
  const summary = itemSummary(route.agendaItem, lang);
  const contactName = route.contact ? contactNameText(route.contact, t, lang, route.body) : undefined;
  const contactDetail = route.contact ? contactDetailText(route.contact, t, lang) : undefined;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space * 4 }}>
        <FlowProgress step={2} />
        <AppText variant="title">{t('route.title')}</AppText>
        <AppText style={{ marginTop: space * 2 }}>{name}</AppText>
        <View style={{ marginTop: space }}>
          <AuthorityBadge level={route.authority} />
        </View>
        <AppText style={{ marginTop: space * 2 }}>{reason}</AppText>
        {route.authority === 'can_listen' ? (
          <AppText style={{ marginTop: space }}>{t('route.listenNote')}</AppText>
        ) : null}

        <View
          style={{
            marginTop: space * 3,
            borderWidth: 1,
            borderColor: colors.hairline,
            borderRadius: radius,
            padding: space * 2,
          }}
        >
          {route.agendaItem ? (
            <>
              <AppText variant="label" uppercase>
                {t('route.item', { number: route.agendaItem.item_number ?? '—' })}
                
              </AppText>
              <AppText style={{ marginTop: space }}>{route.agendaItem.title}</AppText>
              {summary ? <AppText style={{ marginTop: space }}>{summary}</AppText> : null}
            </>
          ) : (
            <AppText variant="label" uppercase>
              {t('route.general')}
            </AppText>
          )}
        </View>

        {route.authority === 'better_contact' ? (
          <View style={{ marginTop: space * 3 }}>
            <AppText>{contactName}</AppText>
            {showContact ? (
              <>
                <AppText style={{ marginTop: space }}>{contactDetail}</AppText>
                {route.contact?.url ? (
                  <TextButton label={route.contact.url} onPress={() => Linking.openURL(route.contact!.url!)} />
                ) : (
                  <AppText variant="label" uppercase style={{ marginTop: space }}>
                    {t('meeting.todo')}
                  </AppText>
                )}
              </>
            ) : null}
            <PrimaryButton
              label={t('route.keep')}
              onPress={() => flow.setRoute(keepAsGeneralComment(route, bodies))}
            />
            <TextButton label={t('route.seeContact')} onPress={() => setShowContact(true)} />
          </View>
        ) : (
          <View style={{ marginTop: space * 3 }}>
            <PrimaryButton label={t('route.continueDraft')} onPress={() => router.push('/flow/draft')} />
          </View>
        )}

        {route.authority !== 'better_contact' ? null : (
          <TextButton
            label={t('route.continueDraft')}
            onPress={() => router.push('/flow/draft')}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
