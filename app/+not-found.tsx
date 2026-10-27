import { Link, Stack } from 'expo-router';
import { AppText, Screen } from '@/components/ui';
import { space } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen style={{ justifyContent: 'center' }}>
        <AppText variant="label" uppercase>404</AppText>
        <AppText variant="title" style={{ marginTop: space }}>This screen doesn't exist.</AppText>
        <Link href="/" style={{ marginTop: space * 3 }}>
          <AppText>Go to home →</AppText>
        </Link>
      </Screen>
    </>
  );
}
