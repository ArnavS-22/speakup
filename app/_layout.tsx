import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts as useInter,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  useFonts as useMono,
} from '@expo-google-fonts/jetbrains-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { CivicProvider } from '@/lib/civicContext';
import { FlowProvider } from '@/lib/flowState';
import { SettingsProvider } from '@/lib/settingsContext';
import { useTheme } from '@/components/useTheme';
import '@/i18n';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [interLoaded, interError] = useInter({ Inter_400Regular, Inter_600SemiBold });
  const [monoLoaded, monoError] = useMono({ JetBrainsMono_400Regular });
  const loaded = interLoaded && monoLoaded;

  useEffect(() => {
    if (interError) throw interError;
    if (monoError) throw monoError;
  }, [interError, monoError]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SettingsProvider>
      <CivicProvider>
        <FlowProvider>
          <RootNav />
        </FlowProvider>
      </CivicProvider>
    </SettingsProvider>
  );
}

function RootNav() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="flow" />
      </Stack>
    </>
  );
}
