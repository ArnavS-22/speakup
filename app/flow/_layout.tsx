import { useTheme } from '@/components/useTheme';
import { Stack } from 'expo-router';

export default function FlowLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        animationDuration: 180,
      }}
    />
  );
}
