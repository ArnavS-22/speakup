import { toLanguage } from '@/lib/languages';
import { bodyName } from '@/lib/localize';
import { AppText, Hairline, Row, Screen } from '@/components/ui';
import { space } from '@/constants/theme';
import { useCivic } from '@/lib/civicContext';
import { useFlow } from '@/lib/flowState';
import { keepAsGeneralComment, routeIssue } from '@/lib/routing';
import { loadComments } from '@/lib/storage';
import { SavedComment } from '@/lib/types';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CommentsScreen() {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState<SavedComment[]>([]);
  const flow = useFlow();
  const { bodies, agendaItems } = useCivic();
  const lang = toLanguage(i18n.language);

  useFocusEffect(
    useCallback(() => {
      loadComments().then(setComments);
    }, []),
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space * 4 }}>
        <AppText variant="title" style={{ marginBottom: space * 2 }}>
          {t('comments.title')}
        </AppText>
        {comments.length === 0 ? (
          <AppText>{t('comments.empty')}</AppText>
        ) : (
          comments.map((comment, index) => {
            const savedBody = bodies.find((b) => b.id === comment.bodyId);
            const name = savedBody ? bodyName(savedBody, lang) : lang === 'es' ? comment.bodyNameEs : comment.bodyNameEn;
            const snippet = comment.drafts[comment.language] ?? comment.drafts.en ?? '';
            return (
              <View key={comment.id}>
                {index > 0 ? <Hairline /> : null}
                <Row
                  accessibilityLabel={comment.agendaLabel}
                  onPress={() => {
                    const item =
                      agendaItems.find(
                        (i) => i.body_id === comment.bodyId && i.item_number === comment.itemNumber,
                      ) ?? null;
                    let route = routeIssue({
                      tags: [],
                      scope: 'city',
                      location: null,
                      preselectedItem: item,
                      bodies,
                      agendaItems,
                    });
                    const body = bodies.find((b) => b.id === comment.bodyId);
                    if (body) {
                      route = {
                        ...route,
                        body,
                        authority: comment.authority,
                        agendaItem: item,
                        generalComment: !item,
                      };
                    }
                    if (comment.authority === 'can_listen' && !item) {
                      route = keepAsGeneralComment(
                        { ...route, keepBody: body ?? route.body, authority: 'better_contact' },
                        bodies,
                      );
                    }
                    flow.loadSaved(comment, item, { ...route, authority: comment.authority });
                    router.push('/flow/draft');
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: space * 2 }}>
                    <AppText variant="label" uppercase style={{ width: 92 }}>
                      {comment.meetingDate ?? comment.createdAt.slice(0, 10)}
                    </AppText>
                    <View style={{ flex: 1 }}>
                      <AppText>{comment.agendaLabel}</AppText>
                      <AppText numberOfLines={2} style={{ marginTop: 4 }}>
                        {snippet}
                      </AppText>
                      <AppText variant="label" uppercase style={{ marginTop: space }}>
                        {name}  ·  {t(`comments.${comment.status}`)}
                      </AppText>
                    </View>
                  </View>
                </Row>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
