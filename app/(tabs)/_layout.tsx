import { useTheme } from '@/components/useTheme';
import { APP_NAME } from '@/config';
import { iconStroke, type as typeScale } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { FileText, Landmark, MessageSquareText, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: {
          ...typeScale.label,
          textTransform: 'uppercase',
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8 } : null),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarLabel: APP_NAME,
          tabBarIcon: ({ color }) => <MessageSquareText color={color} size={22} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t('tabs.feed'),
          tabBarLabel: t('tabs.feedTab'),
          tabBarIcon: ({ color }) => <Landmark color={color} size={22} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="comments"
        options={{
          title: t('tabs.comments'),
          tabBarLabel: t('tabs.commentsTab'),
          tabBarIcon: ({ color }) => <FileText color={color} size={22} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <Settings color={color} size={22} strokeWidth={iconStroke} />,
        }}
      />
    </Tabs>
  );
}
